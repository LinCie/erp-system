import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import {
  GetManySpacesProps,
  ISpaceRepository,
} from "../application/space-repository.interface.ts";
import { SpaceEntity as Space } from "../domain/space.entity.ts";

class SpaceRepository implements ISpaceRepository {
  constructor(private readonly db: PersistenceType) {}

  async getMany(props: GetManySpacesProps) {
    const {
      page = 1,
      limit = 10,
      status = "active",
      search = "",
      userId,
    } = props;

    const user = await this.db
      .selectFrom("users")
      .where("id", "=", userId)
      .select("player_id")
      .executeTakeFirst();

    if (!user?.player_id) {
      return {
        data: [],
        metadata: {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          itemsPerPage: limit,
        },
      };
    }

    const { total } = await this.db
      .selectFrom("spaces")
      .innerJoin("relations", (join) =>
        join
          .onRef("relations.model1_id", "=", "spaces.id")
          .on("relations.model1_type", "=", "SPACE")
          .on("relations.model2_type", "=", "PLAY")
          .on("relations.model2_id", "=", user.player_id))
      .where("spaces.status", "=", status)
      .where("spaces.deleted_at", "is", null)
      .select((eb) => eb.fn.count("spaces.id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    let query = this.db
      .selectFrom("spaces")
      .innerJoin("relations", (join) =>
        join
          .onRef("relations.model1_id", "=", "spaces.id")
          .on("relations.model1_type", "=", "SPACE")
          .on("relations.model2_type", "=", "PLAY")
          .on("relations.model2_id", "=", user.player_id))
      .where("spaces.status", "=", status)
      .where("spaces.deleted_at", "is", null)
      .select([
        "spaces.id",
        "spaces.name",
        "spaces.address",
        "spaces.status",
        "spaces.notes",
      ])
      .limit(limit)
      .offset((page - 1) * limit);

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb(
            eb.fn("lower", ["spaces.name"]),
            "like",
            `%${search.toLowerCase()}%`,
          ),
        ])
      );
    }

    const result = await query.execute();

    return {
      data: result as Space[],
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
      .selectFrom("spaces")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Space not found");
    }

    return result as Space;
  }

  async create(data: Omit<Space, "id">) {
    const created = await this.db
      .insertInto("spaces")
      .values({
        ...data,
        address: JSON.stringify(data.address),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("Space not created");
    }

    return this.getOne(Number(created.insertId));
  }

  async update(id: number, data: Partial<Space>) {
    await this.db
      .updateTable("spaces")
      .set({
        ...data,
        address: JSON.stringify(data.address),
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  async delete(id: number) {
    await this.db
      .updateTable("spaces")
      .where("id", "=", id)
      .set({
        status: "archived",
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();
  }
}

export { SpaceRepository };
