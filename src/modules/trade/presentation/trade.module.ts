import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { TradeRepositoryImpl } from "../infrastructure/trade-repository.impl.ts";
import { TradeService } from "../application/trade.service.ts";
import { defineTradeController } from "./trade.controller.ts";
import { TradeMapper } from "../infrastructure/trade.mapper.ts";

const db = getDatabase();

const tradeMapper = new TradeMapper();
const tradeRepo = new TradeRepositoryImpl(db, tradeMapper);
const tradeService = new TradeService(tradeRepo);
const tradeController = defineTradeController(tradeService);

export { tradeController };
