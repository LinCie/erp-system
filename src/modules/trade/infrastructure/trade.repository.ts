import type { TradeEntity as Trade } from "../domain/trade.entity.ts";
import type { TradeDetailType } from "../domain/trade-detail.type.ts";
import type {
  CreateTradeData,
  CreateTradeDetailData,
  GetManyTradesProps,
  GetOneTradeProps,
  ITradeRepository,
  UpdateTradeData,
  UpdateTradeDetailData,
  UpdateTradeTransactionData,
} from "../application/trade-repository.interface.ts";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";
import { Transaction } from "kysely";
import { DB } from "@/shared/infrastructure/persistence/database.d.ts";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import { TradeMapper } from "./trade.mapper.ts";
import type {
  BatchOperation,
  BatchOperationResult,
} from "../application/batch-operations.type.ts";

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

  getOne(props: GetOneTradeProps): Promise<Trade> {
    return this.getOneWithExecutor(props, this.db);
  }

  private async getOneWithExecutor(
    props: GetOneTradeProps,
    executor: PersistenceType | Transaction<DB>,
  ): Promise<Trade> {
    const {
      id,
      withDetails = false,
      withPlayers = false,
      withChildren = false,
    } = props;

    let query = executor
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

    // Include children if requested
    if (withChildren) {
      query = query.select((eb) => [
        jsonArrayFrom(
          eb.selectFrom("transactions as children")
            .whereRef("children.parent_id", "=", "transactions.id")
            .where("children.deleted_at", "is", null)
            .select([
              "children.id",
              "children.number",
              "children.space_id",
              "children.status",
              "children.total",
              "children.fee",
              "children.sent_time",
              "children.received_time",
              "children.sender_id",
              "children.receiver_id",
              "children.handler_id",
              "children.parent_id",
              "children.sender_notes",
              "children.receiver_notes",
              "children.handler_notes",
              "children.description",
              "children.files",
              "children.tags",
              "children.links",
              "children.created_at",
              "children.updated_at",
              "children.deleted_at",
            ]),
        ).as("children"),
      ]);
    }

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
    return await this.db.transaction().execute((trx) => {
      return this.createWithTransaction(data, trx);
    });
  }

  private async createWithTransaction(
    data: CreateTradeData,
    trx: Transaction<DB>,
  ): Promise<Trade> {
    const insertable = this.mapper.toInsertable({
      space_id: data.space_id,
      sender_id: data.sender_id,
      sent_time: data.sent_time,
      sender_notes: data.sender_notes,
      number: data.number,
      status: "TX_DRAFT",
      total: "0",
    });

    const created = await trx
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
      await trx
        .updateTable("transactions")
        .set({ number: `TX_${tradeId}` })
        .where("id", "=", tradeId)
        .executeTakeFirst();
    }

    return this.getOneWithExecutor({ id: tradeId, withDetails: true }, trx);
  }

  async update(id: number, data: UpdateTradeData): Promise<Trade> {
    return await this.db.transaction().execute((trx) => {
      return this.updateWithTransaction(id, data, trx);
    });
  }

  private async updateWithTransaction(
    id: number,
    data: UpdateTradeData,
    trx: Transaction<DB>,
  ): Promise<Trade> {
    // Verify trade exists
    const existingTrade = await trx
      .selectFrom("transactions")
      .where("id", "=", id)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingTrade) {
      throw new Error("TRADE_NOT_FOUND");
    }

    const { details, ...transactionData } = data;

    // Update transaction fields
    if (Object.keys(transactionData).length > 0) {
      const updateable = this.mapper.toUpdateable(transactionData);
      await trx
        .updateTable("transactions")
        .set({ ...updateable, updated_at: new Date() })
        .where("id", "=", id)
        .executeTakeFirst();
    }

    // Update details if provided
    if (details && details.length > 0) {
      // Delete existing details
      await trx
        .updateTable("transaction_details")
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where("transaction_id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      // Insert new details
      for (const detail of details) {
        const insertableDetail = this.mapper.detailToInsertable(id, detail);
        await trx
          .insertInto("transaction_details")
          .values({
            ...insertableDetail,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .executeTakeFirst();
      }
    }

    return this.getOneWithExecutor({ id, withDetails: true }, trx);
  }

  async updateTransaction(
    id: number,
    data: UpdateTradeTransactionData,
  ): Promise<Trade> {
    return await this.db.transaction().execute((trx) => {
      return this.updateTransactionWithTransaction(id, data, trx);
    });
  }

  private async updateTransactionWithTransaction(
    id: number,
    data: UpdateTradeTransactionData,
    trx: Transaction<DB>,
  ): Promise<Trade> {
    // Verify trade exists
    const existingTrade = await trx
      .selectFrom("transactions")
      .where("id", "=", id)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingTrade) {
      throw new Error("TRADE_NOT_FOUND");
    }

    // Update transaction fields only (no details)
    const updateable = this.mapper.toTransactionUpdateable(data);
    await trx
      .updateTable("transactions")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOneWithExecutor({ id, withDetails: true }, trx);
  }

  async createDetail(
    tradeId: number,
    data: CreateTradeDetailData,
  ): Promise<TradeDetailType> {
    return await this.db.transaction().execute((trx) => {
      return this.createDetailWithTransaction(tradeId, data, trx);
    });
  }

  private async createDetailWithTransaction(
    tradeId: number,
    data: CreateTradeDetailData,
    trx: Transaction<DB>,
  ): Promise<TradeDetailType> {
    // Verify trade exists
    const existingTrade = await trx
      .selectFrom("transactions")
      .where("id", "=", tradeId)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingTrade) {
      throw new Error("TRADE_NOT_FOUND");
    }

    // Verify item exists
    const existingItem = await trx
      .selectFrom("items")
      .where("id", "=", data.item_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingItem) {
      throw new Error("ITEM_NOT_FOUND");
    }

    // Create detail with detail_type='ITM' and detail_id=item_id
    const insertable = this.mapper.detailToInsertable(tradeId, data);
    const created = await trx
      .insertInto("transaction_details")
      .values({
        ...insertable,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("TRADE_DETAIL_NOT_CREATED");
    }

    const detailId = safeBigintToNumber(created.insertId);

    // Fetch and return the created detail with item info
    const detail = await trx
      .selectFrom("transaction_details")
      .where("id", "=", detailId)
      .select((eb) => [
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
          eb.selectFrom("items")
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
      ])
      .executeTakeFirst();

    if (!detail) {
      throw new Error("TRADE_DETAIL_NOT_FOUND");
    }

    return this.mapper.detailToEntity(detail);
  }

  async updateDetail(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailData,
  ): Promise<TradeDetailType> {
    return await this.db.transaction().execute((trx) => {
      return this.updateDetailWithTransaction(tradeId, detailId, data, trx);
    });
  }

  private async updateDetailWithTransaction(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailData,
    trx: Transaction<DB>,
  ): Promise<TradeDetailType> {
    // Verify detail exists and belongs to trade
    const existingDetail = await trx
      .selectFrom("transaction_details")
      .where("id", "=", detailId)
      .where("transaction_id", "=", tradeId)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingDetail) {
      throw new Error("TRADE_DETAIL_NOT_FOUND");
    }

    // Update detail (excluding immutable linking fields)
    const updateable = this.mapper.detailToUpdateable(data);
    await trx
      .updateTable("transaction_details")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", detailId)
      .executeTakeFirst();

    // Fetch and return the updated detail with item info
    const detail = await trx
      .selectFrom("transaction_details")
      .where("id", "=", detailId)
      .select((eb) => [
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
          eb.selectFrom("items")
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
      ])
      .executeTakeFirst();

    if (!detail) {
      throw new Error("TRADE_DETAIL_NOT_FOUND");
    }

    return this.mapper.detailToEntity(detail);
  }

  async deleteDetail(tradeId: number, detailId: number): Promise<void> {
    return await this.db.transaction().execute((trx) => {
      return this.deleteDetailWithTransaction(tradeId, detailId, trx);
    });
  }

  private async deleteDetailWithTransaction(
    tradeId: number,
    detailId: number,
    trx: Transaction<DB>,
  ): Promise<void> {
    // Verify detail exists and belongs to trade
    const existingDetail = await trx
      .selectFrom("transaction_details")
      .where("id", "=", detailId)
      .where("transaction_id", "=", tradeId)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingDetail) {
      throw new Error("TRADE_DETAIL_NOT_FOUND");
    }

    // Soft-delete detail
    await trx
      .updateTable("transaction_details")
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where("id", "=", detailId)
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    return await this.db.transaction().execute((trx) => {
      return this.deleteWithTransaction(id, trx);
    });
  }

  private async deleteWithTransaction(
    id: number,
    trx: Transaction<DB>,
  ): Promise<void> {
    // Verify trade exists
    const existingTrade = await trx
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
    await trx
      .updateTable("transaction_details")
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where("transaction_id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    // Soft-delete trade
    await trx
      .updateTable("transactions")
      .set({
        status: "archived",
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async executeBatch(
    operations: BatchOperation[],
  ): Promise<BatchOperationResult> {
    return await this.db.transaction().execute(async (trx) => {
      const result: BatchOperationResult = {
        created: [],
        read: [],
        updated: [],
        deleted: [],
        createdDetails: [],
        updatedDetails: [],
        deletedDetails: [],
      };

      // Map to store ref -> trade ID for referencing created trades
      const refMap = new Map<string, number>();

      // Helper to resolve tradeId from either direct ID or ref
      const resolveTradeId = (
        tradeId: number | undefined,
        tradeIdRef: string | undefined,
      ): number => {
        if (tradeId !== undefined) {
          return tradeId;
        }
        if (tradeIdRef !== undefined) {
          const resolvedId = refMap.get(tradeIdRef);
          if (resolvedId === undefined) {
            throw new Error(
              `REF_NOT_FOUND: Reference '${tradeIdRef}' was not created in a previous operation`,
            );
          }
          return resolvedId;
        }
        throw new Error(
          "TRADE_ID_REQUIRED: Either tradeId or tradeIdRef must be provided",
        );
      };

      for (const op of operations) {
        switch (op.type) {
          case "read":
            if (op.ids && op.ids.length > 0) {
              const trades = await this.getByIdsWithTransaction(
                op.ids,
                op.withDetails ?? false,
                trx,
              );
              result.read.push(...trades);
            }
            break;
          case "create": {
            const created = await this.createWithTransaction(op.data, trx);
            result.created.push(created);
            // Store ref if provided
            if (op.ref) {
              refMap.set(op.ref, created.id);
            }
            break;
          }
          case "update": {
            const resolvedId = resolveTradeId(op.id, op.idRef);
            const updated = await this.updateWithTransaction(
              resolvedId,
              op.data,
              trx,
            );
            result.updated.push(updated);
            break;
          }
          case "updateTransaction": {
            const resolvedId = resolveTradeId(op.id, op.idRef);
            const updatedTrx = await this.updateTransactionWithTransaction(
              resolvedId,
              op.data,
              trx,
            );
            result.updated.push(updatedTrx);
            break;
          }
          case "delete": {
            const resolvedId = resolveTradeId(op.id, op.idRef);
            await this.deleteWithTransaction(resolvedId, trx);
            result.deleted.push(resolvedId);
            break;
          }
          case "createDetail": {
            const resolvedTradeId = resolveTradeId(op.tradeId, op.tradeIdRef);
            const createdDetail = await this.createDetailWithTransaction(
              resolvedTradeId,
              op.data,
              trx,
            );
            result.createdDetails.push(createdDetail);
            break;
          }
          case "updateDetail": {
            const resolvedTradeId = resolveTradeId(op.tradeId, op.tradeIdRef);
            const updatedDetail = await this.updateDetailWithTransaction(
              resolvedTradeId,
              op.detailId,
              op.data,
              trx,
            );
            result.updatedDetails.push(updatedDetail);
            break;
          }
          case "deleteDetail": {
            const resolvedTradeId = resolveTradeId(op.tradeId, op.tradeIdRef);
            await this.deleteDetailWithTransaction(
              resolvedTradeId,
              op.detailId,
              trx,
            );
            result.deletedDetails.push(op.detailId);
            break;
          }
        }
      }

      return result;
    });
  }

  private async getByIdsWithTransaction(
    ids: number[],
    withDetails: boolean,
    trx: Transaction<DB>,
  ): Promise<Trade[]> {
    if (ids.length === 0) return [];

    // Using simple loop for now as getOne has complex logic
    // A better approach would be proper WHERE IN query but that requires refactoring getOne completely
    // Given the limit is 100 max, parallel requests might be too much for DB in a transaction?
    // Sequential strict is safer for now.

    const results: Trade[] = [];
    for (const id of ids) {
      // Use getOneWithExecutor which is already transaction-aware
      // For reads: "Retrieve multiple items in a single request. Returns 404 if any ID is not found (atomic behavior)."
      const trade = await this.getOneWithExecutor({ id, withDetails }, trx);
      results.push(trade);
    }
    return results;
  }
}

export { TradeRepository };
