// deno-lint-ignore-file require-await
import type {
  GetManyTransactionsProps,
  GetManyTransactionsReturn,
  ITransactionRepository,
} from "../../application/transaction-repository.interface.ts";
import type { TransactionEntity } from "../../domain/transaction.entity.ts";

interface MockRepositoryOptions {
  transactions?: TransactionEntity[];
  shouldThrow?: Error;
}

interface MethodCall {
  method: string;
  args: unknown[];
}

class MockTransactionRepository implements ITransactionRepository {
  private transactions: TransactionEntity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.transactions = options?.transactions ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  reset(options?: MockRepositoryOptions): void {
    this.transactions = options?.transactions ?? [];
    this.shouldThrow = options?.shouldThrow;
    this.calls = [];
  }

  setError(error: Error): void { this.shouldThrow = error; }
  clearError(): void { this.shouldThrow = undefined; }
  getCalls(): MethodCall[] { return this.calls; }
  getCallsForMethod(methodName: string): MethodCall[] { return this.calls.filter((c) => c.method === methodName); }
  clearCalls(): void { this.calls = []; }

  async getMany(props: GetManyTransactionsProps): Promise<GetManyTransactionsReturn> {
    this.calls.push({ method: "getMany", args: [props] });
    if (this.shouldThrow) throw this.shouldThrow;

    let filtered = [...this.transactions];
    if (props.status) filtered = filtered.filter((item) => item.status === props.status);

    const page = props.page ?? 1;
    const limit = props.limit ?? 10;
    const offset = (page - 1) * limit;

    return {
      data: filtered.slice(offset, offset + limit),
      metadata: { currentPage: page, itemsPerPage: limit, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
    };
  }

  async getOne(id: number): Promise<TransactionEntity> {
    this.calls.push({ method: "getOne", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const item = this.transactions.find((i) => i.id === id);
    if (!item) throw new Error("Transaction not found");
    return item;
  }

  async create(data: Omit<TransactionEntity, "id">): Promise<TransactionEntity> {
    this.calls.push({ method: "create", args: [data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const newId = this.transactions.length > 0 ? Math.max(...this.transactions.map((i) => i.id)) + 1 : 1;
    const newItem: TransactionEntity = { ...data, id: newId, created_at: new Date(), updated_at: new Date() };
    this.transactions.push(newItem);
    return newItem;
  }

  async update(id: number, data: Partial<TransactionEntity>): Promise<TransactionEntity> {
    this.calls.push({ method: "update", args: [id, data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.transactions.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Transaction not found");
    const updated: TransactionEntity = { ...this.transactions[index], ...data, id, updated_at: new Date() };
    this.transactions[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.transactions.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Transaction not found");
    this.transactions[index] = { ...this.transactions[index], status: "archived", deleted_at: new Date() };
  }
}

export { MockTransactionRepository };
export type { MethodCall, MockRepositoryOptions };
