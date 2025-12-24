import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import { ITransactionDetailRepository } from "../application/transaction-detail-repository.interface.ts";
import { TransactionDetailEntity as TransactionDetail } from "../domain/transaction-detail.entity.ts";
import { TransactionDetailMapper } from "./transaction-detail.mapper.ts";

/**
 * Repository implementation for transaction detail data access.
 * Handles database operations for transaction line items (details).
 */
class TransactionDetailRepository implements ITransactionDetailRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: TransactionDetailMapper,
  ) {}

  /**
   * Retrieves all transaction details for a specific transaction.
   * Only returns non-deleted details (deleted_at is null).
   *
   * @param transaction_id - Transaction ID to fetch details for
   * @returns Promise resolving to array of transaction details
   *
   * @example
   * ```typescript
   * const details = await repo.getMany(1);
   * console.log(details.length); // Number of line items
   * ```
   */
  async getMany(transaction_id: number): Promise<TransactionDetail[]> {
    const result = await this.db
      .selectFrom("transaction_details")
      .where("transaction_id", "=", transaction_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    return result.map((row) => this.mapper.toEntity(row));
  }

  /**
   * Retrieves a single transaction detail by ID.
   *
   * @param id - Transaction detail ID
   * @returns Promise resolving to the transaction detail entity
   * @throws {Error} TRANSACTION_DETAIL_NOT_FOUND if detail doesn't exist or is deleted
   *
   * @example
   * ```typescript
   * const detail = await repo.getOne(1);
   * console.log(detail.sku, detail.quantity, detail.price);
   * ```
   */
  async getOne(id: number): Promise<TransactionDetail> {
    const result = await this.db
      .selectFrom("transaction_details")
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!result) throw new Error("TRANSACTION_DETAIL_NOT_FOUND");
    return this.mapper.toEntity(result);
  }

  /**
   * Creates a single transaction detail.
   *
   * @param data - Transaction detail data without ID
   * @returns Promise resolving to the created transaction detail
   * @throws {Error} TRANSACTION_DETAIL_CREATE_FAILED if creation fails
   *
   * @example
   * ```typescript
   * const detail = await repo.create({
   *   transaction_id: 1,
   *   sku: 'ITEM-001',
   *   name: 'Product A',
   *   quantity: '2.00',
   *   price: '50.00',
   *   discount: '0.00',
   *   cost_per_unit: '30.00',
   *   debit: '2.00',
   *   credit: '0.00'
   * });
   * ```
   */
  async create(
    data: Omit<TransactionDetail, "id">,
  ): Promise<TransactionDetail> {
    const insertable = this.mapper.toInsertable(data as TransactionDetail);

    const created = await this.db
      .insertInto("transaction_details")
      .values({
        ...insertable,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .executeTakeFirst();

    if (!created.insertId) throw new Error("TRANSACTION_DETAIL_CREATE_FAILED");
    return this.getOne(safeBigintToNumber(created.insertId));
  }

  /**
   * Creates multiple transaction details in a single operation.
   * More efficient than calling create() multiple times.
   *
   * @param data - Array of transaction detail data without IDs
   * @returns Promise resolving to array of created transaction details
   * @returns Empty array if input array is empty
   *
   * @example
   * ```typescript
   * const details = await repo.createMany([
   *   { transaction_id: 1, sku: 'A', quantity: '2.00', price: '50.00', ... },
   *   { transaction_id: 1, sku: 'B', quantity: '1.00', price: '30.00', ... }
   * ]);
   * console.log(details.length); // 2
   * ```
   */
  async createMany(
    data: Omit<TransactionDetail, "id">[],
  ): Promise<TransactionDetail[]> {
    if (data.length === 0) return [];

    const insertables = data.map((item) =>
      this.mapper.toInsertable(item as TransactionDetail)
    );

    const values = insertables.map((item) => ({
      ...item,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await this.db
      .insertInto("transaction_details")
      .values(values)
      .execute();

    // Get the transaction_id from the first item to retrieve all created details
    const transaction_id = data[0].transaction_id;
    return this.getMany(transaction_id);
  }

  /**
   * Updates an existing transaction detail with partial data.
   *
   * @param id - Transaction detail ID
   * @param data - Partial transaction detail data to update
   * @returns Promise resolving to the updated transaction detail
   *
   * @example
   * ```typescript
   * const updated = await repo.update(1, {
   *   quantity: '3.00',
   *   price: '55.00'
   * });
   * ```
   */
  async update(
    id: number,
    data: Partial<TransactionDetail>,
  ): Promise<TransactionDetail> {
    const updateable = this.mapper.toUpdateable(data);

    await this.db
      .updateTable("transaction_details")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  /**
   * Soft deletes a single transaction detail.
   * Sets deleted_at timestamp without physically removing the record.
   *
   * @param id - Transaction detail ID
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * ```typescript
   * await repo.delete(1);
   * ```
   */
  async delete(id: number): Promise<void> {
    // Soft delete: set deleted_at timestamp
    await this.db
      .updateTable("transaction_details")
      .where("id", "=", id)
      .set({
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();
  }

  /**
   * Soft deletes all transaction details for a specific transaction.
   * Used when deleting a transaction or replacing all its details.
   * Sets deleted_at timestamp for all matching details.
   *
   * @param transaction_id - Transaction ID whose details should be deleted
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * ```typescript
   * await repo.deleteByTransactionId(1);
   * ```
   */
  async deleteByTransactionId(transaction_id: number): Promise<void> {
    // Soft delete all details for a transaction
    await this.db
      .updateTable("transaction_details")
      .where("transaction_id", "=", transaction_id)
      .set({
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .execute();
  }
}

export { TransactionDetailRepository };
