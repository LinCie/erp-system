import type { TradeEntity } from "../domain/entities/trade.entity.ts";
import type { TradeDetailEntity } from "../domain/entities/trade-detail.entity.ts";
import type { TradeRepository } from "./trade.repository.ts";
import type {
  BatchOperation,
  BatchOperationReturn,
} from "./batch-operations.type.ts";
import type { CreateTradeProps } from "./types/create-trade.type.ts";
import type { CreateTradeDetailProps } from "./types/create-trade-detail.type.ts";
import type {
  GetManyTradesProps,
  GetManyTradesReturn,
} from "./types/get-many-trades.type.ts";
import type { GetOneTradeProps } from "./types/get-one-trade.type.ts";
import type { UpdateTradeProps } from "./types/update-trade.type.ts";
import type { UpdateTradeDetailProps } from "./types/update-trade-detail.type.ts";
import { NotFoundError } from "@/shared/domain/errors/common.error.ts";

type successTradeLookupReturn = {
  id: number;
  success: true;
};

type failedTradeLookupReturn = {
  success: false;
};

type tradeLookupReturn = successTradeLookupReturn | failedTradeLookupReturn;

/**
 * TradeService orchestrates trade business logic via dependency injection.
 * Delegates all data access operations to the injected repository.
 */
class TradeService {
  constructor(private readonly tradeRepository: TradeRepository) {}

  async getMany(props: GetManyTradesProps): Promise<GetManyTradesReturn> {
    return await this.tradeRepository.getMany(props);
  }

  async getOne(props: GetOneTradeProps): Promise<TradeEntity> {
    const trade = await this.tradeRepository.getOne(props);

    if (!trade) {
      throw new NotFoundError("Trade not found");
    }

    return trade;
  }

  async create(data: CreateTradeProps): Promise<TradeEntity> {
    const cleanData: CreateTradeProps = {
      ...data,
      status: data.status ?? "TX_DRAFT",
      sentTime: data.sentTime ?? new Date(),
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    };

    const createdId = await this.tradeRepository.create(cleanData);
    if (!createdId) {
      throw new Error("Failed to create trade");
    }

    if (!data.number) {
      await this.update(createdId, { number: "TX_" + createdId });
    }

    return await this.getOne({ id: createdId });
  }

  async update(id: number, data: UpdateTradeProps): Promise<TradeEntity> {
    const cleanData: UpdateTradeProps = {
      ...data,
      updatedAt: data.updatedAt ?? new Date(),
    };

    await this.tradeRepository.update(id, cleanData);
    return this.getOne({ id });
  }

  delete(id: number): Promise<void> {
    const now = new Date();
    return this.tradeRepository.delete(id, now);
  }

  async getOneDetail(detailId: number): Promise<TradeDetailEntity> {
    const detail = await this.tradeRepository.getOneDetail(detailId);

    if (!detail) {
      throw new NotFoundError("Trade detail not found");
    }

    return detail;
  }

  async createDetail(
    tradeId: number,
    data: CreateTradeDetailProps,
  ): Promise<TradeDetailEntity> {
    const cleanData: CreateTradeDetailProps = {
      ...data,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    };

    const id = await this.tradeRepository.createDetail(tradeId, cleanData);

    if (!id) {
      throw new Error("Failed to create trade detail");
    }

    return this.getOneDetail(id);
  }

  async updateDetail(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailProps,
  ): Promise<TradeDetailEntity> {
    const cleanData: UpdateTradeDetailProps = {
      ...data,
      updatedAt: data.updatedAt ?? new Date(),
    };

    await this.tradeRepository.updateDetail(tradeId, detailId, cleanData);
    return this.getOneDetail(detailId);
  }

  deleteDetail(tradeId: number, detailId: number): Promise<void> {
    const now = new Date();
    return this.tradeRepository.deleteDetail(tradeId, detailId, now);
  }

  async executeBatchOperations(
    operations: BatchOperation[],
  ): Promise<BatchOperationReturn> {
    return await this.tradeRepository.executeBatch(operations);
  }

  async tradeLookup(
    number: string,
    lastFourDigits: string,
  ): Promise<tradeLookupReturn> {
    const trade = await this.tradeRepository.getOneByNumber(number);

    if (!trade) {
      throw new NotFoundError("Trade not found");
    }

    const storedPhone = trade.players?.phone;
    if (!storedPhone) {
      return { success: false };
    }

    const storedLastFour = storedPhone.slice(-4);
    if (storedLastFour !== lastFourDigits) {
      return { success: false };
    }

    return { id: trade.id, success: true };
  }
}

export { TradeService };
