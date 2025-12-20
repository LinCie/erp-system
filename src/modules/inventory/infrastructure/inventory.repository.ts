import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyInventoriesProps,
  IInventoryRepository,
} from "../application/inventory-repository.interface.ts";
import { InventoryEntity as Inventory } from "../domain/inventory.entity.ts";
import { InventoryMapper } from "./inventory.mapper.ts";

class InventoryRepository implements IInventoryRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: InventoryMapper,
  ) {}

  async getMany(props: GetManyInventoriesProps) {
    const { page = 1, limit = 10, status = "active" } = props;

    const countQuery = this.db
      .selectFrom("inventories")
      .where("status", "=", status)
      .where("deleted_at", "is", null);

    const { total } = await countQuery
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    const result = await this.db
      .selectFrom("inventories")
      .where("status", "=", status)
      .where("deleted_at", "is", null)
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return {
      data: result.map((row) => this.mapper.toEntity(row)),
      metadata: { totalItems, totalPages, currentPage: page, itemsPerPage: limit },
    };
  }

  async getOne(id: number) {
    const result = await this.db
      .selectFrom("inventories")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Inventory not found");
    }

    return this.mapper.toEntity(result);
  }

  async create(data: Omit<Inventory, "id">) {
    const insertable = this.mapper.toInsertable(data as Inventory);

    const created = await this.db
      .insertInto("inventories")
      .values({ ...insertable, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Inventory not created");
    }

    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Partial<Inventory>) {
    const updateable = this.mapper.toUpdateable(data);

    await this.db
      .updateTable("inventories")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  async delete(id: number) {
    await this.db
      .updateTable("inventories")
      .where("id", "=", id)
      .set({ status: "archived", updated_at: new Date(), deleted_at: new Date() })
      .executeTakeFirst();
  }
}

export { InventoryRepository };
