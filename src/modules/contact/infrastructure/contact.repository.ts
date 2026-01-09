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
    const { page = 1, limit = 10, spaceId } = props;

    // Count query with relations join
    const { total } = await this.db
      .selectFrom("players")
      .innerJoin("relations", (join) =>
        join
          .onRef("relations.model2_id", "=", "players.id")
          .on("relations.model2_type", "=", "PLAY")
          .on("relations.model1_type", "=", "SPACE")
          .on("relations.model1_id", "=", spaceId)
          .on("relations.deleted_at", "is", null))
      .where("players.deleted_at", "is", null)
      .select((eb) => eb.fn.count("players.id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    // Data query with relations join
    const result = await this.db
      .selectFrom("players")
      .innerJoin("relations", (join) =>
        join
          .onRef("relations.model2_id", "=", "players.id")
          .on("relations.model2_type", "=", "PLAY")
          .on("relations.model1_type", "=", "SPACE")
          .on("relations.model1_id", "=", spaceId)
          .on("relations.deleted_at", "is", null))
      .where("players.deleted_at", "is", null)
      .select([
        "players.id",
        "players.name",
        "players.email",
      ])
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

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
