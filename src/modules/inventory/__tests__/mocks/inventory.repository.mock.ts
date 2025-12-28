// deno-lint-ignore-file require-await
import type {
  GetManyInventoriesProps,
  GetManyInventoriesReturn,
  GetMutationsProps,
  GetMutationsReturn,
  IInventoryRepository,
} from "../../application/inventory-repository.interface.ts";
import type { InventoryEntity } from "../../domain/inventory.entity.ts";

interface MockRepositoryOptions {
  inventories?: InventoryEntity[];
  shouldThrow?: Error;
}

interface MethodCall {
  method: string;
  args: unknown[];
}

class MockInventoryRepository implements IInventoryRepository {
  private inventories: InventoryEntity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.inventories = options?.inventories ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  reset(options?: MockRepositoryOptions): void {
    this.inventories = options?.inventories ?? [];
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
    props: GetManyInventoriesProps,
  ): Promise<GetManyInventoriesReturn> {
    this.calls.push({ method: "getMany", args: [props] });
    if (this.shouldThrow) throw this.shouldThrow;

    let filtered = [...this.inventories];
    if (props.status) {
      filtered = filtered.filter((item) => item.status === props.status);
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

  async getOne(id: number): Promise<InventoryEntity> {
    this.calls.push({ method: "getOne", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const item = this.inventories.find((i) => i.id === id);
    if (!item) throw new Error("Inventory not found");
    return item;
  }

  async getMutations(props: GetMutationsProps): Promise<GetMutationsReturn> {
    this.calls.push({ method: "getMutations", args: [props] });
    if (this.shouldThrow) throw this.shouldThrow;

    const page = props.page ?? 1;
    const limit = props.limit ?? 10;

    // Mock implementation returns empty data
    return {
      data: [],
      metadata: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: 0,
        totalPages: 0,
      },
      summary: {
        initialBalance: 0,
        initialDebit: 0,
        initialCredit: 0,
        pageDebit: 0,
        pageCredit: 0,
      },
    };
  }

  async create(data: Omit<InventoryEntity, "id">): Promise<InventoryEntity> {
    this.calls.push({ method: "create", args: [data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const newId = this.inventories.length > 0
      ? Math.max(...this.inventories.map((i) => i.id)) + 1
      : 1;
    const newItem: InventoryEntity = {
      ...data,
      id: newId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.inventories.push(newItem);
    return newItem;
  }

  async update(
    id: number,
    data: Partial<InventoryEntity>,
  ): Promise<InventoryEntity> {
    this.calls.push({ method: "update", args: [id, data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.inventories.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Inventory not found");
    const updated: InventoryEntity = {
      ...this.inventories[index],
      ...data,
      id,
      updated_at: new Date(),
    };
    this.inventories[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.inventories.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Inventory not found");
    this.inventories[index] = {
      ...this.inventories[index],
      status: "archived",
      deleted_at: new Date(),
    };
  }
}

export { MockInventoryRepository };
export type { MethodCall, MockRepositoryOptions };
