import { assertEquals, assertRejects } from "@std/assert";
import { TransactionService } from "./transaction.service.ts";
import { MockTransactionRepository } from "../__tests__/mocks/transaction.repository.mock.ts";
import { transactionsList, createTransactionData, updateTransactionData } from "../__tests__/fixtures/transaction.fixtures.ts";
import type { GetManyTransactionsProps } from "./transaction-repository.interface.ts";

Deno.test("TransactionService - getMany delegates to repository", async () => {
  const mockRepo = new MockTransactionRepository({ transactions: transactionsList });
  const service = new TransactionService(mockRepo);
  const props: GetManyTransactionsProps = { page: 1, limit: 10 };

  const result = await service.getMany(props);

  const calls = mockRepo.getCallsForMethod("getMany");
  assertEquals(calls.length, 1);
  assertEquals(calls[0].args[0], props);
  assertEquals(result.data.length, transactionsList.length);
});

Deno.test("TransactionService - getOne delegates to repository", async () => {
  const mockRepo = new MockTransactionRepository({ transactions: transactionsList });
  const service = new TransactionService(mockRepo);

  const result = await service.getOne(1);

  const calls = mockRepo.getCallsForMethod("getOne");
  assertEquals(calls.length, 1);
  assertEquals(result.id, 1);
});

Deno.test("TransactionService - create delegates to repository", async () => {
  const mockRepo = new MockTransactionRepository({ transactions: [] });
  const service = new TransactionService(mockRepo);

  const result = await service.create(createTransactionData);

  const calls = mockRepo.getCallsForMethod("create");
  assertEquals(calls.length, 1);
  assertEquals(result.name, createTransactionData.name);
});

Deno.test("TransactionService - update delegates to repository", async () => {
  const mockRepo = new MockTransactionRepository({ transactions: transactionsList });
  const service = new TransactionService(mockRepo);

  const result = await service.update(1, updateTransactionData);

  const calls = mockRepo.getCallsForMethod("update");
  assertEquals(calls.length, 1);
  assertEquals(result.name, updateTransactionData.name);
});

Deno.test("TransactionService - delete delegates to repository", async () => {
  const mockRepo = new MockTransactionRepository({ transactions: transactionsList });
  const service = new TransactionService(mockRepo);

  await service.delete(1);

  const calls = mockRepo.getCallsForMethod("delete");
  assertEquals(calls.length, 1);
});

Deno.test("TransactionService - getMany propagates repository errors", async () => {
  const mockRepo = new MockTransactionRepository({ shouldThrow: new Error("Database connection failed") });
  const service = new TransactionService(mockRepo);

  await assertRejects(() => service.getMany({}), Error, "Database connection failed");
});

Deno.test("TransactionService - getOne propagates repository errors", async () => {
  const mockRepo = new MockTransactionRepository({ shouldThrow: new Error("Transaction not found") });
  const service = new TransactionService(mockRepo);

  await assertRejects(() => service.getOne(999), Error, "Transaction not found");
});

Deno.test("TransactionService - create propagates repository errors", async () => {
  const mockRepo = new MockTransactionRepository({ shouldThrow: new Error("Validation failed") });
  const service = new TransactionService(mockRepo);

  await assertRejects(() => service.create(createTransactionData), Error, "Validation failed");
});

Deno.test("TransactionService - update propagates repository errors", async () => {
  const mockRepo = new MockTransactionRepository({ shouldThrow: new Error("Transaction not found") });
  const service = new TransactionService(mockRepo);

  await assertRejects(() => service.update(999, updateTransactionData), Error, "Transaction not found");
});

Deno.test("TransactionService - delete propagates repository errors", async () => {
  const mockRepo = new MockTransactionRepository({ shouldThrow: new Error("Transaction not found") });
  const service = new TransactionService(mockRepo);

  await assertRejects(() => service.delete(999), Error, "Transaction not found");
});
