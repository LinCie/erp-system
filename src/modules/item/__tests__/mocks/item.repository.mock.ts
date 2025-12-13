// deno-lint-ignore-file require-await
import type {
  GetManyItemsProps,
  IItemRepository,
} from "../../application/item-repository.interface.ts";
import type { ItemEntity } from "../../domain/item.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

/**
 * Configuration options for MockItemRepository
 */
interface MockRepositoryOptions {
  /** Initial items to populate the mock repository */
  items?: ItemEntity[];
  /** Error to throw on method calls */
  shouldThrow?: Error;
}

/**
 * Represents a method call made to the mock repository
 */
interface MethodCall {
  method: string;
  args: unknown[];
}

/**
 * Mock implementation of IItemRepository for testing
 * Tracks all method calls and supports configurable responses and errors
 */
class MockItemRepository implements IItemRepository {
  private items: ItemEntity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.items = options?.items ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  /**
   * Reset the mock state
   */
  reset(options?: MockRepositoryOptions): void {
    this.items = options?.items ?? [];
    this.shouldThrow = options?.shouldThrow;
    this.calls = [];
  }

  /**
   * Configure the mock to throw an error on subsequent calls
   */
  setError(error: Error): void {
    this.shouldThrow = error;
  }

  /**
   * Clear any configured error
   */
  clearError(): void {
    this.shouldThrow = undefined;
  }

  /**
   * Get all recorded method calls
   */
  getCalls(): MethodCall[] {
    return this.calls;
  }

  /**
   * Get calls for a specific method
   */
  getCallsForMethod(methodName: string): MethodCall[] {
    return this.calls.filter((call) => call.method === methodName);
  }

  /**
   * Clear all recorded calls
   */
  clearCalls(): void {
    this.calls = [];
  }

  async getMany(props: GetManyItemsProps) {
    this.calls.push({ method: "getMany", args: [props] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    let filteredItems = [...this.items];

    // Filter by status if provided
    if (props.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status === props.status,
      );
    }

    // Filter by search term if provided
    if (props.search) {
      const searchLower = props.search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower),
      );
    }

    // Apply pagination
    const page = props.page ?? 1;
    const limit = props.limit ?? 10;
    const offset = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    const metadata: GetManyMetadataType = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / limit),
    };

    return {
      data: paginatedItems,
      metadata,
    };
  }

  async getOne(id: number): Promise<ItemEntity> {
    this.calls.push({ method: "getOne", args: [id] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const item = this.items.find((item) => item.id === id);
    if (!item) {
      throw new Error("Item not found");
    }

    return item;
  }

  async create(item: Omit<ItemEntity, "id">): Promise<ItemEntity> {
    this.calls.push({ method: "create", args: [item] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const newId = this.items.length > 0
      ? Math.max(...this.items.map((i) => i.id)) + 1
      : 1;

    const newItem: ItemEntity = {
      ...item,
      id: newId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.items.push(newItem);
    return newItem;
  }

  async update(
    id: number,
    item: Partial<ItemEntity>,
  ): Promise<ItemEntity> {
    this.calls.push({ method: "update", args: [id, item] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const existingItemIndex = this.items.findIndex((i) => i.id === id);
    if (existingItemIndex === -1) {
      throw new Error("Item not found");
    }

    const updatedItem: ItemEntity = {
      ...this.items[existingItemIndex],
      ...item,
      id, // Ensure ID doesn't change
      updated_at: new Date(),
    };

    this.items[existingItemIndex] = updatedItem;
    return updatedItem;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const itemIndex = this.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      throw new Error("Item not found");
    }

    // Perform soft delete
    this.items[itemIndex] = {
      ...this.items[itemIndex],
      status: "archived",
      deleted_at: new Date(),
    };
  }
}

export { MockItemRepository };
export type { MethodCall, MockRepositoryOptions };
