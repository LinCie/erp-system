// deno-lint-ignore-file require-await
import type { ITransactionDetailRepository } from "../../application/transaction-detail-repository.interface.ts";
import type { TransactionDetailEntity } from "../../domain/transaction-detail.entity.ts";

interface MockRepositoryOptions {
  details?: TransactionDetailEntity[];
  shouldThrow?: Error;
}

interface MethodCall {
  method: string;
  args: unknown[];
}

class MockTransactionDetailRepository implements ITransactionDetailRepository {
  private details: TransactionDetailEntity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.details = options?.details ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  // Utility methods for test assertions
  reset(options?: MockRepositoryOptions): void {
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

  // Interface implementation with call tracking
  async getMany(transaction_id: number): Promise<TransactionDetailEntity[]> {
    this.calls.push({ method: "getMany", args: [transaction_id] });
    if (this.shouldThrow) throw this.shouldThrow;

    return this.details.filter((d) => d.transaction_id === transaction_id);
  }

  async getOne(id: number): Promise<TransactionDetailEntity> {
    this.calls.push({ method: "getOne", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;

    const detail = this.details.find((d) => d.id === id);
    if (!detail) throw new Error("Transaction detail not found");
    return detail;
  }

  async create(
    data: Omit<TransactionDetailEntity, "id">,
  ): Promise<TransactionDetailEntity> {
    this.calls.push({ method: "create", args: [data] });
    if (this.shouldThrow) throw this.shouldThrow;

    const newId = this.details.length > 0
      ? Math.max(...this.details.map((d) => d.id)) + 1
      : 1;
    const newDetail: TransactionDetailEntity = {
      ...data,
      id: newId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.details.push(newDetail);
    return newDetail;
  }

  async createMany(
    data: Omit<TransactionDetailEntity, "id">[],
  ): Promise<TransactionDetailEntity[]> {
    this.calls.push({ method: "createMany", args: [data] });
    if (this.shouldThrow) throw this.shouldThrow;

    const created: TransactionDetailEntity[] = [];
    for (const item of data) {
      const newId = this.details.length > 0
        ? Math.max(...this.details.map((d) => d.id)) + 1
        : 1;
      const newDetail: TransactionDetailEntity = {
        ...item,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.details.push(newDetail);
      created.push(newDetail);
    }
    return created;
  }

  async update(
    id: number,
    data: Partial<TransactionDetailEntity>,
  ): Promise<TransactionDetailEntity> {
    this.calls.push({ method: "update", args: [id, data] });
    if (this.shouldThrow) throw this.shouldThrow;

    const index = this.details.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Transaction detail not found");

    const updated: TransactionDetailEntity = {
      ...this.details[index],
      ...data,
      id,
      updated_at: new Date(),
    };
    this.details[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;

    const index = this.details.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Transaction detail not found");

    this.details[index] = {
      ...this.details[index],
      status: "archived",
      deleted_at: new Date(),
    };
  }

  async deleteByTransactionId(transaction_id: number): Promise<void> {
    this.calls.push({
      method: "deleteByTransactionId",
      args: [transaction_id],
    });
    if (this.shouldThrow) throw this.shouldThrow;

    this.details = this.details.map((d) =>
      d.transaction_id === transaction_id
        ? { ...d, status: "archived", deleted_at: new Date() }
        : d
    );
  }
}

export { MockTransactionDetailRepository };
export type { MethodCall, MockRepositoryOptions };
