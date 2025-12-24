import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { TransactionRepository } from "../infrastructure/transaction.repository.ts";
import { TransactionDetailRepository } from "../infrastructure/transaction-detail.repository.ts";
import { TransactionService } from "../application/transaction.service.ts";
import { defineTransactionController } from "./transaction.controller.ts";
import { TransactionMapper } from "../infrastructure/transaction.mapper.ts";
import { TransactionDetailMapper } from "../infrastructure/transaction-detail.mapper.ts";

const db = getDatabase();

const transactionMapper = new TransactionMapper();
const transactionDetailMapper = new TransactionDetailMapper();

const transactionDetailRepo = new TransactionDetailRepository(
  db,
  transactionDetailMapper,
);
const transactionRepo = new TransactionRepository(
  db,
  transactionMapper,
  transactionDetailRepo,
);

const transactionService = new TransactionService(
  transactionRepo,
  transactionDetailRepo,
);
const transactionController = defineTransactionController(transactionService);

export { transactionController };
