import type { ItemEntity as Item } from "../domain/item.entity.ts";

import { jsonArrayFrom } from "kysely/helpers/mysql";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyItemsProps,
  IItemRepository,
} from "../application/item-repository.interface.ts";
import { ItemMapper } from "./item.mapper.ts";

class ItemRepository implements IItemRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: ItemMapper,
  ) {}

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

    let countQuery = this.db
      .selectFrom("items")
      .where("space_id", "=", spaceId)
      .where("status", "=", status)
      .where("deleted_at", "is", null);

    let query = this.db
      .selectFrom("items")
      .where("space_id", "=", spaceId)
      .where("status", "=", status)
      .orderBy(sort, order)
      .limit(limit)
      .offset((page - 1) * limit);

    if (search) {
      const searches = search.split(" ").filter(Boolean);

      const searchFilter = (eb: typeof countQuery) =>
        eb.where((eb) => {
          const filters = searches.map((s) =>
            eb.or([
              eb("name", "like", `%${s}%`),
              eb("sku", "like", `%${s}%`),
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
            .select(["space_id", "balance", "notes", "status", "cost_per_unit"])
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

  async getOne(id: number) {
    const item = await this.db
      .selectFrom("items")
      .where("id", "=", id)
      .select([
        "id",
        "space_id",
        "name",
        "description",
        "sku",
        "price",
        "cost",
        "status",
        "weight",
        "notes",
        "images",
      ])
      .executeTakeFirst();

    if (!item) {
      throw new Error("Item not found");
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

    return this.getOne(safeBigintToNumber(created.insertId));
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

    return this.getOne(id);
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
