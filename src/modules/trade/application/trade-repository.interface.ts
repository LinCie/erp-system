import type { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import type { TradeEntity } from "../domain/trade.entity.ts";
import type { TradeStatusType } from "../domain/trade-status.type.ts";

/**
 * Props for getMany operation
 * Extends shared GetManyPropsType with trade-specific fields
 */
type GetManyTradesProps = Omit<GetManyPropsType, "status" | "sort"> & {
  spaceId: number;
  modelType?: string;
  withDetails?: boolean;
  withPlayers?: boolean;
  status?: TradeStatusType;
  sort?: "id" | "number" | "total" | "created_at" | "sent_time";
};

/**
 * Return type for getMany operation
 */
type GetManyTradesReturn = {
  data: TradeEntity[];
  metadata: GetManyMetadataType;
};

/**
 * Props for getOne operation
 */
type GetOneTradeProps = {
  id: number;
  withDetails?: boolean;
};

/**
 * Data required to create a new trade
 */
type CreateTradeData = {
  space_id: number;
  sender_id: number;
  sent_time?: Date;
  sender_notes?: string;
  number?: string;
};

/**
 * Detail input for update operation
 * Excludes calculated fields (id, debit, credit) which are set by repository
 */
type TradeDetailInput = {
  item_id: number;
  model_type: string;
  quantity: number;
  price: number;
  discount?: number;
  weight?: number;
  sku?: string;
  name?: string;
  notes?: string;
};

/**
 * Data for updating an existing trade
 */
type UpdateTradeData = {
  handler_id?: number;
  sent_time?: Date;
  received_time?: Date;
  receiver_id?: number;
  receiver_notes?: string;
  handler_notes?: string;
  description?: string;
  status?: TradeStatusType;
  parent_id?: number;
  files?: TradeEntity["files"];
  tags?: string[];
  links?: TradeEntity["links"];
  details?: TradeDetailInput[];
};

/**
 * Repository interface for trade data access operations
 */
interface ITradeRepository {
  getMany(props: GetManyTradesProps): Promise<GetManyTradesReturn>;
  getOne(props: GetOneTradeProps): Promise<TradeEntity>;
  create(data: CreateTradeData): Promise<TradeEntity>;
  update(id: number, data: UpdateTradeData): Promise<TradeEntity>;
  delete(id: number): Promise<void>;
}

export type {
  CreateTradeData,
  GetManyTradesProps,
  GetManyTradesReturn,
  GetOneTradeProps,
  ITradeRepository,
  TradeDetailInput,
  UpdateTradeData,
};
