import { TradeDetailEntity } from "../domain/entities/trade-detail.entity.ts";
import { TradeEntity } from "../domain/entities/trade.entity.ts";
import { CreateTradeDetailProps } from "./types/create-trade-detail.type.ts";
import { CreateTradeProps } from "./types/create-trade.type.ts";
import { UpdateTradeDetailProps } from "./types/update-trade-detail.type.ts";
import { UpdateTradeProps } from "./types/update-trade.type.ts";

export type BatchReadOperation = {
  type: "read";
  ids: number[];
  withDetails?: boolean;
};

export type BatchCreateOperation = {
  type: "create";
  ref?: string;
  data: CreateTradeProps;
};

export type BatchUpdateOperation = {
  type: "update";
  id?: number;
  idRef?: string;
  data: UpdateTradeProps;
};

export type BatchUpdateDetailOperation = {
  type: "updateDetail";
  tradeId?: number;
  tradeIdRef?: string;
  detailId: number;
  data: UpdateTradeDetailProps;
};

export type BatchCreateDetailOperation = {
  type: "createDetail";
  tradeId?: number;
  tradeIdRef?: string;
  data: CreateTradeDetailProps;
};

export type BatchDeleteDetailOperation = {
  type: "deleteDetail";
  tradeId?: number;
  tradeIdRef?: string;
  detailId: number;
};

export type BatchDeleteOperation = {
  type: "delete";
  id?: number;
  idRef?: string;
};

export type BatchOperation =
  | BatchReadOperation
  | BatchCreateOperation
  | BatchUpdateOperation
  | BatchUpdateDetailOperation
  | BatchCreateDetailOperation
  | BatchDeleteDetailOperation
  | BatchDeleteOperation;

export type BatchOperationReturn = {
  created: TradeEntity[];
  read: TradeEntity[];
  updated: TradeEntity[];
  deleted: number[];
  createdDetails: TradeDetailEntity[];
  updatedDetails: TradeDetailEntity[];
  deletedDetails: number[];
};
