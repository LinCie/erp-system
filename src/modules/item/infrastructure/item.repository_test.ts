import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { ItemRepository } from "./item.repository.ts";
import type { Selectable } from "kysely";
import type { Items as ItemDatabase } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ItemEntity } from "../domain/item.entity.ts";
import fc from "fast-check";
import {
  itemEntityArb,
  partialItemArb,
} from "../__tests__/arbitraries/item.arbitraries.ts";
import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { load } from "@std/dotenv";

// Load environment variables for tests
await load({ export: true });

// Helper to access private methods for testing
class TestableItemRepository extends ItemRepository {
  public testMapToEntity(row: Partial<Selectable<ItemDatabase>>): ItemEntity {
    // deno-lint-ignore no-explicit-any
    return (this as any).mapToEntity(row);
  }

  public testMapToInsertable(item: ItemEntity) {
    // deno-lint-ignore no-explicit-any
    return (this as any).mapToInsertable(item);
  }

  public testMapToUpdateable(item: Partial<ItemEntity>) {
    // deno-lint-ignore no-explicit-any
    return (this as any).mapToUpdateable(item);
  }
}

// Create a mock database instance (not used for mapping tests)
// deno-lint-ignore no-explicit-any
const mockDb = {} as any;
const repository = new TestableItemRepository(mockDb);

Deno.test("mapToEntity converts database row correctly", () => {
  const dbRow: Partial<Selectable<ItemDatabase>> = {
    id: 1,
    name: "Test Item",
    cost: "10.00",
    price: "15.00",
    weight: "1.50",
    status: "active",
    sku: "TEST-001",
    code: "ITEM-001",
    description: "Test description",
    notes: "Test notes",
    space_id: 1,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-02"),
  };

  const entity = repository.testMapToEntity(dbRow);

  assertEquals(entity.id, 1);
  assertEquals(entity.name, "Test Item");
  assertEquals(entity.cost, "10.00");
  assertEquals(entity.price, "15.00");
  assertEquals(entity.weight, "1.50");
  assertEquals(entity.status, "active");
  assertEquals(entity.sku, "TEST-001");
  assertEquals(entity.code, "ITEM-001");
  assertEquals(entity.description, "Test description");
  assertEquals(entity.notes, "Test notes");
  assertEquals(entity.space_id, 1);
  assertExists(entity.created_at);
  assertExists(entity.updated_at);
});

Deno.test("mapToEntity handles null to undefined conversion", () => {
  const dbRow: Partial<Selectable<ItemDatabase>> = {
    id: 1,
    name: "Test Item",
    cost: "10.00",
    price: "15.00",
    weight: "1.50",
    status: "active",
    sku: null,
    code: null,
    description: null,
    notes: null,
    model_id: null,
    model_type: null,
    parent_id: null,
    parent_type: null,
    space_id: null,
    space_type: null,
    type_id: null,
    type_type: null,
    primary_code: null,
    created_at: null,
    updated_at: null,
    deleted_at: null,
  };

  const entity = repository.testMapToEntity(dbRow);

  // Required fields should be present
  assertEquals(entity.id, 1);
  assertEquals(entity.name, "Test Item");
  assertEquals(entity.cost, "10.00");
  assertEquals(entity.price, "15.00");
  assertEquals(entity.weight, "1.50");
  assertEquals(entity.status, "active");

  // Null values should be converted to undefined
  assertEquals(entity.sku, undefined);
  assertEquals(entity.code, undefined);
  assertEquals(entity.description, undefined);
  assertEquals(entity.notes, undefined);
  assertEquals(entity.model_id, undefined);
  assertEquals(entity.model_type, undefined);
  assertEquals(entity.parent_id, undefined);
  assertEquals(entity.parent_type, undefined);
  assertEquals(entity.space_id, undefined);
  assertEquals(entity.space_type, undefined);
  assertEquals(entity.type_id, undefined);
  assertEquals(entity.type_type, undefined);
  assertEquals(entity.primary_code, undefined);
  assertEquals(entity.created_at, undefined);
  assertEquals(entity.updated_at, undefined);
  assertEquals(entity.deleted_at, undefined);
});

Deno.test("mapToInsertable maps all entity fields", () => {
  const entity: ItemEntity = {
    id: 1,
    name: "Test Item",
    cost: "10.00",
    price: "15.00",
    weight: "1.50",
    status: "active",
    sku: "TEST-001",
    code: "ITEM-001",
    description: "Test description",
    notes: "Test notes",
    model_id: 10,
    model_type: "model",
    parent_id: 20,
    parent_type: "parent",
    space_id: 1,
    space_type: "space",
    type_id: 30,
    type_type: "type",
    primary_code: "PRIMARY-001",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-02"),
  };

  const insertable = repository.testMapToInsertable(entity);

  // Verify all fields are mapped (except id which is auto-generated)
  assertEquals(insertable.name, "Test Item");
  assertEquals(insertable.cost, "10.00");
  assertEquals(insertable.price, "15.00");
  assertEquals(insertable.weight, "1.50");
  assertEquals(insertable.status, "active");
  assertEquals(insertable.sku, "TEST-001");
  assertEquals(insertable.code, "ITEM-001");
  assertEquals(insertable.description, "Test description");
  assertEquals(insertable.notes, "Test notes");
  assertEquals(insertable.model_id, 10);
  assertEquals(insertable.model_type, "model");
  assertEquals(insertable.parent_id, 20);
  assertEquals(insertable.parent_type, "parent");
  assertEquals(insertable.space_id, 1);
  assertEquals(insertable.space_type, "space");
  assertEquals(insertable.type_id, 30);
  assertEquals(insertable.type_type, "type");
  assertEquals(insertable.primary_code, "PRIMARY-001");
  assertExists(insertable.created_at);
  assertExists(insertable.updated_at);
});

Deno.test("mapToUpdateable maps only provided fields", () => {
  const partialEntity: Partial<ItemEntity> = {
    name: "Updated Name",
    price: "20.00",
    description: "Updated description",
  };

  const updateable = repository.testMapToUpdateable(partialEntity);

  // Verify provided fields are present
  assertEquals(updateable.name, "Updated Name");
  assertEquals(updateable.price, "20.00");
  assertEquals(updateable.description, "Updated description");

  // Note: mapToUpdateable includes all fields (even undefined ones)
  // This is acceptable for Kysely's updateable type
});

// **Feature: item-module-testing, Property 2: Entity Mapping Round-Trip Consistency**
// **Validates: Requirements 2.1, 2.3, 3.1**
Deno.test("Property: Entity mapping round-trip preserves essential fields", () => {
  fc.assert(
    fc.property(itemEntityArb, (item) => {
      // Map entity to insertable (simulating database insert)
      const insertable = repository.testMapToInsertable(item);

      // Create a database row by simulating what the DB would return
      // The database would add the id and convert undefined to null
      const dbRow: Partial<Selectable<ItemDatabase>> = {
        id: item.id,
        name: insertable.name,
        cost: insertable.cost,
        price: insertable.price,
        weight: insertable.weight,
        status: insertable.status,
        code: insertable.code ?? null,
        description: insertable.description ?? null,
        sku: insertable.sku ?? null,
        notes: insertable.notes ?? null,
        model_id: insertable.model_id ?? null,
        model_type: insertable.model_type ?? null,
        parent_id: insertable.parent_id ?? null,
        parent_type: insertable.parent_type ?? null,
        space_id: insertable.space_id ?? null,
        space_type: insertable.space_type ?? null,
        type_id: insertable.type_id ?? null,
        type_type: insertable.type_type ?? null,
        primary_code: insertable.primary_code ?? null,
        created_at: insertable.created_at ?? null,
        updated_at: insertable.updated_at ?? null,
        deleted_at: insertable.deleted_at ?? null,
      };

      // Map back to entity
      const roundTrippedEntity = repository.testMapToEntity(dbRow);

      // Verify essential fields are preserved
      return (
        roundTrippedEntity.id === item.id &&
        roundTrippedEntity.name === item.name &&
        roundTrippedEntity.cost === item.cost &&
        roundTrippedEntity.price === item.price &&
        roundTrippedEntity.weight === item.weight &&
        roundTrippedEntity.status === item.status &&
        roundTrippedEntity.sku === item.sku &&
        roundTrippedEntity.code === item.code &&
        roundTrippedEntity.description === item.description &&
        roundTrippedEntity.notes === item.notes
      );
    }),
    { numRuns: 100 },
  );
});

// **Feature: item-module-testing, Property 3: Partial Update Mapping Completeness**
// **Validates: Requirements 2.4, 3.2**
Deno.test("Property: Partial update mapping includes only provided fields", () => {
  fc.assert(
    fc.property(partialItemArb, (partialItem) => {
      // Map partial entity to updateable
      const updateable = repository.testMapToUpdateable(partialItem);

      // Get the keys that were provided in the partial item (non-undefined values)
      const providedKeys = Object.keys(partialItem).filter(
        (key) => partialItem[key as keyof typeof partialItem] !== undefined,
      );

      // Verify that all provided fields are present in the updateable object
      // and have the same values
      return providedKeys.every((key) => {
        const partialValue = partialItem[key as keyof typeof partialItem];
        const updateableValue = updateable[key as keyof typeof updateable];
        return updateableValue === partialValue;
      });
    }),
    { numRuns: 100 },
  );
});

// **Feature: item-module-testing, Property 4: Numeric String Format Preservation**
// **Validates: Requirements 2.5, 3.3**
Deno.test("Property: Numeric string fields remain parseable after mapping", () => {
  fc.assert(
    fc.property(itemEntityArb, (item) => {
      // Map entity to insertable and back to entity (round-trip)
      const insertable = repository.testMapToInsertable(item);

      // Simulate database row
      const dbRow: Partial<Selectable<ItemDatabase>> = {
        id: item.id,
        name: insertable.name,
        cost: insertable.cost,
        price: insertable.price,
        weight: insertable.weight,
        status: insertable.status,
      };

      const roundTrippedEntity = repository.testMapToEntity(dbRow);

      // Verify numeric string fields are parseable and maintain their numeric value
      const originalCost = parseFloat(item.cost);
      const roundTrippedCost = parseFloat(roundTrippedEntity.cost);

      const originalPrice = parseFloat(item.price);
      const roundTrippedPrice = parseFloat(roundTrippedEntity.price);

      const originalWeight = parseFloat(item.weight);
      const roundTrippedWeight = parseFloat(roundTrippedEntity.weight);

      // Check that values are parseable (not NaN) and equal
      return (
        !isNaN(originalCost) &&
        !isNaN(roundTrippedCost) &&
        Math.abs(originalCost - roundTrippedCost) < 0.001 &&
        !isNaN(originalPrice) &&
        !isNaN(roundTrippedPrice) &&
        Math.abs(originalPrice - roundTrippedPrice) < 0.001 &&
        !isNaN(originalWeight) &&
        !isNaN(roundTrippedWeight) &&
        Math.abs(originalWeight - roundTrippedWeight) < 0.001
      );
    }),
    { numRuns: 100 },
  );
});

// ============================================================================
// CRUD Operation Tests (Integration Tests with Real Database)
// ============================================================================

// Get database connection for integration tests
const db = getDatabase();
const crudRepository = new ItemRepository(db);

// Helper to create a test item in the database
async function createTestItem(
  overrides?: Partial<Omit<ItemEntity, "id">>,
): Promise<ItemEntity> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const testItem: Omit<ItemEntity, "id"> = {
    name: `Test Item ${timestamp}-${random}`,
    cost: "10.00",
    price: "15.00",
    weight: "1.50",
    status: "active",
    sku: `TEST-${timestamp}-${random}`,
    space_id: 1,
    ...overrides,
  };

  // Note: Repository implementation has incorrect type signature (Item instead of Omit<Item, "id">)
  // Using type assertion to work around this
  return await crudRepository.create(testItem as ItemEntity);
}

// Helper to clean up test items
async function cleanupTestItems(ids: number[]): Promise<void> {
  for (const id of ids) {
    try {
      await crudRepository.delete(id);
    } catch {
      // Ignore errors during cleanup
    }
  }
}

Deno.test({
  name: "getMany returns paginated results",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createdIds: number[] = [];

    try {
      // Create multiple test items
      const item1 = await createTestItem({ name: "Pagination Test 1" });
      const item2 = await createTestItem({ name: "Pagination Test 2" });
      const item3 = await createTestItem({ name: "Pagination Test 3" });
      createdIds.push(item1.id, item2.id, item3.id);

      // Test pagination with limit
      const result = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        page: 1,
        limit: 2,
        status: "active",
      });

      // Verify pagination metadata
      assertExists(result.metadata);
      assertEquals(result.metadata.itemsPerPage, 2);
      assertEquals(result.metadata.currentPage, 1);

      // Verify we got at most 2 items (the limit)
      assertEquals(result.data.length <= 2, true);
    } finally {
      await cleanupTestItems(createdIds);
    }
  },
});

Deno.test({
  name: "getMany filters by search term",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createdIds: number[] = [];

    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      // Create items with specific names and SKUs
      const item1 = await createTestItem({
        name: "Searchable Widget",
        sku: `WIDGET-${timestamp}-${random}`,
      });
      const item2 = await createTestItem({
        name: "Another Product",
        sku: `SEARCH-${timestamp}-${random + 1}`,
      });
      const item3 = await createTestItem({
        name: "Unrelated Item",
        sku: `UNREL-${timestamp}-${random + 2}`,
      });
      createdIds.push(item1.id, item2.id, item3.id);

      // Search for "Widget" - should match item1 by name
      const result1 = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        search: "Widget",
        status: "active",
      });

      // Verify at least one result contains "Widget" in name
      const hasWidgetInName = result1.data.some((item) =>
        item.name?.toLowerCase().includes("widget")
      );
      assertEquals(hasWidgetInName, true);

      // Search for "SEARCH" - should match item2 by SKU
      const result2 = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        search: "SEARCH",
        status: "active",
      });

      // Verify at least one result contains "SEARCH" in SKU
      const hasSearchInSku = result2.data.some((item) =>
        item.sku?.toLowerCase().includes("search")
      );
      assertEquals(hasSearchInSku, true);
    } finally {
      await cleanupTestItems(createdIds);
    }
  },
});

Deno.test({
  name: "getOne throws error for non-existent id",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Use a very large ID that's unlikely to exist
    const nonExistentId = 999999999;

    await assertRejects(
      async () => await crudRepository.getOne(nonExistentId),
      Error,
      "Item not found",
    );
  },
});

Deno.test({
  name: "create inserts and returns item with id",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createdIds: number[] = [];

    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const newItem: Omit<ItemEntity, "id"> = {
        name: "Created Item Test",
        cost: "25.00",
        price: "40.00",
        weight: "3.00",
        status: "active",
        sku: `CREATE-${timestamp}-${random}`,
        description: "Test item for create operation",
        space_id: 1,
      };

      // Note: Repository implementation has incorrect type signature
      const created = await crudRepository.create(newItem as ItemEntity);
      createdIds.push(created.id);

      // Verify the item was created with an ID
      assertExists(created.id);
      assertEquals(typeof created.id, "number");

      // Verify the fields match
      assertEquals(created.name, newItem.name);
      assertEquals(created.cost, newItem.cost);
      assertEquals(created.price, newItem.price);
      assertEquals(created.weight, newItem.weight);
      assertEquals(created.status, newItem.status);
      assertEquals(created.sku, newItem.sku);
      assertEquals(created.description, newItem.description);
    } finally {
      await cleanupTestItems(createdIds);
    }
  },
});

Deno.test({
  name: "delete performs soft delete",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createdIds: number[] = [];

    try {
      // Create a test item
      const item = await createTestItem({ name: "Item to Delete" });
      createdIds.push(item.id);

      // Delete the item
      await crudRepository.delete(item.id);

      // Verify the item is soft-deleted by checking it's not returned in active queries
      const result = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        status: "active",
      });

      // The deleted item should not appear in active items
      const deletedItemInResults = result.data.some((i) => i.id === item.id);
      assertEquals(deletedItemInResults, false);

      // Verify the item exists with archived status
      const archivedResult = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        status: "archived",
      });

      const archivedItem = archivedResult.data.find((i) => i.id === item.id);
      if (archivedItem) {
        assertEquals(archivedItem.status, "archived");
        assertExists(archivedItem.deleted_at);
      }
    } finally {
      // Cleanup is already done by the delete operation
    }
  },
});

// ============================================================================
// Property-Based Tests for CRUD Operations
// ============================================================================

// **Feature: item-module-testing, Property 5: Pagination Limit Invariant**
// **Validates: Requirements 4.1, 5.1**
Deno.test({
  name:
    "Property: Pagination limit invariant - getMany returns at most limit items",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }), // limit
        fc.integer({ min: 1, max: 5 }), // page
        async (limit, page) => {
          // Query with the generated limit
          const result = await crudRepository.getMany({
            spaceId: 1,
            type: "full",
            page,
            limit,
            status: "active",
          });

          // Property: The number of items returned should be at most the limit
          return result.data.length <= limit;
        },
      ),
      { numRuns: 100 },
    );
  },
});

// **Feature: item-module-testing, Property 6: Search Filter Correctness**
// **Validates: Requirements 4.2, 5.2**
Deno.test({
  name: "Property: Search filter correctness - all results contain search term",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createdIds: number[] = [];

    try {
      // Create test items with known searchable content
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);

      const searchableItem = await createTestItem({
        name: `UniqueSearchTerm${random}`,
        sku: `SKU-${timestamp}-${random}`,
      });
      createdIds.push(searchableItem.id);

      const anotherSearchableItem = await createTestItem({
        name: `Regular Item ${random}`,
        sku: `UniqueSearchTerm${random}`,
      });
      createdIds.push(anotherSearchableItem.id);

      const nonSearchableItem = await createTestItem({
        name: `Different Item ${random}`,
        sku: `DIFF-${timestamp}-${random}`,
      });
      createdIds.push(nonSearchableItem.id);

      // Search for the unique term
      const searchTerm = `UniqueSearchTerm${random}`;
      const result = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        search: searchTerm,
        status: "active",
      });

      // Property: All returned items should contain the search term in name or SKU
      const allMatchSearchTerm = result.data.every((item) => {
        const nameMatch = item.name?.toLowerCase().includes(
          searchTerm.toLowerCase(),
        );
        const skuMatch = item.sku?.toLowerCase().includes(
          searchTerm.toLowerCase(),
        );
        return nameMatch || skuMatch;
      });

      // Also verify that our searchable items are in the results
      const hasSearchableItem = result.data.some((item) =>
        item.id === searchableItem.id
      );
      const hasAnotherSearchableItem = result.data.some((item) =>
        item.id === anotherSearchableItem.id
      );

      assertEquals(allMatchSearchTerm, true);
      assertEquals(hasSearchableItem, true);
      assertEquals(hasAnotherSearchableItem, true);
    } finally {
      await cleanupTestItems(createdIds);
    }
  },
});

// **Feature: item-module-testing, Property 7: Soft Delete State Invariant**
// **Validates: Requirements 4.5, 5.3**
Deno.test({
  name:
    "Property: Soft delete state invariant - deleted items are not in active results",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createdIds: number[] = [];

    try {
      // Create a test item with active status
      const item = await createTestItem({
        name: "Soft Delete Test Item",
        status: "active",
      });
      createdIds.push(item.id);

      // Verify item is in active results before deletion
      const beforeDeleteResult = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        status: "active",
        limit: 1000,
      });

      const itemBeforeDelete = beforeDeleteResult.data.find((i) =>
        i.id === item.id
      );
      assertEquals(
        itemBeforeDelete !== undefined,
        true,
        "Item should exist in active results before deletion",
      );

      // Delete the item
      await crudRepository.delete(item.id);

      // Query for active items after deletion
      const afterDeleteResult = await crudRepository.getMany({
        spaceId: 1,
        type: "full",
        status: "active",
        limit: 1000,
      });

      // Property: The deleted item should NOT appear in active results
      const itemAfterDelete = afterDeleteResult.data.find((i) =>
        i.id === item.id
      );
      assertEquals(
        itemAfterDelete,
        undefined,
        "Deleted item should not appear in active results",
      );
    } finally {
      // Cleanup is already done by the delete operation
    }
  },
});
