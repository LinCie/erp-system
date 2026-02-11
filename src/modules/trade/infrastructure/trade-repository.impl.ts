import type { SelectQueryBuilder, Transaction } from "kysely";
import type { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import type { DB } from "@/shared/infrastructure/persistence/database.d.ts";
import type { TradeRepository } from "../application/trade.repository.ts";
import type {
  GetManyTradesProps,
  GetManyTradesReturn,
} from "../application/types/get-many-trades.type.ts";
import type { TradeMapper } from "./trade.mapper.ts";
import type { TradeEntity } from "../domain/entities/trade.entity.ts";
import type { GetOneTradeProps } from "../application/types/get-one-trade.type.ts";
import type { CreateTradeProps } from "../application/types/create-trade.type.ts";
import type { UpdateTradeProps } from "../application/types/update-trade.type.ts";
import type { TradeDetailEntity } from "../domain/entities/trade-detail.entity.ts";
import type { UpdateTradeDetailProps } from "../application/types/update-trade-detail.type.ts";
import type {
  BatchOperation,
  BatchOperationReturn,
} from "../application/batch-operations.type.ts";
import type { CreateTradeDetailProps } from "../application/types/create-trade-detail.type.ts";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";
import { safeBigintToNumber } from "../../../utilities/transform.utility.ts";

class TradeRepositoryImpl implements TradeRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: TradeMapper,
  ) {}

  private selectTransactionDataWithParent<T>(
    query: SelectQueryBuilder<DB, "transactions", T>,
  ) {
    return query.select((eb) => [
      jsonObjectFrom(
        eb.selectFrom("transactions as parent")
          .whereRef("parent.id", "=", "transactions.parent_id")
          .select([
            /** Basic Info (Required) */
            "parent.id",
            "parent.number",
            "parent.space_id",
            "parent.status",
            "parent.total",

            /** Basic Info (Optional) */
            "parent.description",
            "parent.fee",
            "parent.files",
            "parent.tags",
            "parent.links",
            "parent.sender_notes",
            "parent.receiver_notes",
            "parent.handler_notes",

            /** JSON fields */
            "parent.players",
            "parent.timestamps",
            "parent.addresses",

            /** Legacy fields */
            "parent.sent_time",
            "parent.received_time",
          ]),
      ).as("parent"),
    ]);
  }

  private selectTransactionDataWithChildren<T>(
    query: SelectQueryBuilder<DB, "transactions", T>,
  ) {
    return query.select((eb) => [
      jsonArrayFrom(
        eb.selectFrom("transactions as children")
          .whereRef("children.parent_id", "=", "transactions.id")
          .where("children.deleted_at", "is", null)
          .select([
            /** Basic Info (Required) */
            "children.id",
            "children.number",
            "children.space_id",
            "children.status",
            "children.total",

            /** Basic Info (Optional) */
            "children.description",
            "children.fee",
            "children.files",
            "children.tags",
            "children.links",
            "children.sender_notes",
            "children.receiver_notes",
            "children.handler_notes",

            /** JSON fields */
            "children.players",
            "children.timestamps",
            "children.addresses",

            /** Legacy fields */
            "children.sent_time",
            "children.received_time",
          ]),
      ).as("children"),
    ]);
  }

  private selectTransactionDataWithPlayers<T>(
    query: SelectQueryBuilder<DB, "transactions", T>,
  ) {
    return query.select((eb) => [
      jsonObjectFrom(
        eb.selectFrom("players as sender")
          .whereRef("sender.id", "=", "transactions.sender_id")
          .select(["sender.id", "sender.code", "sender.name"]),
      ).as("sender"),
      jsonObjectFrom(
        eb.selectFrom("players as receiver")
          .whereRef("receiver.id", "=", "transactions.receiver_id")
          .select(["receiver.id", "receiver.code", "receiver.name"]),
      ).as("receiver"),
      jsonObjectFrom(
        eb.selectFrom("players as handler")
          .whereRef("handler.id", "=", "transactions.handler_id")
          .select(["handler.id", "handler.code", "handler.name"]),
      ).as("handler"),
    ]);
  }

  private selectTransactionDataWithDetails<T>(
    query: SelectQueryBuilder<DB, "transactions", T>,
  ) {
    return query.select((eb) =>
      jsonArrayFrom(
        eb.selectFrom("transaction_details as td")
          .whereRef(
            "td.transaction_id",
            "=",
            "transactions.id",
          )
          .where("td.deleted_at", "is", null)
          .select((eb2) => [
            "td.id",
            "td.quantity",
            "td.price",
            "td.discount",
            "td.weight",
            "td.debit",
            "td.credit",
            "td.notes",
            jsonObjectFrom(
              eb2.selectFrom("items")
                .whereRef("items.id", "=", "td.detail_id")
                .where("td.detail_type", "=", "ITM")
                .select([
                  "items.id",
                  "items.name",
                  "items.price",
                  "items.images",
                ]),
            ).as("item"),
          ]),
      ).as("details")
    );
  }

  private selectTransactionData<T>(
    query: SelectQueryBuilder<DB, "transactions", T>,
  ) {
    return query.select([
      /** Basic Info (Required) */
      "id",
      "number",
      "space_id",
      "status",
      "total",

      /** Basic Info (Optional) */
      "description",
      "fee",
      "files",
      "tags",
      "links",
      "sender_notes",
      "receiver_notes",
      "handler_notes",

      /** JSON fields */
      "players",
      "timestamps",
      "addresses",

      /** Legacy fields */
      "sent_time",
      "received_time",
    ]);
  }

  async getMany(props: GetManyTradesProps): Promise<GetManyTradesReturn> {
    const {
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "asc",
      spaceId,
      status,
      modelType,
      search,
      withDetails,
      withPlayers,
      withChildren,
      withParent,
    } = props;

    let baseQuery = this.db.selectFrom("transactions")
      .where("space_id", "=", spaceId)
      .where("model_type", "=", "TRD")
      .where("deleted_at", "is", null);

    if (status && (status as string) !== "all") {
      baseQuery = baseQuery.where("status", "=", status);
    }

    if (modelType) {
      baseQuery = baseQuery.where((eb) =>
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

    if (search && search !== "") {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("number", "like", `%${search}%`),
          eb("sender_notes", "like", `%${search}%`),
          eb("receiver_notes", "like", `%${search}%`),
          eb("handler_notes", "like", `%${search}%`),
          eb("status", "like", `%${search}%`),
        ])
      );
    }

    let dataQuery = this.selectTransactionData(
      baseQuery
        .orderBy(sort, order)
        .limit(limit)
        .offset((page - 1) * limit),
    );

    if (withDetails) {
      dataQuery = this.selectTransactionDataWithDetails(dataQuery);
    }

    if (withPlayers) {
      dataQuery = this.selectTransactionDataWithPlayers(dataQuery);
    }

    if (withChildren) {
      dataQuery = this.selectTransactionDataWithChildren(dataQuery);
    }

    if (withParent) {
      dataQuery = this.selectTransactionDataWithParent(dataQuery);
    }

    const countQuery = baseQuery.select((eb) => eb.fn.count("id").as("total"));

    const [data, count] = await Promise.all([
      dataQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const totalItems = Number(count?.total ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map((row) =>
        this.mapper.toEntity({
          ...row,
          withDetails,
          withPlayers,
          withChildren,
          withParent,
        })
      ),
      metadata: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    };
  }

  getOne(props: GetOneTradeProps): Promise<TradeEntity | undefined> {
    return this.getOneTrx(props, this.db);
  }

  async getOneTrx(
    props: GetOneTradeProps,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<TradeEntity | undefined> {
    const { id, spaceId, withDetails, withPlayers, withChildren, withParent } =
      props;

    let query = this.selectTransactionData(
      trx.selectFrom("transactions")
        .where("id", "=", id)
        .where("deleted_at", "is", null),
    );

    if (spaceId !== undefined) {
      query = query.where("space_id", "=", spaceId) as typeof query;
    }

    if (withDetails) {
      query = this.selectTransactionDataWithDetails(query);
    }

    if (withPlayers) {
      query = this.selectTransactionDataWithPlayers(query);
    }

    if (withChildren) {
      query = this.selectTransactionDataWithChildren(query);
    }

    if (withParent) {
      query = this.selectTransactionDataWithParent(query);
    }

    const data = await query.executeTakeFirst();

    if (!data) {
      return undefined;
    }

    return this.mapper.toEntity({
      ...data,
      withDetails,
      withPlayers,
      withChildren,
      withParent,
    });
  }

  async getOneByNumber(number: string): Promise<TradeEntity | undefined> {
    const data = await this.selectTransactionData(
      this.db.selectFrom("transactions")
        .where("number", "=", number)
        .where("deleted_at", "is", null)
        .where("model_type", "=", "TRD"),
    ).executeTakeFirst();

    if (!data) {
      return undefined;
    }

    return this.mapper.toEntity(data);
  }

  create(data: CreateTradeProps): Promise<number | undefined> {
    return this.createTrx(data, this.db);
  }

  async createTrx(
    data: CreateTradeProps,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<number | undefined> {
    const cleanData = this.mapper.toInsertable(data);

    const result = await trx
      .insertInto("transactions")
      .values(cleanData)
      .executeTakeFirst();

    if (!result || !result.insertId) {
      return undefined;
    }

    return safeBigintToNumber(result.insertId);
  }

  update(
    id: number,
    data: UpdateTradeProps,
  ): Promise<void> {
    return this.updateTrx(id, data, this.db);
  }

  async updateTrx(
    id: number,
    data: UpdateTradeProps,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<void> {
    const cleanData = this.mapper.toUpdateable(data);

    const result = await trx
      .updateTable("transactions")
      .set(cleanData)
      .where("id", "=", id)
      .executeTakeFirst();

    if (!result || !result.numUpdatedRows) {
      throw new Error("Failed to update trade");
    }

    return;
  }

  delete(id: number, deletedAt: Date): Promise<void> {
    return this.deleteTrx(id, deletedAt, this.db);
  }

  async deleteTrx(
    id: number,
    deletedAt: Date,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<void> {
    const result = await trx
      .updateTable("transactions")
      .set({
        deleted_at: deletedAt,
      })
      .where("id", "=", id)
      .executeTakeFirst();

    if (!result || !result.numChangedRows) {
      throw new Error("Failed to delete trade");
    }

    return;
  }

  async getOneDetail(detailId: number): Promise<TradeDetailEntity | undefined> {
    return this.getOneDetailTrx(detailId, this.db);
  }

  async getOneDetailTrx(
    detailId: number,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<TradeDetailEntity | undefined> {
    const data = await trx
      .selectFrom("transaction_details")
      .where("id", "=", detailId)
      .where("deleted_at", "is", null)
      .select([
        "id",
        "quantity",
        "price",
        "weight",
        "debit",
        "credit",
        "notes",
      ])
      .select((eb) => [
        jsonObjectFrom(
          eb.selectFrom("items")
            .whereRef("items.id", "=", "detail_id")
            .where("detail_type", "=", "ITM")
            .select([
              "items.id",
              "items.name",
              "items.price",
              "items.images",
            ]),
        ).as("item"),
      ])
      .executeTakeFirst();

    if (!data) {
      return undefined;
    }

    return this.mapper.detailToEntity(data);
  }

  createDetail(
    tradeId: number,
    data: CreateTradeDetailProps,
  ): Promise<number | undefined> {
    return this.createDetailTrx(tradeId, data, this.db);
  }

  async createDetailTrx(
    tradeId: number,
    data: CreateTradeDetailProps,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<number | undefined> {
    const cleanData = this.mapper.detailToInsertable(tradeId, data);

    const result = await trx
      .insertInto("transaction_details")
      .values({
        ...cleanData,
        transaction_id: tradeId,
      })
      .executeTakeFirst();

    if (!result || !result.insertId) {
      throw new Error("Failed to create detail");
    }

    return safeBigintToNumber(result.insertId);
  }

  updateDetail(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailProps,
  ): Promise<void> {
    return this.updateDetailTrx(tradeId, detailId, data, this.db);
  }

  async updateDetailTrx(
    tradeId: number,
    detailId: number,
    data: UpdateTradeDetailProps,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<void> {
    const cleanData = this.mapper.detailToUpdateable(data);

    const result = await trx
      .updateTable("transaction_details")
      .set(cleanData)
      .where("id", "=", detailId)
      .where("transaction_id", "=", tradeId)
      .executeTakeFirst();

    if (!result || !result.numUpdatedRows) {
      throw new Error("Failed to update detail");
    }

    return;
  }

  deleteDetail(
    tradeId: number,
    detailId: number,
    deletedAt: Date,
  ): Promise<void> {
    return this.deleteDetailTrx(tradeId, detailId, deletedAt, this.db);
  }

  async deleteDetailTrx(
    tradeId: number,
    detailId: number,
    deletedAt: Date,
    trx: PersistenceType | Transaction<DB>,
  ): Promise<void> {
    const result = await trx
      .updateTable("transaction_details")
      .set({
        deleted_at: deletedAt,
      })
      .where("id", "=", detailId)
      .where("transaction_id", "=", tradeId)
      .executeTakeFirst();

    if (!result || !result.numChangedRows) {
      throw new Error("Failed to delete detail");
    }

    return;
  }

  async executeBatch(
    operations: BatchOperation[],
  ): Promise<BatchOperationReturn> {
    return await this.db.transaction().execute(async (trx) => {
      const result: BatchOperationReturn = {
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
          case "read": {
            if (op.ids && op.ids.length > 0) {
              for (const id of op.ids) {
                const trade = await this.getOneTrx({
                  id,
                  withDetails: op.withDetails ?? false,
                }, trx);

                if (trade) {
                  result.read.push(trade);
                } else {
                  throw new Error(`Trade with ID ${id} not found`);
                }
              }
            }
            break;
          }
          case "create": {
            const createdId = await this.createTrx(op.data, trx);
            if (!createdId) {
              throw new Error("Failed to create trade");
            }
            // Fetch the created trade to return full entity
            const created = await this.getOneTrx({ id: createdId }, trx);
            if (!created) {
              throw new Error(
                `Failed to fetch created trade with ID ${createdId}`,
              );
            }
            result.created.push(created);
            // Store ref if provided
            if (op.ref) {
              refMap.set(op.ref, createdId);
            }
            break;
          }
          case "update": {
            const resolvedId = resolveTradeId(op.id, op.idRef);
            await this.updateTrx(resolvedId, op.data, trx);
            // Fetch the updated trade to return full entity
            const updated = await this.getOneTrx({ id: resolvedId }, trx);
            if (!updated) {
              throw new Error(
                `Failed to fetch updated trade with ID ${resolvedId}`,
              );
            }
            result.updated.push(updated);
            break;
          }
          case "delete": {
            const resolvedId = resolveTradeId(op.id, op.idRef);
            await this.deleteTrx(resolvedId, new Date(), trx);
            result.deleted.push(resolvedId);
            break;
          }
          case "createDetail": {
            const resolvedTradeId = resolveTradeId(op.tradeId, op.tradeIdRef);
            const createdDetailId = await this.createDetailTrx(
              resolvedTradeId,
              op.data,
              trx,
            );
            if (!createdDetailId) {
              throw new Error("Failed to create detail");
            }
            // Fetch the created detail within the transaction
            const createdDetail = await this.getOneDetailTrx(
              createdDetailId,
              trx,
            );
            if (!createdDetail) {
              throw new Error(
                `Failed to fetch created detail with ID ${createdDetailId}`,
              );
            }
            result.createdDetails.push(createdDetail);
            break;
          }
          case "updateDetail": {
            const resolvedTradeId = resolveTradeId(op.tradeId, op.tradeIdRef);
            await this.updateDetailTrx(
              resolvedTradeId,
              op.detailId,
              op.data,
              trx,
            );
            // Fetch the updated detail within the transaction
            const updatedDetail = await this.getOneDetailTrx(
              op.detailId,
              trx,
            );
            if (!updatedDetail) {
              throw new Error(
                `Failed to fetch updated detail with ID ${op.detailId}`,
              );
            }
            result.updatedDetails.push(updatedDetail);
            break;
          }
          case "deleteDetail": {
            const resolvedTradeId = resolveTradeId(op.tradeId, op.tradeIdRef);
            await this.deleteDetailTrx(
              resolvedTradeId,
              op.detailId,
              new Date(),
              trx,
            );
            result.deletedDetails.push(op.detailId);
            break;
          }
          default: {
            throw new Error(
              `Unknown batch operation type: ${(op as { type: string }).type}`,
            );
          }
        }
      }

      return result;
    });
  }
}

export { TradeRepositoryImpl };
