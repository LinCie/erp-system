import type { TradeEntity } from "../../domain/entities/trade.entity.ts";
import type { TradeStatusType } from "../../domain/types/trade-status.type.ts";
import type { TradePlayerContact } from "../../domain/types/trade-player.type.ts";
import type { TradeTimestamp } from "../../domain/types/trade-timestamp.type.ts";
import type { TradeAddress } from "../../domain/types/trade-address.type.ts";

/**
 * Data for updating an existing trade
 */
type UpdateTradeProps = {
  handlerId?: number;
  receiverId?: number;
  parentId?: number;
  number?: string;
  sentTime?: Date;
  receivedTime?: Date;
  senderNotes?: string;
  receiverNotes?: string;
  handlerNotes?: string;
  description?: string;
  status?: TradeStatusType;
  total?: string;
  fee?: string;
  files?: TradeEntity["files"];
  tags?: string[];
  links?: TradeEntity["links"];
  players?: TradePlayerContact;
  timestamps?: TradeTimestamp;
  addresses?: TradeAddress;

  updatedAt?: Date;
};

export type { UpdateTradeProps };
