import type { ItemEntity as Item } from "../domain/item.entity.ts";

import { jsonArrayFrom } from "kysely/helpers/mysql";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyItemsProps,
  GetOneItemProps,
  IItemRepository,
} from "../application/item-repository.interface.ts";
import { ItemMapper } from "./item.mapper.ts";

class ItemRepository implements IItemRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: ItemMapper,
  ) {}

  /**
   * Get all child space IDs for a given space (recursive)
   */
  private async getSpaceAndChildrenIds(spaceId: number): Promise<number[]> {
    const result: number[] = [spaceId];

    const children = await this.db
      .selectFrom("spaces")
      .where("parent_id", "=", spaceId)
      .where("parent_type", "=", "SPACE")
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    for (const child of children) {
      const childIds = await this.getSpaceAndChildrenIds(child.id);
      result.push(...childIds);
    }

    return result;
  }

  /**
   * Get space and its parent ID
   */
  private async getSpaceAndParentIds(spaceId: number): Promise<number[]> {
    const space = await this.db
      .selectFrom("spaces")
      .where("id", "=", spaceId)
      .select(["id", "parent_id"])
      .executeTakeFirst();

    if (!space) {
      return [spaceId];
    }

    const ids = [spaceId];
    if (space.parent_id) {
      ids.push(space.parent_id);
    }

    return ids;
  }

  async getMany(props: GetManyItemsProps) {
    const {
      spaceId,
      page = 1,
      limit = 10,
      status = "active",
      sort = "created_at",
      order = "asc",
      search,
      type,
      withInventory = true,
    } = props;

    // Get space and parent IDs for item filtering
    const spaceAndParentIds = await this.getSpaceAndParentIds(spaceId);

    // Get space and all children IDs for inventory filtering
    const spaceAndChildrenIds = await this.getSpaceAndChildrenIds(spaceId);

    let countQuery = this.db
      .selectFrom("items")
      .where("space_id", "in", spaceAndParentIds)
      .where("deleted_at", "is", null);

    switch (status) {
      case "discounted":
        countQuery = countQuery
          .where("status", "=", "active")
          .where("price_discount", "is not", null)
          .where("price_discount", "!=", "0");
        break;
      case "unknown":
        countQuery = countQuery.where("status", "not in", [
          "active",
          "inactive",
        ]);
        break;
      case "all":
        break;
      default:
        countQuery = countQuery.where("status", "=", status);
        break;
    }

    let query = this.db
      .selectFrom("items")
      .where("space_id", "in", spaceAndParentIds)
      .where("deleted_at", "is", null)
      .orderBy(sort, order)
      .limit(limit)
      .offset((page - 1) * limit);

    switch (status) {
      case "discounted":
        query = query
          .where("status", "=", "active")
          .where("price_discount", "is not", null)
          .where("price_discount", "!=", "0");
        break;
      case "unknown":
        query = query.where("status", "not in", [
          "active",
          "inactive",
        ]);
        break;
      case "all":
        break;
      default:
        query = query.where("status", "=", status);
        break;
    }

    if (search) {
      const searches = search.split(" ").filter(Boolean);

      const searchFilter = (eb: typeof countQuery) =>
        eb.where((eb) => {
          const filters = searches.map((s) =>
            eb.or([
              eb("name", "like", `%${s}%`),
              eb("sku", "like", `%${s}%`),
              eb("code", "like", ""),
            ])
          );
          return eb.and(filters);
        });

      countQuery = searchFilter(countQuery);
      query = searchFilter(query);
    }

    const { total } = await countQuery
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    switch (type) {
      case "full":
        query = query.selectAll();
        break;

      case "partial":
        query = query.select([
          "id",
          "space_id",
          "name",
          "description",
          "sku",
          "price",
          "code",
          "price_discount",
          "files",
          "cost",
          "status",
          "weight",
          "notes",
          "images",
        ]);
        break;
    }

    // Include inventory data using a subquery if requested
    if (withInventory) {
      query = query.select((eb) => [
        jsonArrayFrom(
          eb
            .selectFrom("inventories")
            .where("inventories.model_type", "=", "SUP")
            .where("inventories.space_id", "in", spaceAndChildrenIds)
            .leftJoin("spaces", "spaces.id", "inventories.space_id")
            .select([
              "inventories.balance",
              "inventories.notes",
              "inventories.status",
              "inventories.cost_per_unit",
              "spaces.name as space_name",
            ])
            .whereRef("inventories.item_id", "=", "items.id"),
        ).as("inventories"),
      ]);
    }

    const result = await query.execute();

    return {
      data: result.map((row) => this.mapper.toEntity(row)),
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getOne(props: GetOneItemProps) {
    const { id, spaceId, withInventory = false } = props;

    let query = this.db
      .selectFrom("items")
      .where("id", "=", id)
      .select([
        "id",
        "space_id",
        "name",
        "description",
        "sku",
        "price",
        "code",
        "price_discount",
        "files",
        "cost",
        "status",
        "weight",
        "notes",
        "images",
      ]);

    if (withInventory) {
      // If spaceId is provided, filter inventories by space and its children
      let spaceAndChildrenIds: number[] | null = null;
      if (spaceId) {
        spaceAndChildrenIds = await this.getSpaceAndChildrenIds(spaceId);
      }

      query = query.select((eb) => {
        let inventoryQuery = eb
          .selectFrom("inventories")
          .where("inventories.model_type", "=", "SUP")
          .leftJoin("spaces", "spaces.id", "inventories.space_id")
          .select([
            "inventories.balance",
            "inventories.notes",
            "inventories.status",
            "inventories.cost_per_unit",
            "spaces.name as space_name",
          ])
          .whereRef("inventories.item_id", "=", "items.id");

        // Filter by space and children if spaceId is provided
        if (spaceAndChildrenIds) {
          inventoryQuery = inventoryQuery.where(
            "inventories.space_id",
            "in",
            spaceAndChildrenIds,
          );
        }

        return [jsonArrayFrom(inventoryQuery).as("inventories")];
      });
    }

    const item = await query.executeTakeFirst();

    if (!item) {
      throw new Error("ITEM_NOT_FOUND");
    }

    return this.mapper.toEntity(item);
  }

  async create(data: Item) {
    const insertable = this.mapper.toInsertable(data);

    const created = await this.db
      .insertInto("items")
      .values({
        ...insertable,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Item not created");
    }

    return this.getOne({ id: safeBigintToNumber(created.insertId) });
  }

  async update(id: number, data: Partial<Item>) {
    const updateable = this.mapper.toUpdateable(data);

    const updated = await this.db
      .updateTable("items")
      .set({
        ...updateable,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .executeTakeFirst();

    if (!updated) {
      throw new Error("Item not updated");
    }

    return this.getOne({ id });
  }

  async delete(id: number) {
    const deleted = await this.db
      .updateTable("items")
      .where("id", "=", id).set({
        status: "archived",
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();

    if (!deleted) {
      throw new Error("Item not deleted");
    }
  }
}

export { ItemRepository };
