import { assertEquals, assertRejects } from "@std/assert";
import { InventoryService } from "./inventory.service.ts";
import { MockInventoryRepository } from "../__tests__/mocks/inventory.repository.mock.ts";
import { inventoriesList, createInventoryData, updateInventoryData } from "../__tests__/fixtures/inventory.fixtures.ts";
import type { GetManyInventoriesProps } from "./inventory-repository.interface.ts";

Deno.test("InventoryService - getMany delegates to repository", async () => {
  const mockRepo = new MockInventoryRepository({ inventories: inventoriesList });
  const service = new InventoryService(mockRepo);
  const props: GetManyInventoriesProps = { page: 1, limit: 10 };

  const result = await service.getMany(props);

  const calls = mockRepo.getCallsForMethod("getMany");
  assertEquals(calls.length, 1);
  assertEquals(calls[0].args[0], props);
  assertEquals(result.data.length, inventoriesList.length);
});

Deno.test("InventoryService - getOne delegates to repository", async () => {
  const mockRepo = new MockInventoryRepository({ inventories: inventoriesList });
  const service = new InventoryService(mockRepo);

  const result = await service.getOne(1);

  const calls = mockRepo.getCallsForMethod("getOne");
  assertEquals(calls.length, 1);
  assertEquals(result.id, 1);
});

Deno.test("InventoryService - create delegates to repository", async () => {
  const mockRepo = new MockInventoryRepository({ inventories: [] });
  const service = new InventoryService(mockRepo);

  const result = await service.create(createInventoryData);

  const calls = mockRepo.getCallsForMethod("create");
  assertEquals(calls.length, 1);
  assertEquals(result.name, createInventoryData.name);
});

Deno.test("InventoryService - update delegates to repository", async () => {
  const mockRepo = new MockInventoryRepository({ inventories: inventoriesList });
  const service = new InventoryService(mockRepo);

  const result = await service.update(1, updateInventoryData);

  const calls = mockRepo.getCallsForMethod("update");
  assertEquals(calls.length, 1);
  assertEquals(result.name, updateInventoryData.name);
});

Deno.test("InventoryService - delete delegates to repository", async () => {
  const mockRepo = new MockInventoryRepository({ inventories: inventoriesList });
  const service = new InventoryService(mockRepo);

  await service.delete(1);

  const calls = mockRepo.getCallsForMethod("delete");
  assertEquals(calls.length, 1);
});

Deno.test("InventoryService - getMany propagates repository errors", async () => {
  const mockRepo = new MockInventoryRepository({ shouldThrow: new Error("Database connection failed") });
  const service = new InventoryService(mockRepo);

  await assertRejects(() => service.getMany({}), Error, "Database connection failed");
});

Deno.test("InventoryService - getOne propagates repository errors", async () => {
  const mockRepo = new MockInventoryRepository({ shouldThrow: new Error("Inventory not found") });
  const service = new InventoryService(mockRepo);

  await assertRejects(() => service.getOne(999), Error, "Inventory not found");
});

Deno.test("InventoryService - create propagates repository errors", async () => {
  const mockRepo = new MockInventoryRepository({ shouldThrow: new Error("Validation failed") });
  const service = new InventoryService(mockRepo);

  await assertRejects(() => service.create(createInventoryData), Error, "Validation failed");
});

Deno.test("InventoryService - update propagates repository errors", async () => {
  const mockRepo = new MockInventoryRepository({ shouldThrow: new Error("Inventory not found") });
  const service = new InventoryService(mockRepo);

  await assertRejects(() => service.update(999, updateInventoryData), Error, "Inventory not found");
});

Deno.test("InventoryService - delete propagates repository errors", async () => {
  const mockRepo = new MockInventoryRepository({ shouldThrow: new Error("Inventory not found") });
  const service = new InventoryService(mockRepo);

  await assertRejects(() => service.delete(999), Error, "Inventory not found");
});
