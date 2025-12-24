import { TransactionDetailEntity as TransactionDetail } from "../domain/transaction-detail.entity.ts";

interface ITransactionDetailRepository {
  getMany(transaction_id: number): Promise<TransactionDetail[]>;
  getOne(id: number): Promise<TransactionDetail>;
  create(data: Omit<TransactionDetail, "id">): Promise<TransactionDetail>;
  createMany(
    data: Omit<TransactionDetail, "id">[],
  ): Promise<TransactionDetail[]>;
  update(
    id: number,
    data: Partial<TransactionDetail>,
  ): Promise<TransactionDetail>;
  delete(id: number): Promise<void>;
  deleteByTransactionId(transaction_id: number): Promise<void>;
}

export type { ITransactionDetailRepository };
