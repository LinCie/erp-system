import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyContactsProps,
  IContactRepository,
} from "../application/contact-repository.interface.ts";
import { ContactEntity as Contact } from "../domain/contact.entity.ts";
import { ContactMapper } from "./contact.mapper.ts";

class ContactRepository implements IContactRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: ContactMapper,
  ) {}

  async getMany(props: GetManyContactsProps) {
    const { page = 1, limit = 10, spaceId, type, search } = props;

    // Count query with relations join
    let countQuery = this.db
      .selectFrom("players as p")
      .where("p.space_id", "in", [spaceId])
      .where("p.deleted_at", "is", null)
      .select((eb) => eb.fn.count("p.id").as("total"));

    // Data query with relations join
    let query = this.db
      .selectFrom("players as p")
      .where("p.space_id", "in", [spaceId])
      .where("p.deleted_at", "is", null)
      .select([
        "p.id",
        "p.name",
        "p.email",
      ])
      .limit(limit)
      .offset((page - 1) * limit);

    if (type && type !== "all") {
      query = query.where((eb) =>
        eb.exists(
          eb
            .selectFrom("transactions as t")
            .select("t.id")
            .whereRef("t.receiver_id", "=", "p.id")
            .where("t.receiver_type", "=", "PLAY")
            .where((eb2) =>
              eb2.exists(
                eb2.selectFrom("transaction_details as td").select("td.id")
                  .whereRef("td.transaction_id", "=", "t.id")
                  .where("td.deleted_at", "is", null),
              )
            )
            .where("t.deleted_at", "is", null),
        )
      );

      countQuery = countQuery.where((eb) =>
        eb.exists(
          eb
            .selectFrom("transactions as t")
            .select("t.id")
            .whereRef("t.receiver_id", "=", "p.id")
            .where("t.receiver_type", "=", "PLAY")
            .where((eb2) =>
              eb2.exists(
                eb2.selectFrom("transaction_details as td").select("td.id")
                  .whereRef("td.transaction_id", "=", "t.id")
                  .where("td.deleted_at", "is", null),
              )
            )
            .where("t.deleted_at", "is", null),
        )
      );
    } else if (!type) {
      query = query.where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("transactions as t")
              .select("t.id")
              .whereRef("t.receiver_id", "=", "p.id")
              .where("t.receiver_type", "=", "PLAY")
              .where("t.deleted_at", "is", null),
          ),
        )
      );

      countQuery = countQuery.where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("transactions as t")
              .select("t.id")
              .whereRef("t.receiver_id", "=", "p.id")
              .where("t.receiver_type", "=", "PLAY")
              .where("t.deleted_at", "is", null),
          ),
        )
      );
    }

    if (search) {
      const searchTerm = `%${search}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("name", "like", searchTerm),
          eb("code", "like", searchTerm),
          eb("notes", "like", searchTerm),
          eb("address", "like", searchTerm),
        ])
      );
      query = query.where((eb) =>
        eb.or([
          eb("name", "like", searchTerm),
          eb("code", "like", searchTerm),
          eb("notes", "like", searchTerm),
          eb("address", "like", searchTerm),
        ])
      );
    }

    const [result, countResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const totalItems = safeBigintToNumber(countResult?.total ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

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

  async getOne(id: number) {
    const result = await this.db
      .selectFrom("players")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Contact not found");
    }

    return this.mapper.toEntity(result);
  }

  async create(data: Omit<Contact, "id">) {
    const insertable = this.mapper.toInsertable(data as Contact);

    const created = await this.db
      .insertInto("players")
      .values({ ...insertable, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Contact not created");
    }

    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Partial<Contact>) {
    const updateable = this.mapper.toUpdateable(data);

    await this.db
      .updateTable("players")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  async delete(id: number) {
    await this.db
      .updateTable("players")
      .where("id", "=", id)
      .set({
        status: "archived",
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();
  }
}

export { ContactRepository };
