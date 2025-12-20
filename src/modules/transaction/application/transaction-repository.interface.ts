import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import { TransactionEntity as Transaction } from "../domain/transaction.entity.ts";

type GetManyTransactionsProps = GetManyPropsType;

type GetManyTransactionsReturn = {
  data: Transaction[];
  metadata: GetManyMetadataType;
};

interface ITransactionRepository {
  getMany(props: GetManyTransactionsProps): Promise<GetManyTransactionsReturn>;
  getOne(id: number): Promise<Transaction>;
  create(data: Omit<Transaction, "id">): Promise<Transaction>;
  update(id: number, data: Partial<Transaction>): Promise<Transaction>;
  delete(id: number): Promise<void>;
}

export type { GetManyTransactionsProps, GetManyTransactionsReturn, ITransactionRepository };
