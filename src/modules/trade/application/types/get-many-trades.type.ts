import type { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import type { TradeEntity } from "@/modules/trade/domain/entities/trade.entity.ts";
import type { TradeStatusType } from "@/modules/trade/domain/types/trade-status.type.ts";

/**
 * Props for getMany operation
 * Extends shared GetManyPropsType with trade-specific fields
 */
type GetManyTradesProps = Omit<GetManyPropsType, "status" | "sort"> & {
  spaceId: number;
  modelType?: string;
  withDetails?: boolean;
  withPlayers?: boolean;
  withChildren?: boolean;
  withParent?: boolean;
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

export type { GetManyTradesProps, GetManyTradesReturn };
