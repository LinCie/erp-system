import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { TransactionRepository } from "../infrastructure/transaction.repository.ts";
import { TransactionService } from "../application/transaction.service.ts";
import { defineTransactionController } from "./transaction.controller.ts";
import { TransactionMapper } from "../infrastructure/transaction.mapper.ts";

const db = getDatabase();

const transactionMapper = new TransactionMapper();
const transactionRepo = new TransactionRepository(db, transactionMapper);
const transactionService = new TransactionService(transactionRepo);
const transactionController = defineTransactionController(transactionService);

export { transactionController };
