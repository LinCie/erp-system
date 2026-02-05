import type {
  CreateTradeData,
  CreateTradeDetailData,
  GetManyTradesProps,
  GetOneTradeProps,
  ITradeRepository,
  UpdateTradeData,
  UpdateTradeDetailData,
  UpdateTradeTransactionData,
} from "./trade-repository.interface.ts";
import type {
  BatchOperation,
  BatchOperationResult,
} from "./batch-operations.type.ts";
import { NotFoundError } from "@/shared/domain/errors/common.error.ts";

/**
 * TradeService orchestrates trade business logic via dependency injection.
 * Delegates all data access operations to the injected repository.
 */
class TradeService {
  constructor(private readonly tradeRepository: ITradeRepository) {}

  async getMany(props: GetManyTradesProps) {
    return await this.tradeRepository.getMany(props);
  }

  async getOne(props: GetOneTradeProps) {
    return await this.tradeRepository.getOne(props);
  }

  async create(data: CreateTradeData) {
    return await this.tradeRepository.create(data);
  }

  async update(id: number, data: UpdateTradeData) {
    return await this.tradeRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.tradeRepository.delete(id);
  }

  // New methods for trade transaction and detail separation
  async updateTransaction(id: number, data: UpdateTradeTransactionData) {
    return await this.tradeRepository.updateTransaction(id, data);
  }

  async createDetail(tradeId: number, data: CreateTradeDetailData) {
    return await this.tradeRepository.createDetail(tradeId, data);
  }

  async updateDetail(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailData,
  ) {
    return await this.tradeRepository.updateDetail(tradeId, detailId, data);
  }

  async deleteDetail(tradeId: number, detailId: number) {
    return await this.tradeRepository.deleteDetail(tradeId, detailId);
  }

  async executeBatchOperations(
    operations: BatchOperation[],
  ): Promise<BatchOperationResult> {
    return await this.tradeRepository.executeBatch(operations);
  }

  async tradeLookup(number: string, phone: string): Promise<boolean> {
    const trade = await this.tradeRepository.getOneByNumber(number);

    if (!trade) {
      throw new NotFoundError("Trade not found");
    }

    const last4PhoneDigit = trade.players?.phone.slice(-4);
    if (last4PhoneDigit !== phone) {
      return false;
    }

    return true;
  }
}

export { TradeService };
