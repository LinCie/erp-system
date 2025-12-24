import {
  GetManyTransactionsProps,
  ITransactionRepository,
} from "./transaction-repository.interface.ts";
import { ITransactionDetailRepository } from "./transaction-detail-repository.interface.ts";
import { TransactionEntity as Transaction } from "../domain/transaction.entity.ts";
import { TransactionDetailEntity as TransactionDetail } from "../domain/transaction-detail.entity.ts";

/**
 * Service layer for transaction business logic.
 * Handles transaction operations including CRUD, status validation, and detail management.
 */
class TransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly transactionDetailRepository: ITransactionDetailRepository,
  ) {}

  /**
   * Retrieves multiple transactions with optional filtering and pagination.
   *
   * @param props - Query parameters including filters, pagination, and sorting
   * @returns Promise resolving to paginated transaction data with metadata
   *
   * @example
   * ```typescript
   * const result = await service.getMany({
   *   status: 'TX_DRAFT',
   *   sender_id: 5,
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  async getMany(props: GetManyTransactionsProps) {
    return await this.transactionRepository.getMany(props);
  }

  /**
   * Retrieves a single transaction by ID.
   *
   * @param id - Transaction ID
   * @param includeDetails - Whether to include transaction details (line items)
   * @returns Promise resolving to the transaction entity
   * @throws {Error} TRANSACTION_NOT_FOUND if transaction doesn't exist
   *
   * @example
   * ```typescript
   * const transaction = await service.getOne(1, true);
   * console.log(transaction.details); // Array of line items
   * ```
   */
  async getOne(id: number, includeDetails?: boolean) {
    return await this.transactionRepository.getOne(id, includeDetails);
  }

  /**
   * Creates a new transaction.
   * Automatically generates a transaction number after creation if not provided.
   *
   * @param data - Transaction data without ID
   * @returns Promise resolving to the created transaction with generated number
   * @throws {Error} TRANSACTION_CREATE_FAILED if creation fails
   *
   * @example
   * ```typescript
   * const transaction = await service.create({
   *   type_type: 'SO',
   *   sender_type: 'Player',
   *   sender_id: 5,
   *   status: 'TX_DRAFT',
   *   total: '0.00',
   *   fee: '0.00'
   * });
   * console.log(transaction.number); // 'SO_1'
   * ```
   */
  async create(data: Omit<Transaction, "id">) {
    return await this.transactionRepository.create(data);
  }

  /**
   * Updates an existing transaction.
   * Validates that the transaction is not in a closed state before allowing updates.
   *
   * @param id - Transaction ID
   * @param data - Partial transaction data to update
   * @returns Promise resolving to the updated transaction
   * @throws {Error} TRANSACTION_NOT_FOUND if transaction doesn't exist
   * @throws {Error} TRANSACTION_CLOSED if transaction status is 'TX_CLOSED'
   *
   * @example
   * ```typescript
   * const updated = await service.update(1, {
   *   status: 'TX_SENT',
   *   sent_time: new Date(),
   *   sender_notes: 'Shipped via express'
   * });
   * ```
   */
  async update(id: number, data: Partial<Transaction>) {
    // Validate that transaction is not closed before allowing updates
    const transaction = await this.transactionRepository.getOne(id);
    if (transaction.status === "TX_CLOSED") {
      throw new Error("TRANSACTION_CLOSED");
    }
    return await this.transactionRepository.update(id, data);
  }

  /**
   * Atomically updates a transaction and replaces all its details.
   * All operations are performed within a database transaction for consistency.
   *
   * Process:
   * 1. Validates transaction is not closed
   * 2. Soft deletes all existing details
   * 3. Creates new details
   * 4. Recalculates totals from new details
   * 5. Updates transaction with new data and totals
   *
   * @param id - Transaction ID
   * @param transaction - Partial transaction data to update
   * @param details - Array of new transaction details (old details are replaced)
   * @returns Promise resolving to the updated transaction with recalculated totals
   * @throws {Error} TRANSACTION_NOT_FOUND if transaction doesn't exist
   * @throws {Error} TRANSACTION_CLOSED if transaction status is 'TX_CLOSED'
   * @throws {Error} Rolls back all changes if any operation fails
   *
   * @example
   * ```typescript
   * const updated = await service.updateWithDetails(1, {
   *   status: 'TX_SENT'
   * }, [
   *   {
   *     sku: 'ITEM-001',
   *     name: 'Product A',
   *     quantity: '2.00',
   *     price: '50.00',
   *     discount: '0.00',
   *     cost_per_unit: '30.00',
   *     debit: '2.00',
   *     credit: '0.00'
   *   }
   * ]);
   * console.log(updated.total); // Automatically calculated
   * ```
   */
  async updateWithDetails(
    id: number,
    transaction: Partial<Transaction>,
    details: Omit<TransactionDetail, "id" | "transaction_id">[],
  ) {
    // Validate that transaction is not closed before allowing updates
    const existingTransaction = await this.transactionRepository.getOne(id);
    if (existingTransaction.status === "TX_CLOSED") {
      throw new Error("TRANSACTION_CLOSED");
    }
    return await this.transactionRepository.updateWithDetails(
      id,
      transaction,
      details,
    );
  }

  /**
   * Soft deletes a transaction and all its associated details.
   * Sets status to 'archived' and deleted_at timestamp.
   *
   * @param id - Transaction ID
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} TRANSACTION_NOT_FOUND if transaction doesn't exist
   *
   * @example
   * ```typescript
   * await service.delete(1);
   * ```
   */
  async delete(id: number) {
    return await this.transactionRepository.delete(id);
  }
}

export { TransactionService };
