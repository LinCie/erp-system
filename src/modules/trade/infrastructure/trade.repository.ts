import type { TradeEntity as Trade } from "../domain/trade.entity.ts";
import type {
  CreateTradeData,
  GetManyTradesProps,
  GetOneTradeProps,
  ITradeRepository,
  UpdateTradeData,
} from "../application/trade-repository.interface.ts";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import { TradeMapper } from "./trade.mapper.ts";

class TradeRepository implements ITradeRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: TradeMapper,
  ) {}

  async getMany(props: GetManyTradesProps) {
    const {
      spaceId,
      page = 1,
      limit = 10,
      status,
      modelType,
      search,
      sort = "created_at",
      order = "asc",
      withDetails = false,
      withPlayers = false,
    } = props;

    // Base count query
    let countQuery = this.db
      .selectFrom("transactions")
      .where("space_id", "=", spaceId)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null);

    // Base data query
    let query = this.db
      .selectFrom("transactions")
      .where("space_id", "=", spaceId)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .orderBy(sort, order)
      .limit(limit)
      .offset((page - 1) * limit);

    // Filter by status if provided
    if (status) {
      countQuery = countQuery.where("status", "=", status);
      query = query.where("status", "=", status);
    }

    // Filter by modelType (filter trades that have details with specified model_type)
    if (modelType) {
      countQuery = countQuery.where((eb) =>
        eb.exists(
          eb.selectFrom("transaction_details")
            .whereRef(
              "transaction_details.transaction_id",
              "=",
              "transactions.id",
            )
            .where("transaction_details.model_type", "=", modelType)
            .where("transaction_details.deleted_at", "is", null)
            .select("transaction_details.id"),
        )
      );
      query = query.where((eb) =>
        eb.exists(
          eb.selectFrom("transaction_details")
            .whereRef(
              "transaction_details.transaction_id",
              "=",
              "transactions.id",
            )
            .where("transaction_details.model_type", "=", modelType)
            .where("transaction_details.deleted_at", "is", null)
            .select("transaction_details.id"),
        )
      );
    }

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("number", "like", searchTerm),
          eb("sender_notes", "like", searchTerm),
          eb("receiver_notes", "like", searchTerm),
          eb("handler_notes", "like", searchTerm),
          eb("status", "like", searchTerm),
        ])
      );
      query = query.where((eb) =>
        eb.or([
          eb("number", "like", searchTerm),
          eb("sender_notes", "like", searchTerm),
          eb("receiver_notes", "like", searchTerm),
          eb("handler_notes", "like", searchTerm),
          eb("status", "like", searchTerm),
        ])
      );
    }

    // Execute count query
    const { total } = await countQuery
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    // Select all trade fields
    query = query.select([
      "id",
      "number",
      "space_id",
      "status",
      "total",
      "fee",
      "sent_time",
      "received_time",
      "sender_id",
      "receiver_id",
      "handler_id",
      "parent_id",
      "sender_notes",
      "receiver_notes",
      "handler_notes",
      "description",
      "files",
      "tags",
      "links",
      "created_at",
      "updated_at",
      "deleted_at",
    ]);

    // Include details if requested
    if (withDetails) {
      query = query.select((eb) => [
        jsonArrayFrom(
          eb.selectFrom("transaction_details")
            .whereRef(
              "transaction_details.transaction_id",
              "=",
              "transactions.id",
            )
            .where("transaction_details.deleted_at", "is", null)
            .select((eb2) => [
              "transaction_details.id",
              "transaction_details.name",
              "transaction_details.quantity",
              "transaction_details.price",
              "transaction_details.discount",
              "transaction_details.weight",
              "transaction_details.debit",
              "transaction_details.credit",
              "transaction_details.notes",
              jsonObjectFrom(
                eb2.selectFrom("items")
                  .whereRef("items.id", "=", "transaction_details.detail_id")
                  .where("transaction_details.detail_type", "=", "ITM")
                  .select([
                    "items.id",
                    "items.name",
                    "items.sku",
                    "items.cost",
                    "items.price",
                  ]),
              ).as("item"),
            ]),
        ).as("details"),
      ]);
    }

    // Include player relationships if requested
    if (withPlayers) {
      query = query.select((eb) => [
        jsonObjectFrom(
          eb.selectFrom("players")
            .whereRef("players.id", "=", "transactions.sender_id")
            .select(["players.id", "players.code", "players.name"]),
        ).as("sender"),
        jsonObjectFrom(
          eb.selectFrom("players")
            .whereRef("players.id", "=", "transactions.receiver_id")
            .select(["players.id", "players.code", "players.name"]),
        ).as("receiver"),
        jsonObjectFrom(
          eb.selectFrom("players")
            .whereRef("players.id", "=", "transactions.handler_id")
            .select(["players.id", "players.code", "players.name"]),
        ).as("handler"),
      ]);
    }

    const result = await query.execute();

    return {
      data: result.map((row) => this.mapper.toEntity(row)),
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getOne(props: GetOneTradeProps): Promise<Trade> {
    const { id, withDetails = false, withPlayers = false } = props;

    let query = this.db
      .selectFrom("transactions")
      .where("id", "=", id)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .select([
        "id",
        "number",
        "space_id",
        "status",
        "total",
        "fee",
        "sent_time",
        "received_time",
        "sender_id",
        "receiver_id",
        "handler_id",
        "parent_id",
        "sender_notes",
        "receiver_notes",
        "handler_notes",
        "description",
        "files",
        "tags",
        "links",
        "created_at",
        "updated_at",
        "deleted_at",
      ]);

    // Include details if requested
    if (withDetails) {
      query = query.select((eb) => [
        jsonArrayFrom(
          eb.selectFrom("transaction_details")
            .whereRef(
              "transaction_details.transaction_id",
              "=",
              "transactions.id",
            )
            .where("transaction_details.deleted_at", "is", null)
            .select((eb2) => [
              "transaction_details.id",
              "transaction_details.detail_id",
              "transaction_details.detail_type",
              "transaction_details.model_type",
              "transaction_details.sku",
              "transaction_details.name",
              "transaction_details.quantity",
              "transaction_details.price",
              "transaction_details.discount",
              "transaction_details.weight",
              "transaction_details.debit",
              "transaction_details.credit",
              "transaction_details.notes",
              jsonObjectFrom(
                eb2.selectFrom("items")
                  .whereRef("items.id", "=", "transaction_details.detail_id")
                  .where("transaction_details.detail_type", "=", "ITM")
                  .select([
                    "items.id",
                    "items.name",
                    "items.sku",
                    "items.cost",
                    "items.price",
                  ]),
              ).as("item"),
            ]),
        ).as("details"),
      ]);
    }

    if (withPlayers) {
      query = query.select((eb) => [
        jsonObjectFrom(
          eb.selectFrom("players")
            .whereRef("players.id", "=", "transactions.sender_id")
            .select(["players.id", "players.code", "players.name"]),
        ).as("sender"),
        jsonObjectFrom(
          eb.selectFrom("players")
            .whereRef("players.id", "=", "transactions.receiver_id")
            .select(["players.id", "players.code", "players.name"]),
        ).as("receiver"),
        jsonObjectFrom(
          eb.selectFrom("players")
            .whereRef("players.id", "=", "transactions.handler_id")
            .select(["players.id", "players.code", "players.name"]),
        ).as("handler"),
      ]);
    }

    const trade = await query.executeTakeFirst();

    if (!trade) {
      throw new Error("TRADE_NOT_FOUND");
    }

    return this.mapper.toEntity(trade);
  }

  async create(data: CreateTradeData): Promise<Trade> {
    const insertable = this.mapper.toInsertable({
      space_id: data.space_id,
      sender_id: data.sender_id,
      sent_time: data.sent_time,
      sender_notes: data.sender_notes,
      number: data.number,
      status: "TX_DRAFT",
      total: "0",
    });

    const created = await this.db
      .insertInto("transactions")
      .values({
        ...insertable,
        model_type: "TRD",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("TRADE_NOT_CREATED");
    }

    const tradeId = safeBigintToNumber(created.insertId);

    // Auto-generate number if not provided
    if (!data.number) {
      await this.db
        .updateTable("transactions")
        .set({ number: `TRD_${tradeId}` })
        .where("id", "=", tradeId)
        .executeTakeFirst();
    }

    return this.getOne({ id: tradeId, withDetails: true });
  }

  async update(id: number, data: UpdateTradeData): Promise<Trade> {
    // Verify trade exists
    const existingTrade = await this.db
      .selectFrom("transactions")
      .where("id", "=", id)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingTrade) {
      throw new Error("TRADE_NOT_FOUND");
    }

    // Extract details from data for separate handling
    const { details, ...tradeData } = data;

    // Handle details if provided
    let total: string | undefined;
    if (details !== undefined) {
      // Soft-delete existing details
      await this.db
        .updateTable("transaction_details")
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where("transaction_id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      // Create new details and calculate total
      let totalSum = 0;

      for (const detail of details) {
        const detailInsertable = this.mapper.detailToInsertable(id, detail);

        await this.db
          .insertInto("transaction_details")
          .values({
            ...detailInsertable,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .executeTakeFirst();

        // Calculate total: quantity * price * (1 - discount)
        const quantity = detail.quantity;
        const price = detail.price;
        const discount = detail.discount ?? 0;
        totalSum += quantity * price * (1 - discount);
      }

      total = totalSum.toFixed(2);
    }

    // Update trade record
    const updateable = this.mapper.toUpdateable({ ...tradeData, total });

    await this.db
      .updateTable("transactions")
      .set({
        ...updateable,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne({ id, withDetails: true });
  }

  async delete(id: number): Promise<void> {
    // Verify trade exists
    const existingTrade = await this.db
      .selectFrom("transactions")
      .where("id", "=", id)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingTrade) {
      throw new Error("TRADE_NOT_FOUND");
    }

    // Soft-delete all associated details
    await this.db
      .updateTable("transaction_details")
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where("transaction_id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    // Soft-delete trade
    await this.db
      .updateTable("transactions")
      .set({
        status: "archived",
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .executeTakeFirst();
  }
}

export { TradeRepository };
