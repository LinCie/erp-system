import type { FileType } from "@/shared/domain/types/file.type.ts";
import type { LinkType } from "@/shared/domain/types/link.type.ts";
import type { TradeStatusType } from "../types/trade-status.type.ts";
import type { TradePlayer as TradePlayerEntity } from "../entities/trade-player.entity.ts";
import type { TradePlayerContact } from "../types/trade-player.type.ts";
import type { TradeTimestamp } from "../types/trade-timestamp.type.ts";
import type { TradeAddress } from "../types/trade-address.type.ts";
import type { TradeDetailEntity } from "../entities/trade-detail.entity.ts";

interface TradeWithChildren {
  withChildren: true;

  /** Child trades (e.g. split trades) */
  children?: TradeEntity[];
}

interface TradeWithoutChildren {
  withChildren: false;

  /** Child trades (e.g. split trades) */
  children: never;
}

type TradeChildren = TradeWithChildren | TradeWithoutChildren;

interface TradeWithParent {
  withParent: true;

  /** Relationships */

  /** Parent trade relationship */
  parent?: TradeEntity;
}

interface TradeWithoutParent {
  withParent: false;

  /** Relationships */

  /** Parent trade relationship */
  parent: never;
}

type TradeParent = TradeWithParent | TradeWithoutParent;

interface TradeWithPlayers {
  withPlayers: true;

  /** Relationships */

  /** Player info for sender relationship */
  sender?: TradePlayerEntity;
  /** Player info for receiver relationship */
  receiver?: TradePlayerEntity;
  /** Player info for handler relationship */
  handler?: TradePlayerEntity;
}

interface TradeWithoutPlayers {
  withPlayers: false;

  /** Relationships */

  /** Player info for sender relationship */
  sender: never;
  /** Player info for receiver relationship */
  receiver: never;
  /** Player info for handler relationship */
  handler: never;
}

type TradePlayers = TradeWithPlayers | TradeWithoutPlayers;

interface TradeWithDetails {
  withDetails: true;
  details: TradeDetailEntity[];
}

interface TradeWithoutDetails {
  withDetails: false;
  details: never;
}

type TradeDetails = TradeWithDetails | TradeWithoutDetails;

/**
 * TradeEntity represents a trade transaction between parties (sender, receiver, handler).
 *
 * Status values: TX_DRAFT, TX_READY, TX_SENT, TX_RECEIVED, TX_COMPLETED, TX_CANCELED, TX_RETURN, TX_CLOSED
 *
 * Numeric fields (total, fee) are stored as string representations of decimal numbers for precision.
 */
type TradeEntity =
  & TradeDetails
  & TradePlayers
  & TradeParent
  & TradeChildren
  & {
    /** Base fields (camelCase to match mapper output) */
    id: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    /** Basic info (Required) */
    number: string;
    spaceId: number;
    status: TradeStatusType;
    total: string;

    /** Foreign key IDs */
    senderId?: number;
    receiverId?: number;
    handlerId?: number;
    parentId?: number;

    /** Basic info (Optional) */
    description?: string;
    fee?: string;
    files?: FileType[];
    tags?: string[];
    links?: LinkType[];
    senderNotes?: string;
    receiverNotes?: string;
    handlerNotes?: string;

    /** JSON fields */
    players?: TradePlayerContact;
    timestamps?: TradeTimestamp;
    addresses?: TradeAddress;

    /** Legacy fields */
    sentTime?: Date;
    receivedTime?: Date;
  };

export type { TradeEntity };
