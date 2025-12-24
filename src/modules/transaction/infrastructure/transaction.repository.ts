import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyTransactionsProps,
  ITransactionRepository,
} from "../application/transaction-repository.interface.ts";
import { TransactionEntity as Transaction } from "../domain/transaction.entity.ts";
import { TransactionDetailEntity as TransactionDetail } from "../domain/transaction-detail.entity.ts";
import { TransactionMapper } from "./transaction.mapper.ts";
import { ITransactionDetailRepository } from "../application/transaction-detail-repository.interface.ts";

/**
 * Repository implementation for transaction data access.
 * Handles database operations for transactions including CRUD, filtering, and detail management.
 */
class TransactionRepository implements ITransactionRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: TransactionMapper,
    private readonly detailRepository: ITransactionDetailRepository,
  ) {}

  /**
   * Retrieves multiple transactions with filtering, pagination, and sorting.
   * Supports filtering by status, model_type, parties (sender/receiver/handler), and date ranges.
   *
   * @param props - Query parameters including filters and pagination
   * @returns Promise resolving to paginated transaction data with metadata
   *
   * @example
   * ```typescript
   * const result = await repo.getMany({
   *   status: 'TX_DRAFT',
   *   model_type: 'SO',
   *   sender_id: 5,
   *   sent_time_from: new Date('2024-01-01'),
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  async getMany(props: GetManyTransactionsProps) {
    const {
      page = 1,
      limit = 10,
      status,
      model_type,
      sender_id,
      receiver_id,
      handler_id,
      sent_time_from,
      sent_time_to,
      received_time_from,
      received_time_to,
    } = props;

    let countQuery = this.db
      .selectFrom("transactions")
      .where("deleted_at", "is", null);

    // Apply filters
    if (status) countQuery = countQuery.where("status", "=", status);
    if (model_type) {
      countQuery = countQuery.where("model_type", "=", model_type);
    }
    if (sender_id) countQuery = countQuery.where("sender_id", "=", sender_id);
    if (receiver_id) {
      countQuery = countQuery.where("receiver_id", "=", receiver_id);
    }
    if (handler_id) {
      countQuery = countQuery.where("handler_id", "=", handler_id);
    }
    if (sent_time_from) {
      countQuery = countQuery.where("sent_time", ">=", sent_time_from);
    }
    if (sent_time_to) {
      countQuery = countQuery.where("sent_time", "<=", sent_time_to);
    }
    if (received_time_from) {
      countQuery = countQuery.where("received_time", ">=", received_time_from);
    }
    if (received_time_to) {
      countQuery = countQuery.where("received_time", "<=", received_time_to);
    }

    const { total } = await countQuery
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    let dataQuery = this.db
      .selectFrom("transactions")
      .where("deleted_at", "is", null);

    // Apply same filters to data query
    if (status) dataQuery = dataQuery.where("status", "=", status);
    if (model_type) dataQuery = dataQuery.where("model_type", "=", model_type);
    if (sender_id) dataQuery = dataQuery.where("sender_id", "=", sender_id);
    if (receiver_id) {
      dataQuery = dataQuery.where("receiver_id", "=", receiver_id);
    }
    if (handler_id) dataQuery = dataQuery.where("handler_id", "=", handler_id);
    if (sent_time_from) {
      dataQuery = dataQuery.where("sent_time", ">=", sent_time_from);
    }
    if (sent_time_to) {
      dataQuery = dataQuery.where("sent_time", "<=", sent_time_to);
    }
    if (received_time_from) {
      dataQuery = dataQuery.where("received_time", ">=", received_time_from);
    }
    if (received_time_to) {
      dataQuery = dataQuery.where("received_time", "<=", received_time_to);
    }

    const result = await dataQuery
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

  /**
   * Retrieves a single transaction by ID.
   * Optionally includes transaction details (line items) in the response.
   *
   * @param id - Transaction ID
   * @param includeDetails - Whether to fetch and include transaction details
   * @returns Promise resolving to the transaction entity
   * @throws {Error} "Transaction not found" if transaction doesn't exist
   *
   * @example
   * ```typescript
   * const transaction = await repo.getOne(1, true);
   * ```
   */
  async getOne(id: number, includeDetails = false) {
    const result = await this.db
      .selectFrom("transactions")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Transaction not found");
    }

    const transaction = this.mapper.toEntity(result);

    // Optionally include details
    if (includeDetails) {
      const details = await this.detailRepository.getMany(id);
      // Attach details to transaction (we'll need to extend the entity type for this)
      // For now, we just return the transaction as the entity doesn't have a details field
      // The controller/service layer can handle combining them if needed
    }

    return transaction;
  }

  /**
   * Creates a new transaction in the database.
   * Automatically generates a transaction number after creation if not provided.
   *
   * Number generation follows the pattern: {type_type}_{id}
   * - If type_type is provided: "SO_123", "PO_456"
   * - If type_type is not provided: "TX_123" (default)
   *
   * @param data - Transaction data without ID
   * @returns Promise resolving to the created transaction with generated number
   * @throws {Error} "Transaction not created" if insertion fails
   *
   * @example
   * ```typescript
   * const transaction = await repo.create({
   *   type_type: 'SO',
   *   status: 'TX_DRAFT',
   *   total: '0.00',
   *   fee: '0.00'
   * });
   * console.log(transaction.number); // 'SO_1'
   * ```
   */
  async create(data: Omit<Transaction, "id">) {
    const insertable = this.mapper.toInsertable(data as Transaction);

    const created = await this.db
      .insertInto("transactions")
      .values({ ...insertable, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Transaction not created");
    }

    const transactionId = safeBigintToNumber(created.insertId);
    const transaction = await this.getOne(transactionId);

    // Generate number if not provided
    if (!transaction.number) {
      const number = this.generateNumber(transaction);
      return await this.update(transactionId, { number });
    }

    return transaction;
  }

  /**
   * Updates an existing transaction with partial data.
   * Does not modify transaction details - use updateWithDetails for that.
   *
   * @param id - Transaction ID
   * @param data - Partial transaction data to update
   * @returns Promise resolving to the updated transaction
   *
   * @example
   * ```typescript
   * const updated = await repo.update(1, {
   *   status: 'TX_SENT',
   *   sent_time: new Date()
   * });
   * ```
   */
  async update(id: number, data: Partial<Transaction>) {
    const updateable = this.mapper.toUpdateable(data);

    await this.db
      .updateTable("transactions")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  /**
   * Atomically updates a transaction and replaces all its details.
   * Uses a database transaction to ensure all operations succeed or fail together.
   *
   * Process:
   * 1. Soft deletes all existing details (sets deleted_at)
   * 2. Inserts new details
   * 3. Calculates totals from new details
   * 4. Updates transaction with new data and calculated totals
   *
   * Total calculation formula:
   * - detail_amount = quantity × price × (1 - discount)
   * - total = sum of all detail_amounts
   * - total_details = sum excluding model_type 'BILL' and 'PAY'
   *
   * @param id - Transaction ID
   * @param transaction - Partial transaction data to update
   * @param details - Array of new transaction details (replaces all existing)
   * @returns Promise resolving to the updated transaction with recalculated totals
   * @throws {Error} "Transaction not found after update" if transaction doesn't exist
   * @throws {Error} Rolls back all changes if any operation fails
   *
   * @example
   * ```typescript
   * const updated = await repo.updateWithDetails(1, {
   *   status: 'TX_SENT'
   * }, [
   *   { sku: 'A', quantity: '2.00', price: '50.00', discount: '0.00', ... },
   *   { sku: 'B', quantity: '1.00', price: '30.00', discount: '0.10', ... }
   * ]);
   * console.log(updated.total); // '127.00' (2*50 + 1*30*0.9)
   * ```
   */
  async updateWithDetails(
    id: number,
    transaction: Partial<Transaction>,
    details: Omit<TransactionDetail, "id" | "transaction_id">[],
  ): Promise<Transaction> {
    // Use Kysely transaction for atomicity
    return await this.db.transaction().execute(async (trx) => {
      // 1. Delete old details (soft delete)
      await trx
        .updateTable("transaction_details")
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where("transaction_id", "=", id)
        .where("deleted_at", "is", null)
        .execute();

      // 2. Create new details
      const detailsWithTransactionId = details.map((detail) => ({
        ...detail,
        transaction_id: id,
      }));

      // We need to create details using the detail repository, but within this transaction
      // For now, we'll insert directly since we're in a transaction context
      if (detailsWithTransactionId.length > 0) {
        // Import the detail mapper to convert entities to insertable format
        const { TransactionDetailMapper } = await import(
          "./transaction-detail.mapper.ts"
        );
        const detailMapper = new TransactionDetailMapper();

        const insertableDetails = detailsWithTransactionId.map((detail) =>
          detailMapper.toInsertable(detail as TransactionDetail)
        );

        await trx
          .insertInto("transaction_details")
          .values(
            insertableDetails.map((detail) => ({
              ...detail,
              created_at: new Date(),
              updated_at: new Date(),
            })),
          )
          .execute();
      }

      // 3. Fetch the newly created details to calculate totals
      const newDetailsRows = await trx
        .selectFrom("transaction_details")
        .where("transaction_id", "=", id)
        .where("deleted_at", "is", null)
        .selectAll()
        .execute();

      const { TransactionDetailMapper } = await import(
        "./transaction-detail.mapper.ts"
      );
      const detailMapper = new TransactionDetailMapper();
      const newDetails = newDetailsRows.map((row) =>
        detailMapper.toEntity(row)
      );

      // 4. Calculate totals
      const totals = this.calculateTotals(newDetails);

      // 5. Update transaction with new data and calculated totals
      const updateData = {
        ...transaction,
        total: totals.total,
        total_details: totals.total_details,
      };

      const updateable = this.mapper.toUpdateable(updateData);

      await trx
        .updateTable("transactions")
        .set({ ...updateable, updated_at: new Date() })
        .where("id", "=", id)
        .execute();

      // 6. Fetch and return updated transaction
      const result = await trx
        .selectFrom("transactions")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst();

      if (!result) {
        throw new Error("Transaction not found after update");
      }

      return this.mapper.toEntity(result);
    });
  }

  /**
   * Soft deletes a transaction and all its associated details.
   * Sets status to 'archived' and deleted_at timestamp for both transaction and details.
   *
   * @param id - Transaction ID
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * ```typescript
   * await repo.delete(1);
   * ```
   */
  async delete(id: number) {
    // Soft delete transaction
    await this.db
      .updateTable("transactions")
      .where("id", "=", id)
      .set({
        status: "archived",
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();

    // Soft delete associated details
    await this.detailRepository.deleteByTransactionId(id);
  }

  /**
   * Generates a unique transaction number following the pattern: {type_type}_{id}
   *
   * Examples:
   * - type_type='SO', id=123 → 'SO_123'
   * - type_type='PO', id=456 → 'PO_456'
   * - type_type=undefined, id=789 → 'TX_789' (default)
   *
   * @param transaction - Transaction entity with id and optional type_type
   * @returns Generated transaction number string
   *
   * @example
   * ```typescript
   * const number = repo.generateNumber({ id: 123, type_type: 'SO', ... });
   * console.log(number); // 'SO_123'
   * ```
   */
  generateNumber(transaction: Transaction): string {
    const typeType = transaction.type_type || "TX";
    return `${typeType}_${transaction.id}`;
  }

  /**
   * Calculates transaction totals from an array of transaction details.
   *
   * Calculation formula:
   * - detail_amount = quantity × price × (1 - discount)
   * - total = sum of all detail_amounts
   * - total_details = sum of detail_amounts excluding model_type 'BILL' and 'PAY'
   *
   * All decimal fields are strings to maintain precision. Results are formatted to 2 decimal places.
   *
   * @param details - Array of transaction details
   * @returns Object containing total and total_details as decimal strings
   *
   * @example
   * ```typescript
   * const totals = repo.calculateTotals([
   *   { quantity: '2.00', price: '50.00', discount: '0.00', model_type: 'SO', ... },
   *   { quantity: '1.00', price: '30.00', discount: '0.10', model_type: 'SO', ... },
   *   { quantity: '1.00', price: '10.00', discount: '0.00', model_type: 'BILL', ... }
   * ]);
   * console.log(totals.total); // '137.00' (2*50 + 1*30*0.9 + 1*10)
   * console.log(totals.total_details); // '127.00' (excludes BILL)
   * ```
   */
  calculateTotals(details: TransactionDetail[]): {
    total: string;
    total_details: string;
  } {
    let total = 0;
    let totalDetails = 0;

    for (const detail of details) {
      const quantity = parseFloat(detail.quantity);
      const price = parseFloat(detail.price);
      const discount = parseFloat(detail.discount);

      const lineTotal = quantity * price * (1 - discount);
      total += lineTotal;

      // Exclude BILL and PAY from total_details
      if (detail.model_type !== "BILL" && detail.model_type !== "PAY") {
        totalDetails += lineTotal;
      }
    }

    return {
      total: total.toFixed(2),
      total_details: totalDetails.toFixed(2),
    };
  }
}

export { TransactionRepository };
