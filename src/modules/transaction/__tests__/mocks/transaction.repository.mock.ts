// deno-lint-ignore-file require-await
import type {
  GetManyTransactionsProps,
  GetManyTransactionsReturn,
  ITransactionRepository,
} from "../../application/transaction-repository.interface.ts";
import type { TransactionEntity } from "../../domain/transaction.entity.ts";
import type { TransactionDetailEntity } from "../../domain/transaction-detail.entity.ts";

interface MockRepositoryOptions {
  transactions?: TransactionEntity[];
  details?: TransactionDetailEntity[];
  shouldThrow?: Error;
}

interface MethodCall {
  method: string;
  args: unknown[];
}

class MockTransactionRepository implements ITransactionRepository {
  private transactions: TransactionEntity[] = [];
  private details: TransactionDetailEntity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.transactions = options?.transactions ?? [];
    this.details = options?.details ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  reset(options?: MockRepositoryOptions): void {
    this.transactions = options?.transactions ?? [];
    this.details = options?.details ?? [];
    this.shouldThrow = options?.shouldThrow;
    this.calls = [];
  }

  setError(error: Error): void {
    this.shouldThrow = error;
  }
  clearError(): void {
    this.shouldThrow = undefined;
  }
  getCalls(): MethodCall[] {
    return this.calls;
  }
  getCallsForMethod(methodName: string): MethodCall[] {
    return this.calls.filter((c) => c.method === methodName);
  }
  clearCalls(): void {
    this.calls = [];
  }

  async getMany(
    props: GetManyTransactionsProps,
  ): Promise<GetManyTransactionsReturn> {
    this.calls.push({ method: "getMany", args: [props] });
    if (this.shouldThrow) throw this.shouldThrow;

    let filtered = [...this.transactions];
    if (props.status) {
      filtered = filtered.filter((item) => item.status === props.status);
    }
    if (props.model_type) {
      filtered = filtered.filter((item) =>
        item.model_type === props.model_type
      );
    }
    if (props.sender_id) {
      filtered = filtered.filter((item) => item.sender_id === props.sender_id);
    }
    if (props.receiver_id) {
      filtered = filtered.filter((item) =>
        item.receiver_id === props.receiver_id
      );
    }
    if (props.handler_id) {
      filtered = filtered.filter((item) =>
        item.handler_id === props.handler_id
      );
    }

    const page = props.page ?? 1;
    const limit = props.limit ?? 10;
    const offset = (page - 1) * limit;

    return {
      data: filtered.slice(offset, offset + limit),
      metadata: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  async getOne(
    id: number,
    includeDetails?: boolean,
  ): Promise<TransactionEntity> {
    this.calls.push({ method: "getOne", args: [id, includeDetails] });
    if (this.shouldThrow) throw this.shouldThrow;
    const item = this.transactions.find((i) => i.id === id);
    if (!item) throw new Error("Transaction not found");

    if (includeDetails) {
      const transactionDetails = this.details.filter((d) =>
        d.transaction_id === id
      );
      return { ...item, details: transactionDetails } as TransactionEntity & {
        details: TransactionDetailEntity[];
      };
    }

    return item;
  }

  async create(
    data: Omit<TransactionEntity, "id">,
  ): Promise<TransactionEntity> {
    this.calls.push({ method: "create", args: [data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const newId = this.transactions.length > 0
      ? Math.max(...this.transactions.map((i) => i.id)) + 1
      : 1;
    const newItem: TransactionEntity = {
      ...data,
      id: newId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.transactions.push(newItem);
    return newItem;
  }

  async update(
    id: number,
    data: Partial<TransactionEntity>,
  ): Promise<TransactionEntity> {
    this.calls.push({ method: "update", args: [id, data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.transactions.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Transaction not found");
    const updated: TransactionEntity = {
      ...this.transactions[index],
      ...data,
      id,
      updated_at: new Date(),
    };
    this.transactions[index] = updated;
    return updated;
  }

  async updateWithDetails(
    id: number,
    transaction: Partial<TransactionEntity>,
    details: Omit<TransactionDetailEntity, "id" | "transaction_id">[],
  ): Promise<TransactionEntity> {
    this.calls.push({
      method: "updateWithDetails",
      args: [id, transaction, details],
    });
    if (this.shouldThrow) throw this.shouldThrow;

    // Delete old details
    this.details = this.details.filter((d) => d.transaction_id !== id);

    // Create new details
    const newDetails: TransactionDetailEntity[] = details.map((d, idx) => ({
      ...d,
      id: this.details.length + idx + 1,
      transaction_id: id,
      status: d.status ?? "active",
      created_at: new Date(),
      updated_at: new Date(),
    }));
    this.details.push(...newDetails);

    // Calculate totals
    const { total, total_details } = this.calculateTotals(newDetails);

    // Update transaction
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Transaction not found");

    const updated: TransactionEntity = {
      ...this.transactions[index],
      ...transaction,
      total,
      total_details,
      id,
      updated_at: new Date(),
    };
    this.transactions[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.transactions.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Transaction not found");
    this.transactions[index] = {
      ...this.transactions[index],
      status: "archived",
      deleted_at: new Date(),
    };
  }

  generateNumber(transaction: TransactionEntity): string {
    this.calls.push({ method: "generateNumber", args: [transaction] });
    if (this.shouldThrow) throw this.shouldThrow;

    const type = transaction.type_type ?? "TX";
    return `${type}_${transaction.id}`;
  }

  calculateTotals(
    details: TransactionDetailEntity[],
  ): { total: string; total_details: string } {
    this.calls.push({ method: "calculateTotals", args: [details] });
    if (this.shouldThrow) throw this.shouldThrow;

    let total = 0;
    let totalDetails = 0;

    for (const detail of details) {
      const quantity = parseFloat(detail.quantity);
      const price = parseFloat(detail.price);
      const discount = parseFloat(detail.discount);
      const amount = quantity * price * (1 - discount);

      total += amount;

      // Exclude BILL and PAY from total_details
      if (detail.model_type !== "BILL" && detail.model_type !== "PAY") {
        totalDetails += amount;
      }
    }

    return {
      total: total.toFixed(2),
      total_details: totalDetails.toFixed(2),
    };
  }
}

export { MockTransactionRepository };
export type { MethodCall, MockRepositoryOptions };
