import type { TradeEntity } from "../domain/trade.entity.ts";
import type { TradeDetailType } from "../domain/trade-detail.type.ts";
import type {
  CreateTradeData,
  CreateTradeDetailData,
  UpdateTradeData,
  UpdateTradeDetailData,
  UpdateTradeTransactionData,
} from "./trade-repository.interface.ts";

export type BatchReadOperation = {
  type: "read";
  ids: number[];
  withDetails?: boolean;
};

export type BatchCreateOperation = {
  type: "create";
  data: CreateTradeData;
};

export type BatchUpdateOperation = {
  type: "update";
  id: number;
  data: UpdateTradeData;
};

export type BatchUpdateTransactionOperation = {
  type: "updateTransaction";
  id: number;
  data: UpdateTradeTransactionData;
};

export type BatchUpdateDetailOperation = {
  type: "updateDetail";
  tradeId: number;
  detailId: number;
  data: UpdateTradeDetailData;
};

export type BatchCreateDetailOperation = {
  type: "createDetail";
  tradeId: number;
  data: CreateTradeDetailData;
};

export type BatchDeleteDetailOperation = {
  type: "deleteDetail";
  tradeId: number;
  detailId: number;
};

export type BatchDeleteOperation = {
  type: "delete";
  id: number;
};

export type BatchOperation =
  | BatchReadOperation
  | BatchCreateOperation
  | BatchUpdateOperation
  | BatchUpdateTransactionOperation
  | BatchUpdateDetailOperation
  | BatchCreateDetailOperation
  | BatchDeleteDetailOperation
  | BatchDeleteOperation;

export type BatchOperationResult = {
  created: TradeEntity[];
  read: TradeEntity[];
  updated: TradeEntity[];
  deleted: number[];
  createdDetails: TradeDetailType[];
  updatedDetails: TradeDetailType[];
  deletedDetails: number[];
};
