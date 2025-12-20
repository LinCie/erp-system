import type { TransactionEntity } from "../../domain/transaction.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

const validTransaction: TransactionEntity = {
  id: 1,
  name: "Test Transaction",
  status: "active",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

const minimalTransaction: TransactionEntity = {
  id: 2,
  name: "Minimal Transaction",
  status: "active",
};

const inactiveTransaction: TransactionEntity = {
  id: 3,
  name: "Inactive Transaction",
  status: "inactive",
};

const archivedTransaction: TransactionEntity = {
  id: 4,
  name: "Archived Transaction",
  status: "archived",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
};

const transactionsList: TransactionEntity[] = [
  validTransaction,
  minimalTransaction,
  inactiveTransaction,
  { id: 5, name: "Fourth Transaction", status: "active" },
  { id: 6, name: "Fifth Transaction", status: "active" },
];

const sampleMetadata: GetManyMetadataType = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 5,
  totalPages: 1,
};

const createTransactionData: Omit<TransactionEntity, "id"> = {
  name: "New Transaction",
  status: "active",
};

const updateTransactionData: Partial<TransactionEntity> = {
  name: "Updated Transaction Name",
};

export {
  archivedTransaction,
  createTransactionData,
  inactiveTransaction,
  transactionsList,
  minimalTransaction,
  sampleMetadata,
  updateTransactionData,
  validTransaction,
};
