import { assertEquals, assertRejects } from "@std/assert";
import { ItemService } from "./item.service.ts";
import { MockItemRepository } from "../__tests__/mocks/item.repository.mock.ts";
import { itemsList } from "../__tests__/fixtures/item.fixtures.ts";
import type { GetManyItemsProps } from "./item-repository.interface.ts";
import type { ItemEntity } from "../domain/item.entity.ts";

/**
 * Unit tests for ItemService
 * Tests verify that the service correctly delegates operations to the repository
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

Deno.test("ItemService - getMany delegates to repository", async () => {
  // Arrange
  const mockRepo = new MockItemRepository({ items: itemsList });
  const service = new ItemService(mockRepo);
  const props: GetManyItemsProps = {
    spaceId: 1,
    type: "full",
    page: 1,
    limit: 10,
  };

  // Act
  const result = await service.getMany(props);

  // Assert
  const calls = mockRepo.getCallsForMethod("getMany");
  assertEquals(calls.length, 1, "getMany should be called once");
  assertEquals(
    calls[0].args[0],
    props,
    "getMany should receive the same props",
  );
  assertEquals(result.data.length, itemsList.length, "Should return all items");
});

Deno.test("ItemService - getOne delegates to repository", async () => {
  // Arrange
  const mockRepo = new MockItemRepository({ items: itemsList });
  const service = new ItemService(mockRepo);
  const itemId = 1;

  // Act
  const result = await service.getOne(itemId);

  // Assert
  const calls = mockRepo.getCallsForMethod("getOne");
  assertEquals(calls.length, 1, "getOne should be called once");
  assertEquals(calls[0].args[0], itemId, "getOne should receive the same id");
  assertEquals(result.id, itemId, "Should return the correct item");
});

Deno.test("ItemService - create delegates to repository", async () => {
  // Arrange
  const mockRepo = new MockItemRepository({ items: [] });
  const service = new ItemService(mockRepo);
  const newItem: Omit<ItemEntity, "id"> = {
    name: "New Item",
    cost: "10.00",
    price: "15.00",
    weight: "1.50",
    status: "active",
    sku: "NEW-001",
  };

  // Act
  const result = await service.create(newItem);

  // Assert
  const calls = mockRepo.getCallsForMethod("create");
  assertEquals(calls.length, 1, "create should be called once");
  assertEquals(
    calls[0].args[0],
    newItem,
    "create should receive the same data",
  );
  assertEquals(result.name, newItem.name, "Should return the created item");
});

Deno.test("ItemService - update delegates to repository", async () => {
  // Arrange
  const mockRepo = new MockItemRepository({ items: itemsList });
  const service = new ItemService(mockRepo);
  const itemId = 1;
  const updateData: Partial<ItemEntity> = {
    name: "Updated Item",
    price: "20.00",
  };

  // Act
  const result = await service.update(itemId, updateData);

  // Assert
  const calls = mockRepo.getCallsForMethod("update");
  assertEquals(calls.length, 1, "update should be called once");
  assertEquals(calls[0].args[0], itemId, "update should receive the same id");
  assertEquals(
    calls[0].args[1],
    updateData,
    "update should receive the same data",
  );
  assertEquals(result.name, updateData.name, "Should return the updated item");
});

Deno.test("ItemService - delete delegates to repository", async () => {
  // Arrange
  const mockRepo = new MockItemRepository({ items: itemsList });
  const service = new ItemService(mockRepo);
  const itemId = 1;

  // Act
  await service.delete(itemId);

  // Assert
  const calls = mockRepo.getCallsForMethod("delete");
  assertEquals(calls.length, 1, "delete should be called once");
  assertEquals(calls[0].args[0], itemId, "delete should receive the same id");
});

Deno.test("ItemService - getMany propagates repository errors", async () => {
  // Arrange
  const error = new Error("Database connection failed");
  const mockRepo = new MockItemRepository({ shouldThrow: error });
  const service = new ItemService(mockRepo);
  const props: GetManyItemsProps = {
    spaceId: 1,
    type: "full",
  };

  // Act & Assert
  await assertRejects(
    () => service.getMany(props),
    Error,
    "Database connection failed",
    "Should propagate repository error",
  );
});

Deno.test("ItemService - getOne propagates repository errors", async () => {
  // Arrange
  const error = new Error("Item not found");
  const mockRepo = new MockItemRepository({ shouldThrow: error });
  const service = new ItemService(mockRepo);

  // Act & Assert
  await assertRejects(
    () => service.getOne(999),
    Error,
    "Item not found",
    "Should propagate repository error",
  );
});

Deno.test("ItemService - create propagates repository errors", async () => {
  // Arrange
  const error = new Error("Validation failed");
  const mockRepo = new MockItemRepository({ shouldThrow: error });
  const service = new ItemService(mockRepo);
  const newItem: Omit<ItemEntity, "id"> = {
    name: "New Item",
    cost: "10.00",
    price: "15.00",
    weight: "1.50",
    status: "active",
  };

  // Act & Assert
  await assertRejects(
    () => service.create(newItem),
    Error,
    "Validation failed",
    "Should propagate repository error",
  );
});

Deno.test("ItemService - update propagates repository errors", async () => {
  // Arrange
  const error = new Error("Item not found");
  const mockRepo = new MockItemRepository({ shouldThrow: error });
  const service = new ItemService(mockRepo);

  // Act & Assert
  await assertRejects(
    () => service.update(999, { name: "Updated" }),
    Error,
    "Item not found",
    "Should propagate repository error",
  );
});

Deno.test("ItemService - delete propagates repository errors", async () => {
  // Arrange
  const error = new Error("Item not found");
  const mockRepo = new MockItemRepository({ shouldThrow: error });
  const service = new ItemService(mockRepo);

  // Act & Assert
  await assertRejects(
    () => service.delete(999),
    Error,
    "Item not found",
    "Should propagate repository error",
  );
});

/**
 * Property-Based Tests for ItemService
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import fc from "fast-check";
import {
  createItemArb,
  getManyPropsArb,
  partialItemArb,
} from "../__tests__/arbitraries/item.arbitraries.ts";

// **Feature: item-module-testing, Property 1: Service Delegation Preserves Arguments**
Deno.test("Property: Service delegation preserves arguments for getMany", async () => {
  await fc.assert(
    fc.asyncProperty(getManyPropsArb, async (props) => {
      // Arrange
      const mockRepo = new MockItemRepository({ items: [] });
      const service = new ItemService(mockRepo);

      // Act
      await service.getMany(props);

      // Assert
      const calls = mockRepo.getCallsForMethod("getMany");
      assertEquals(calls.length, 1, "getMany should be called exactly once");
      assertEquals(
        calls[0].args[0],
        props,
        "getMany should receive identical props",
      );
    }),
    { numRuns: 100 },
  );
});

// **Feature: item-module-testing, Property 1: Service Delegation Preserves Arguments**
Deno.test("Property: Service delegation preserves arguments for getOne", async () => {
  await fc.assert(
    fc.asyncProperty(fc.nat(), async (id) => {
      // Arrange
      const mockItem = { ...itemsList[0], id };
      const mockRepo = new MockItemRepository({ items: [mockItem] });
      const service = new ItemService(mockRepo);

      // Act
      await service.getOne(id);

      // Assert
      const calls = mockRepo.getCallsForMethod("getOne");
      assertEquals(calls.length, 1, "getOne should be called exactly once");
      assertEquals(calls[0].args[0], id, "getOne should receive identical id");
    }),
    { numRuns: 100 },
  );
});

// **Feature: item-module-testing, Property 1: Service Delegation Preserves Arguments**
Deno.test("Property: Service delegation preserves arguments for create", async () => {
  await fc.assert(
    fc.asyncProperty(createItemArb, async (itemData) => {
      // Arrange
      const mockRepo = new MockItemRepository({ items: [] });
      const service = new ItemService(mockRepo);

      // Act
      await service.create(itemData);

      // Assert
      const calls = mockRepo.getCallsForMethod("create");
      assertEquals(calls.length, 1, "create should be called exactly once");
      assertEquals(
        calls[0].args[0],
        itemData,
        "create should receive identical data",
      );
    }),
    { numRuns: 100 },
  );
});

// **Feature: item-module-testing, Property 1: Service Delegation Preserves Arguments**
Deno.test("Property: Service delegation preserves arguments for update", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.nat(),
      partialItemArb,
      async (id, updateData) => {
        // Arrange
        const mockItem = { ...itemsList[0], id };
        const mockRepo = new MockItemRepository({ items: [mockItem] });
        const service = new ItemService(mockRepo);

        // Act
        await service.update(id, updateData);

        // Assert
        const calls = mockRepo.getCallsForMethod("update");
        assertEquals(calls.length, 1, "update should be called exactly once");
        assertEquals(
          calls[0].args[0],
          id,
          "update should receive identical id",
        );
        assertEquals(
          calls[0].args[1],
          updateData,
          "update should receive identical data",
        );
      },
    ),
    { numRuns: 100 },
  );
});

// **Feature: item-module-testing, Property 1: Service Delegation Preserves Arguments**
Deno.test("Property: Service delegation preserves arguments for delete", async () => {
  await fc.assert(
    fc.asyncProperty(fc.nat(), async (id) => {
      // Arrange
      const mockItem = { ...itemsList[0], id };
      const mockRepo = new MockItemRepository({ items: [mockItem] });
      const service = new ItemService(mockRepo);

      // Act
      await service.delete(id);

      // Assert
      const calls = mockRepo.getCallsForMethod("delete");
      assertEquals(calls.length, 1, "delete should be called exactly once");
      assertEquals(
        calls[0].args[0],
        id,
        "delete should receive identical id",
      );
    }),
    { numRuns: 100 },
  );
});
