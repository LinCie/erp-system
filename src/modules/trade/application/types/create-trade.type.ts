import type { TradeStatusType } from "../../domain/types/trade-status.type.ts";
import type { TradePlayerContact } from "../../domain/types/trade-player.type.ts";
import type { TradeTimestamp } from "../../domain/types/trade-timestamp.type.ts";
import type { TradeAddress } from "../../domain/types/trade-address.type.ts";
import type { FileType } from "@/shared/domain/types/file.type.ts";
import type { LinkType } from "@/shared/domain/types/link.type.ts";

/**
 * Data required to create a new trade
 */
type CreateTradeProps = {
  spaceId: number;
  senderId: number;

  number?: string;
  status?: TradeStatusType;
  sentTime?: Date;
  senderNotes?: string;

  /** Optional fields for richer creation */
  description?: string;
  fee?: string;
  total?: string;
  receiverId?: number;
  handlerId?: number;
  players?: TradePlayerContact;
  timestamps?: TradeTimestamp;
  addresses?: TradeAddress;
  files?: FileType[];
  tags?: string[];
  links?: LinkType[];

  createdAt?: Date;
  updatedAt?: Date;
};

export type { CreateTradeProps };
