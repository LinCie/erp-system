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

    let query = this.db
      .selectFrom("items")
      .where("space_id", "=", spaceId)
      .where("status", "=", status)
      .limit(limit)
      .offset((page - 1) * limit);

    if (search) {
      const searches = search.split(" ").filter(Boolean);

      query = query.where((eb) => {
        const filters = searches.map((s) =>
          eb.or([
            eb("name", "like", `%${s}%`),
            eb("sku", "like", `%${s}%`),
          ])
        );
        return eb.and(filters);
      });
    }

    if (sort && order) {
      query = query.orderBy(sort, order);
    }

    switch (type) {
      case "full":
        query = query.selectAll();
        break;

      case "partial":
        query = query.select([
          "name",
          "description",
          "price",
          "weight",
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

    return await query.execute() as Item[];
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

    return item;
  }

  async create(data: Item) {
    const created = await this.db
      .insertInto("items")
      .values({ ...data, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Item not created");
    }

    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Omit<Partial<Item>, "id">) {
    const updated = await this.db
      .updateTable("items")
      .set({ ...data, updated_at: new Date() })
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
