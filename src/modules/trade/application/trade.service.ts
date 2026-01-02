import type {
  CreateTradeData,
  GetManyTradesProps,
  GetOneTradeProps,
  ITradeRepository,
  UpdateTradeData,
} from "./trade-repository.interface.ts";

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
}

export { TradeService };
