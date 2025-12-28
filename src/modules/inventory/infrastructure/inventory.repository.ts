import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyInventoriesProps,
  GetMutationsProps,
  IInventoryRepository,
} from "../application/inventory-repository.interface.ts";
import {
  InventoryEntity as Inventory,
  InventoryMutation,
} from "../domain/inventory.entity.ts";
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
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
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

  async getMutations(props: GetMutationsProps) {
    const {
      inventory_id,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 10,
    } = props;

    const offset = (page - 1) * limit;

    // Base query
    let baseQuery = this.db
      .selectFrom("transaction_details as td")
      .innerJoin("transactions as t", "td.transaction_id", "t.id")
      .where("td.detail_id", "=", inventory_id)
      .where("t.model_type", "=", "JS")
      .where("td.deleted_at", "is", null)
      .where("t.deleted_at", "is", null)
      .orderBy("t.sent_time", "asc");

    // Search filter
    if (search) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("t.number", "like", `%${search}%`),
          eb("t.sender_notes", "like", `%${search}%`),
        ])
      );
    }

    // Calculate initial balance (before start_date)
    let initBalance = 0;
    if (start_date) {
      const initQuery = this.db
        .selectFrom("transaction_details as td")
        .innerJoin("transactions as t", "td.transaction_id", "t.id")
        .where("td.detail_id", "=", inventory_id)
        .where("t.model_type", "=", "JS")
        .where("t.sent_time", "<", new Date(start_date))
        .where("td.deleted_at", "is", null)
        .where("t.deleted_at", "is", null)
        .select(["td.debit", "td.credit"])
        .execute();

      const initResults = await initQuery;
      initBalance = initResults.reduce((sum, row) => {
        return sum + (parseFloat(row.debit) - parseFloat(row.credit));
      }, 0);

      baseQuery = baseQuery.where("t.sent_time", ">=", new Date(start_date));
    }

    // End date filter
    if (end_date) {
      const endDateTime = new Date(end_date);
      endDateTime.setHours(23, 59, 59, 999);
      baseQuery = baseQuery.where("t.sent_time", "<=", endDateTime);
    }

    // Get total count
    const countResult = await baseQuery
      .select((eb) => eb.fn.count("td.id").as("total"))
      .executeTakeFirstOrThrow();
    const totalItems = parseInt(countResult.total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    // Get data before current page for initial balance calculation
    const initialsQuery = baseQuery
      .select(["td.debit", "td.credit"])
      .limit(offset);
    const initials = await initialsQuery.execute();

    const initialDebit = initials.reduce(
      (sum, row) => sum + parseFloat(row.debit),
      0,
    );
    const initialCredit = initials.reduce(
      (sum, row) => sum + parseFloat(row.credit),
      0,
    );
    const initialBalance = initialDebit - initialCredit + initBalance;

    // Get current page data
    const results = await baseQuery
      .select([
        "td.id",
        "td.transaction_id",
        "td.notes",
        "td.model_type",
        "td.cost_per_unit",
        "td.debit",
        "td.credit",
        "t.sent_time",
        "t.number",
        "t.sender_notes",
        "t.handler_notes",
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    const pageDebit = results.reduce(
      (sum, row) => sum + parseFloat(row.debit),
      0,
    );
    const pageCredit = results.reduce(
      (sum, row) => sum + parseFloat(row.credit),
      0,
    );

    const data: InventoryMutation[] = results.map((row) => ({
      id: row.id,
      transaction_id: row.transaction_id,
      sent_time: row.sent_time ?? undefined,
      number: row.number ?? undefined,
      sender_notes: row.sender_notes ?? undefined,
      handler_notes: row.handler_notes ?? undefined,
      notes: row.notes ?? undefined,
      model_type: row.model_type ?? undefined,
      cost_per_unit: row.cost_per_unit,
      debit: row.debit,
      credit: row.credit,
    }));

    return {
      data,
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
      summary: {
        initialBalance,
        initialDebit,
        initialCredit,
        pageDebit,
        pageCredit,
      },
    };
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
      .set({
        status: "archived",
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();
  }
}

export { InventoryRepository };
