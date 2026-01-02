import type { BaseEntity } from "@/shared/domain/base.entity.ts";
import type { FileType } from "@/shared/domain/types/file.type.ts";
import type { LinkType } from "@/shared/domain/types/link.type.ts";
import type { TradeDetailType } from "./trade-detail.type.ts";
import type { TradeStatusType } from "./trade-status.type.ts";
import type { PlayerInfo } from "./player-info.type.ts";

/**
 * TradeEntity represents a trade transaction between parties (sender, receiver, handler).
 *
 * Status values: TX_DRAFT, TX_READY, TX_SENT, TX_RECEIVED, TX_COMPLETED, TX_CANCELED, TX_RETURN, TX_CLOSED
 *
 * Numeric fields (total, fee) are stored as string representations of decimal numbers for precision.
 */
interface TradeEntity extends Omit<BaseEntity, "status"> {
  number: string;
  space_id: number;
  status: TradeStatusType;
  total: string;
  sent_time?: Date;
  received_time?: Date;
  sender_id?: number;
  receiver_id?: number;
  handler_id?: number;
  parent_id?: number;
  sender_notes?: string;
  receiver_notes?: string;
  handler_notes?: string;
  description?: string;
  fee?: string;
  files?: FileType[];
  tags?: string[];
  links?: LinkType[];
  details?: TradeDetailType[];
  /** Player info for sender relationship */
  sender?: PlayerInfo;
  /** Player info for receiver relationship */
  receiver?: PlayerInfo;
  /** Player info for handler relationship */
  handler?: PlayerInfo;
  /** Computed: comma-separated SKUs from details */
  sku?: string;
  /** Computed: combined sender_notes and handler_notes */
  all_notes?: string;
}

export type { TradeEntity };
