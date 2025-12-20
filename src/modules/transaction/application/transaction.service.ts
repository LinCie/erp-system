import {
  GetManyTransactionsProps,
  ITransactionRepository,
} from "./transaction-repository.interface.ts";
import { TransactionEntity as Transaction } from "../domain/transaction.entity.ts";

class TransactionService {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async getMany(props: GetManyTransactionsProps) {
    return await this.transactionRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.transactionRepository.getOne(id);
  }

  async create(data: Omit<Transaction, "id">) {
    return await this.transactionRepository.create(data);
  }

  async update(id: number, data: Partial<Transaction>) {
    return await this.transactionRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.transactionRepository.delete(id);
  }
}

export { TransactionService };
