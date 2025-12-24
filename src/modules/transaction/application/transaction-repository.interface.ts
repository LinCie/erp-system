import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import { TransactionEntity as Transaction } from "../domain/transaction.entity.ts";
import { TransactionDetailEntity as TransactionDetail } from "../domain/transaction-detail.entity.ts";

type GetManyTransactionsProps = Omit<GetManyPropsType, "sort" | "status"> & {
  sort?: "id" | "created_at" | "sent_time" | "received_time" | "total";
  status?: string; // Override to allow transaction-specific statuses
  model_type?: string;
  sender_id?: number;
  receiver_id?: number;
  handler_id?: number;
  sent_time_from?: Date;
  sent_time_to?: Date;
  received_time_from?: Date;
  received_time_to?: Date;
};

type GetManyTransactionsReturn = {
  data: Transaction[];
  metadata: GetManyMetadataType;
};

interface ITransactionRepository {
  getMany(props: GetManyTransactionsProps): Promise<GetManyTransactionsReturn>;
  getOne(id: number, includeDetails?: boolean): Promise<Transaction>;
  create(data: Omit<Transaction, "id">): Promise<Transaction>;
  update(id: number, data: Partial<Transaction>): Promise<Transaction>;
  updateWithDetails(
    id: number,
    transaction: Partial<Transaction>,
    details: Omit<TransactionDetail, "id" | "transaction_id">[],
  ): Promise<Transaction>;
  delete(id: number): Promise<void>;
  generateNumber(transaction: Transaction): string;
  calculateTotals(details: TransactionDetail[]): {
    total: string;
    total_details: string;
  };
}

export type {
  GetManyTransactionsProps,
  GetManyTransactionsReturn,
  ITransactionRepository,
};
