import type { Insertable, Selectable, Updateable } from "kysely";
import type { Items as ItemDatabase } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ItemEntity as Item } from "../domain/item.entity.ts";

import { jsonArrayFrom } from "kysely/helpers/mysql";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyItemsProps,
  IItemRepository,
} from "../application/item-repository.interface.ts";

class ItemRepository implements IItemRepository {
  constructor(private readonly db: PersistenceType) {}

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
          "sku",
          "name",
          "price",
          "description",
          "weight",
          "notes",
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
      data: result.map((row) => this.mapToEntity(row)),
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
        "sku",
        "name",
        "price",
        "cost",
        "status",
        "description",
        "weight",
        "notes",
      ])
      .executeTakeFirst();

    if (!item) {
      throw new Error("Item not found");
    }

    return this.mapToEntity(item);
  }

  async create(data: Item) {
    const insertable = this.mapToInsertable(data);

    const created = await this.db
      .insertInto("items")
      .values(insertable)
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Item not created");
    }

    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Partial<Item>) {
    const updateable = this.mapToUpdateable(data);

    const updated = await this.db
      .updateTable("items")
      .set(updateable)
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

  private mapToEntity(row: Partial<Selectable<ItemDatabase>>): Item {
    return {
      id: row.id!,
      name: row.name!,
      cost: row.cost!,
      price: row.price!,
      weight: row.weight!,
      status: row.status!,
      code: row.code ?? undefined,
      description: row.description ?? undefined,
      sku: row.sku ?? undefined,
      notes: row.notes ?? undefined,
      model_id: row.model_id ?? undefined,
      model_type: row.model_type ?? undefined,
      parent_id: row.parent_id ?? undefined,
      parent_type: row.parent_type ?? undefined,
      space_id: row.space_id ?? undefined,
      space_type: row.space_type ?? undefined,
      type_id: row.type_id ?? undefined,
      type_type: row.type_type ?? undefined,
      primary_code: row.primary_code ?? undefined,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
  }

  private mapToInsertable(
    item: Item,
  ): Insertable<ItemDatabase> {
    return {
      name: item.name,
      code: item.code,
      description: item.description,
      sku: item.sku,
      cost: item.cost,
      price: item.price,
      weight: item.weight,
      notes: item.notes,
      model_id: item.model_id,
      model_type: item.model_type,
      parent_id: item.parent_id,
      parent_type: item.parent_type,
      space_id: item.space_id,
      space_type: item.space_type,
      type_id: item.type_id,
      type_type: item.type_type,
      primary_code: item.primary_code,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at,
    };
  }

  private mapToUpdateable(item: Partial<Item>): Updateable<ItemDatabase> {
    return {
      name: item.name,
      code: item.code,
      description: item.description,
      sku: item.sku,
      cost: item.cost,
      price: item.price,
      weight: item.weight,
      notes: item.notes,
      model_id: item.model_id,
      model_type: item.model_type,
      parent_id: item.parent_id,
      parent_type: item.parent_type,
      space_id: item.space_id,
      space_type: item.space_type,
      type_id: item.type_id,
      type_type: item.type_type,
      primary_code: item.primary_code,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at,
    };
  }
}

export { ItemRepository };
