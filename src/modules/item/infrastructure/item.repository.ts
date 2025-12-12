import { jsonArrayFrom } from "kysely/helpers/mysql";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyItemsProps,
  IItemRepository,
} from "../application/item-repository.interface.ts";
import { ItemEntity as Item } from "../domain/item.entity.ts";

class ItemRepository implements IItemRepository {
  constructor(private readonly db: PersistenceType) {}

  async getMany(props: GetManyItemsProps) {
    const {
      spaceId,
      page = 1,
      limit = 10,
      status = "active",
      search,
      sort,
      order,
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

    if (sort && order) {
      query = query.orderBy(sort, order);
    }

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
          "images",
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
      data: result as Item[],
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
      .select(["id", "name", "status"])
      .executeTakeFirst();

    if (!item) {
      throw new Error("Item not found");
    }

    return item as Item;
  }

  async create(data: Item) {
    const insertData = {
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
      attributes: data.attributes ? JSON.stringify(data.attributes) : null,
      dimension: data.dimension ? JSON.stringify(data.dimension) : null,
      images: data.images ? JSON.stringify(data.images) : null,
      files: data.files ? JSON.stringify(data.files) : null,
      links: data.links ? JSON.stringify(data.links) : null,
      options: data.options ? JSON.stringify(data.options) : null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      variants: data.variants ? JSON.stringify(data.variants) : null,
    };

    const created = await this.db
      .insertInto("items")
      .values(insertData)
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Item not created");
    }

    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Omit<Partial<Item>, "id">) {
    const updateData = {
      ...data,
      updated_at: new Date(),
      attributes: data.attributes ? JSON.stringify(data.attributes) : data.attributes,
      dimension: data.dimension ? JSON.stringify(data.dimension) : data.dimension,
      images: data.images ? JSON.stringify(data.images) : data.images,
      files: data.files ? JSON.stringify(data.files) : data.files,
      links: data.links ? JSON.stringify(data.links) : data.links,
      options: data.options ? JSON.stringify(data.options) : data.options,
      tags: data.tags ? JSON.stringify(data.tags) : data.tags,
      variants: data.variants ? JSON.stringify(data.variants) : data.variants,
    };

    const updated = await this.db
      .updateTable("items")
      .set(updateData)
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
