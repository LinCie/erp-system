import type { TradeEntity } from "../domain/entities/trade.entity.ts";
import type { TradeDetailEntity } from "../domain/entities/trade-detail.entity.ts";
import type {
  GetManyTradesProps,
  GetManyTradesReturn,
} from "./types/get-many-trades.type.ts";
import type { GetOneTradeProps } from "./types/get-one-trade.type.ts";
import type { CreateTradeProps } from "./types/create-trade.type.ts";
import type { CreateTradeDetailProps } from "./types/create-trade-detail.type.ts";
import type { UpdateTradeProps } from "./types/update-trade.type.ts";
import type { UpdateTradeDetailProps } from "./types/update-trade-detail.type.ts";
import type {
  BatchOperation,
  BatchOperationReturn,
} from "./batch-operations.type.ts";

type TradeRepository = {
  /** Trade */
  // Get
  getMany(props: GetManyTradesProps): Promise<GetManyTradesReturn>;
  getOne(props: GetOneTradeProps): Promise<TradeEntity | undefined>;
  getOneByNumber(number: string): Promise<TradeEntity | undefined>;
  // Create
  create(data: CreateTradeProps): Promise<number | undefined>;
  // Update
  update(id: number, data: UpdateTradeProps): Promise<void>;
  // Delete
  delete(id: number, deletedAt: Date): Promise<void>;

  /** Trade Detail */
  // Get
  getOneDetail(
    detailId: number,
  ): Promise<TradeDetailEntity | undefined>;
  // Create
  createDetail(
    tradeId: number,
    data: CreateTradeDetailProps,
  ): Promise<number | undefined>;
  // Update
  updateDetail(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailProps,
  ): Promise<void>;
  // Delete
  deleteDetail(
    tradeId: number,
    detailId: number,
    deletedAt: Date,
  ): Promise<void>;
  // Batch
  executeBatch(
    operations: BatchOperation[],
  ): Promise<BatchOperationReturn>;
};

export type { TradeRepository };
