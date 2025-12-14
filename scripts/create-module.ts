import { dirname, fromFileUrl, join } from "@std/path";
import { toCamelCase, toKebabCase, toPascalCase } from "@std/text";

const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));
const BASE_PATH = join(SCRIPT_DIR, "..", "src", "modules");

interface ModuleConfig {
  name: string;
  plural: string;
}

function getModuleConfig(): ModuleConfig {
  const name = Deno.args[0];
  if (!name) {
    console.error("Usage: deno task create:module <module-name> [plural-form]");
    console.error("Example: deno task create:module user");
    console.error("Example: deno task create:module company companies");
    Deno.exit(1);
  }
  const plural = Deno.args[1] || `${name}s`;
  return { name: name.toLowerCase(), plural: plural.toLowerCase() };
}

function generateEntity(pascal: string, _kebab: string): string {
  return `import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ${pascal}Entity extends BaseEntity {
  name: string;
}

export type { ${pascal}Entity };
`;
}

function generateRepositoryInterface(
  pascal: string,
  pascalPlural: string,
  kebab: string,
): string {
  return `import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${kebab}.entity.ts";

type GetMany${pascalPlural}Props = GetManyPropsType;

type GetMany${pascalPlural}Return = {
  data: ${pascal}[];
  metadata: GetManyMetadataType;
};

interface I${pascal}Repository {
  getMany(props: GetMany${pascalPlural}Props): Promise<GetMany${pascalPlural}Return>;
  getOne(id: number): Promise<${pascal}>;
  create(data: Omit<${pascal}, "id">): Promise<${pascal}>;
  update(id: number, data: Partial<${pascal}>): Promise<${pascal}>;
  delete(id: number): Promise<void>;
}

export type { GetMany${pascalPlural}Props, GetMany${pascalPlural}Return, I${pascal}Repository };
`;
}

function generateService(
  pascal: string,
  pascalPlural: string,
  camel: string,
  kebab: string,
): string {
  return `import {
  GetMany${pascalPlural}Props,
  I${pascal}Repository,
} from "./${kebab}-repository.interface.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${kebab}.entity.ts";

class ${pascal}Service {
  constructor(private readonly ${camel}Repository: I${pascal}Repository) {}

  async getMany(props: GetMany${pascalPlural}Props) {
    return await this.${camel}Repository.getMany(props);
  }

  async getOne(id: number) {
    return await this.${camel}Repository.getOne(id);
  }

  async create(data: Omit<${pascal}, "id">) {
    return await this.${camel}Repository.create(data);
  }

  async update(id: number, data: Partial<${pascal}>) {
    return await this.${camel}Repository.update(id, data);
  }

  async delete(id: number) {
    return await this.${camel}Repository.delete(id);
  }
}

export { ${pascal}Service };
`;
}

function generateMapper(
  pascal: string,
  pascalPlural: string,
  kebab: string,
): string {
  return `import type { Insertable, Updateable } from "kysely";
import type { ${pascalPlural} } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ${pascal}Entity } from "../domain/${kebab}.entity.ts";

import { z } from "@hono/zod-openapi";

class ${pascal}Mapper {
  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
  });

  private updateableSchema = this.insertableSchema.partial();

  toInsertable(entity: ${pascal}Entity): Insertable<${pascalPlural}> {
    const data = {
      name: entity.name,
      status: entity.status,
    };
    return this.insertableSchema.parse(data);
  }

  toUpdateable(entity: Partial<${pascal}Entity>): Updateable<${pascalPlural}> {
    return this.updateableSchema.parse(entity);
  }

  toEntity(row: Record<string, unknown>): ${pascal}Entity {
    const data = {
      id: row.id,
      name: row.name,
      status: row.status,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { ${pascal}Mapper };
`;
}

function generateRepository(
  pascal: string,
  pascalPlural: string,
  kebab: string,
  plural: string,
): string {
  return `import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetMany${pascalPlural}Props,
  I${pascal}Repository,
} from "../application/${kebab}-repository.interface.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${kebab}.entity.ts";
import { ${pascal}Mapper } from "./${kebab}.mapper.ts";

class ${pascal}Repository implements I${pascal}Repository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: ${pascal}Mapper,
  ) {}

  async getMany(props: GetMany${pascalPlural}Props) {
    const { page = 1, limit = 10, status = "active" } = props;

    const countQuery = this.db
      .selectFrom("${plural}")
      .where("status", "=", status)
      .where("deleted_at", "is", null);

    const { total } = await countQuery
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    const result = await this.db
      .selectFrom("${plural}")
      .where("status", "=", status)
      .where("deleted_at", "is", null)
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return {
      data: result.map((row) => this.mapper.toEntity(row)),
      metadata: { totalItems, totalPages, currentPage: page, itemsPerPage: limit },
    };
  }

  async getOne(id: number) {
    const result = await this.db
      .selectFrom("${plural}")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("${pascal} not found");
    }

    return this.mapper.toEntity(result);
  }

  async create(data: Omit<${pascal}, "id">) {
    const insertable = this.mapper.toInsertable(data as ${pascal});

    const created = await this.db
      .insertInto("${plural}")
      .values({ ...insertable, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("${pascal} not created");
    }

    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Partial<${pascal}>) {
    const updateable = this.mapper.toUpdateable(data);

    await this.db
      .updateTable("${plural}")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  async delete(id: number) {
    await this.db
      .updateTable("${plural}")
      .where("id", "=", id)
      .set({ status: "archived", updated_at: new Date(), deleted_at: new Date() })
      .executeTakeFirst();
  }
}

export { ${pascal}Repository };
`;
}

function generateIdParamValidator(pascal: string, camel: string): string {
  return `import { z } from "@hono/zod-openapi";

const ${camel}IdParamSchema = z
  .object({
    id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
  })
  .openapi("${pascal}IdParam");

type ${pascal}IdParams = z.infer<typeof ${camel}IdParamSchema>;

export { ${camel}IdParamSchema };
export type { ${pascal}IdParams };
`;
}

function generateCreateBodyValidator(pascal: string, _kebab: string): string {
  return `import { z } from "@hono/zod-openapi";

const create${pascal}BodySchema = z
  .object({
    name: z.string().openapi({ example: "My ${pascal}" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("Create${pascal}Body");

type Create${pascal}Body = z.infer<typeof create${pascal}BodySchema>;

export { create${pascal}BodySchema };
export type { Create${pascal}Body };
`;
}

function generateUpdateBodyValidator(pascal: string, kebab: string): string {
  return `import { z } from "@hono/zod-openapi";
import { create${pascal}BodySchema } from "./create-${kebab}-body.validator.ts";

const update${pascal}BodySchema = create${pascal}BodySchema.partial().openapi("Update${pascal}Body");

type Update${pascal}Body = z.infer<typeof update${pascal}BodySchema>;

export { update${pascal}BodySchema };
export type { Update${pascal}Body };
`;
}

function generateQueryValidator(pascalPlural: string): string {
  return `import { z } from "@hono/zod-openapi";

const getMany${pascalPlural}QuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({ example: "active" }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
  })
  .openapi("GetMany${pascalPlural}Query");

type GetMany${pascalPlural}Query = z.infer<typeof getMany${pascalPlural}QuerySchema>;

export { getMany${pascalPlural}QuerySchema };
export type { GetMany${pascalPlural}Query };
`;
}

function generateResponseSchema(
  pascal: string,
  camel: string,
  pascalPlural: string,
): string {
  return `import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const ${camel}ResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My ${pascal}" }),
    status: z.string().openapi({ example: "active" }),
  })
  .openapi("${pascal}Response");

const getMany${pascalPlural}ResponseSchema = z.object({
  data: z.array(${camel}ResponseSchema),
  metadata: getManyMetadataSchema,
}).openapi("GetMany${pascalPlural}Response");

export { ${camel}ResponseSchema, getMany${pascalPlural}ResponseSchema };
`;
}

function generateErrorSchema(pascal: string): string {
  return `import { z } from "@hono/zod-openapi";

const errorResponseSchema = z
  .object({
    message: z.string().openapi({ example: "invalid body" }),
    issues: z
      .array(z.object({ code: z.string(), message: z.string(), path: z.array(z.union([z.string(), z.number()])) }))
      .optional(),
  })
  .openapi("${pascal}ErrorResponse");

export { errorResponseSchema };
`;
}

function generateGetManyRoute(
  pascalPlural: string,
  kebabPlural: string,
  kebab: string,
  plural: string,
): string {
  return `import { createRoute } from "@hono/zod-openapi";
import { getMany${pascalPlural}QuerySchema } from "../validators/get-many-${kebabPlural}-query.validator.ts";
import { getMany${pascalPlural}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getMany${pascalPlural}Route = createRoute({
  method: "get",
  path: "/",
  tags: ["${pascalPlural}"],
  summary: "Get many ${plural}",
  security: [{ Bearer: [] }],
  request: { query: getMany${pascalPlural}QuerySchema },
  responses: {
    200: { content: { "application/json": { schema: getMany${pascalPlural}ResponseSchema } }, description: "List of ${plural}" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getMany${pascalPlural}Route };
`;
}

function generateGetOneRoute(
  pascal: string,
  pascalPlural: string,
  camel: string,
  kebab: string,
  name: string,
): string {
  return `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${kebab}-id-param.validator.ts";
import { ${camel}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOne${pascal}Route = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["${pascalPlural}"],
  summary: "Get ${name} by ID",
  security: [{ Bearer: [] }],
  request: { params: ${camel}IdParamSchema },
  responses: {
    200: { content: { "application/json": { schema: ${camel}ResponseSchema } }, description: "${pascal} details" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getOne${pascal}Route };
`;
}

function generateCreateRoute(
  pascal: string,
  pascalPlural: string,
  camel: string,
  kebab: string,
  name: string,
): string {
  return `import { createRoute } from "@hono/zod-openapi";
import { create${pascal}BodySchema } from "../validators/create-${kebab}-body.validator.ts";
import { ${camel}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const create${pascal}Route = createRoute({
  method: "post",
  path: "/",
  tags: ["${pascalPlural}"],
  summary: "Create a new ${name}",
  security: [{ Bearer: [] }],
  request: { body: { content: { "application/json": { schema: create${pascal}BodySchema } } } },
  responses: {
    201: { content: { "application/json": { schema: ${camel}ResponseSchema } }, description: "${pascal} created successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { create${pascal}Route };
`;
}

function generateUpdateRoute(
  pascal: string,
  pascalPlural: string,
  camel: string,
  kebab: string,
  name: string,
): string {
  return `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${kebab}-id-param.validator.ts";
import { update${pascal}BodySchema } from "../validators/update-${kebab}-body.validator.ts";
import { ${camel}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const update${pascal}Route = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["${pascalPlural}"],
  summary: "Update a ${name}",
  security: [{ Bearer: [] }],
  request: {
    params: ${camel}IdParamSchema,
    body: { content: { "application/json": { schema: update${pascal}BodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: ${camel}ResponseSchema } }, description: "${pascal} updated successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { update${pascal}Route };
`;
}

function generateDeleteRoute(
  pascal: string,
  pascalPlural: string,
  camel: string,
  kebab: string,
  name: string,
): string {
  return `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${kebab}-id-param.validator.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const delete${pascal}Route = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["${pascalPlural}"],
  summary: "Delete a ${name}",
  security: [{ Bearer: [] }],
  request: { params: ${camel}IdParamSchema },
  responses: {
    204: { description: "${pascal} deleted successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { delete${pascal}Route };
`;
}

function generateController(
  pascal: string,
  pascalPlural: string,
  _camel: string,
  kebab: string,
  kebabPlural: string,
): string {
  return `import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { ${pascal}Service } from "../application/${kebab}.service.ts";
import { getMany${pascalPlural}Route } from "./routes/get-many-${kebabPlural}.route.ts";
import { getOne${pascal}Route } from "./routes/get-one-${kebab}.route.ts";
import { create${pascal}Route } from "./routes/create-${kebab}.route.ts";
import { update${pascal}Route } from "./routes/update-${kebab}.route.ts";
import { delete${pascal}Route } from "./routes/delete-${kebab}.route.ts";

function define${pascal}Controller(service: ${pascal}Service) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getMany${pascalPlural}Route, async (c) => {
    const query = c.req.valid("query");
    const result = await service.getMany(query);
    return c.json(result, 200);
  });

  app.openapi(getOne${pascal}Route, async (c) => {
    const { id } = c.req.valid("param");
    const result = await service.getOne(id);
    return c.json(result, 200);
  });

  app.openapi(create${pascal}Route, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create(body);
    return c.json(result, 201);
  });

  app.openapi(update${pascal}Route, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await service.update(id, body);
    return c.json(result, 200);
  });

  app.openapi(delete${pascal}Route, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { define${pascal}Controller };
`;
}

function generateModule(pascal: string, camel: string, kebab: string): string {
  return `import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { ${pascal}Repository } from "../infrastructure/${kebab}.repository.ts";
import { ${pascal}Service } from "../application/${kebab}.service.ts";
import { define${pascal}Controller } from "./${kebab}.controller.ts";
import { ${pascal}Mapper } from "../infrastructure/${kebab}.mapper.ts";

const db = getDatabase();

const ${camel}Mapper = new ${pascal}Mapper();
const ${camel}Repo = new ${pascal}Repository(db, ${camel}Mapper);
const ${camel}Service = new ${pascal}Service(${camel}Repo);
const ${camel}Controller = define${pascal}Controller(${camel}Service);

export { ${camel}Controller };
`;
}

function generateFixtures(
  pascal: string,
  kebab: string,
  camelPlural: string,
  _name: string,
): string {
  return `import type { ${pascal}Entity } from "../../domain/${kebab}.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

const valid${pascal}: ${pascal}Entity = {
  id: 1,
  name: "Test ${pascal}",
  status: "active",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

const minimal${pascal}: ${pascal}Entity = {
  id: 2,
  name: "Minimal ${pascal}",
  status: "active",
};

const inactive${pascal}: ${pascal}Entity = {
  id: 3,
  name: "Inactive ${pascal}",
  status: "inactive",
};

const archived${pascal}: ${pascal}Entity = {
  id: 4,
  name: "Archived ${pascal}",
  status: "archived",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
};

const ${camelPlural}List: ${pascal}Entity[] = [
  valid${pascal},
  minimal${pascal},
  inactive${pascal},
  { id: 5, name: "Fourth ${pascal}", status: "active" },
  { id: 6, name: "Fifth ${pascal}", status: "active" },
];

const sampleMetadata: GetManyMetadataType = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 5,
  totalPages: 1,
};

const create${pascal}Data: Omit<${pascal}Entity, "id"> = {
  name: "New ${pascal}",
  status: "active",
};

const update${pascal}Data: Partial<${pascal}Entity> = {
  name: "Updated ${pascal} Name",
};

export {
  archived${pascal},
  create${pascal}Data,
  inactive${pascal},
  ${camelPlural}List,
  minimal${pascal},
  sampleMetadata,
  update${pascal}Data,
  valid${pascal},
};
`;
}

function generateMockRepository(
  pascal: string,
  pascalPlural: string,
  _camel: string,
  camelPlural: string,
  kebab: string,
): string {
  return `// deno-lint-ignore-file require-await
import type {
  GetMany${pascalPlural}Props,
  GetMany${pascalPlural}Return,
  I${pascal}Repository,
} from "../../application/${kebab}-repository.interface.ts";
import type { ${pascal}Entity } from "../../domain/${kebab}.entity.ts";

interface MockRepositoryOptions {
  ${camelPlural}?: ${pascal}Entity[];
  shouldThrow?: Error;
}

interface MethodCall {
  method: string;
  args: unknown[];
}

class Mock${pascal}Repository implements I${pascal}Repository {
  private ${camelPlural}: ${pascal}Entity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.${camelPlural} = options?.${camelPlural} ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  reset(options?: MockRepositoryOptions): void {
    this.${camelPlural} = options?.${camelPlural} ?? [];
    this.shouldThrow = options?.shouldThrow;
    this.calls = [];
  }

  setError(error: Error): void { this.shouldThrow = error; }
  clearError(): void { this.shouldThrow = undefined; }
  getCalls(): MethodCall[] { return this.calls; }
  getCallsForMethod(methodName: string): MethodCall[] { return this.calls.filter((c) => c.method === methodName); }
  clearCalls(): void { this.calls = []; }

  async getMany(props: GetMany${pascalPlural}Props): Promise<GetMany${pascalPlural}Return> {
    this.calls.push({ method: "getMany", args: [props] });
    if (this.shouldThrow) throw this.shouldThrow;

    let filtered = [...this.${camelPlural}];
    if (props.status) filtered = filtered.filter((item) => item.status === props.status);

    const page = props.page ?? 1;
    const limit = props.limit ?? 10;
    const offset = (page - 1) * limit;

    return {
      data: filtered.slice(offset, offset + limit),
      metadata: { currentPage: page, itemsPerPage: limit, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
    };
  }

  async getOne(id: number): Promise<${pascal}Entity> {
    this.calls.push({ method: "getOne", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const item = this.${camelPlural}.find((i) => i.id === id);
    if (!item) throw new Error("${pascal} not found");
    return item;
  }

  async create(data: Omit<${pascal}Entity, "id">): Promise<${pascal}Entity> {
    this.calls.push({ method: "create", args: [data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const newId = this.${camelPlural}.length > 0 ? Math.max(...this.${camelPlural}.map((i) => i.id)) + 1 : 1;
    const newItem: ${pascal}Entity = { ...data, id: newId, created_at: new Date(), updated_at: new Date() };
    this.${camelPlural}.push(newItem);
    return newItem;
  }

  async update(id: number, data: Partial<${pascal}Entity>): Promise<${pascal}Entity> {
    this.calls.push({ method: "update", args: [id, data] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.${camelPlural}.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("${pascal} not found");
    const updated: ${pascal}Entity = { ...this.${camelPlural}[index], ...data, id, updated_at: new Date() };
    this.${camelPlural}[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const index = this.${camelPlural}.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("${pascal} not found");
    this.${camelPlural}[index] = { ...this.${camelPlural}[index], status: "archived", deleted_at: new Date() };
  }
}

export { Mock${pascal}Repository };
export type { MethodCall, MockRepositoryOptions };
`;
}

function generateServiceTest(
  pascal: string,
  pascalPlural: string,
  _camel: string,
  camelPlural: string,
  kebab: string,
  _name: string,
): string {
  return `import { assertEquals, assertRejects } from "@std/assert";
import { ${pascal}Service } from "./${kebab}.service.ts";
import { Mock${pascal}Repository } from "../__tests__/mocks/${kebab}.repository.mock.ts";
import { ${camelPlural}List, create${pascal}Data, update${pascal}Data } from "../__tests__/fixtures/${kebab}.fixtures.ts";
import type { GetMany${pascalPlural}Props } from "./${kebab}-repository.interface.ts";

Deno.test("${pascal}Service - getMany delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);
  const props: GetMany${pascalPlural}Props = { page: 1, limit: 10 };

  const result = await service.getMany(props);

  const calls = mockRepo.getCallsForMethod("getMany");
  assertEquals(calls.length, 1);
  assertEquals(calls[0].args[0], props);
  assertEquals(result.data.length, ${camelPlural}List.length);
});

Deno.test("${pascal}Service - getOne delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);

  const result = await service.getOne(1);

  const calls = mockRepo.getCallsForMethod("getOne");
  assertEquals(calls.length, 1);
  assertEquals(result.id, 1);
});

Deno.test("${pascal}Service - create delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: [] });
  const service = new ${pascal}Service(mockRepo);

  const result = await service.create(create${pascal}Data);

  const calls = mockRepo.getCallsForMethod("create");
  assertEquals(calls.length, 1);
  assertEquals(result.name, create${pascal}Data.name);
});

Deno.test("${pascal}Service - update delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);

  const result = await service.update(1, update${pascal}Data);

  const calls = mockRepo.getCallsForMethod("update");
  assertEquals(calls.length, 1);
  assertEquals(result.name, update${pascal}Data.name);
});

Deno.test("${pascal}Service - delete delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);

  await service.delete(1);

  const calls = mockRepo.getCallsForMethod("delete");
  assertEquals(calls.length, 1);
});

Deno.test("${pascal}Service - getMany propagates repository errors", async () => {
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: new Error("Database connection failed") });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(() => service.getMany({}), Error, "Database connection failed");
});

Deno.test("${pascal}Service - getOne propagates repository errors", async () => {
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: new Error("${pascal} not found") });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(() => service.getOne(999), Error, "${pascal} not found");
});

Deno.test("${pascal}Service - create propagates repository errors", async () => {
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: new Error("Validation failed") });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(() => service.create(create${pascal}Data), Error, "Validation failed");
});

Deno.test("${pascal}Service - update propagates repository errors", async () => {
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: new Error("${pascal} not found") });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(() => service.update(999, update${pascal}Data), Error, "${pascal} not found");
});

Deno.test("${pascal}Service - delete propagates repository errors", async () => {
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: new Error("${pascal} not found") });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(() => service.delete(999), Error, "${pascal} not found");
});
`;
}

async function createModule(config: ModuleConfig) {
  const { name, plural } = config;
  const pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const kebab = toKebabCase(name);
  const pascalPlural = toPascalCase(plural);
  const camelPlural = toCamelCase(plural);
  const kebabPlural = toKebabCase(plural);
  const modulePath = `${BASE_PATH}/${name}`;

  // Check if module exists
  try {
    await Deno.stat(modulePath);
    console.error(`Error: Module '${name}' already exists!`);
    Deno.exit(1);
  } catch {
    // Module doesn't exist, continue
  }

  console.log(`Creating module: ${pascal}`);

  // Create directories
  await Deno.mkdir(`${modulePath}/domain`, { recursive: true });
  await Deno.mkdir(`${modulePath}/application`, { recursive: true });
  await Deno.mkdir(`${modulePath}/infrastructure`, { recursive: true });
  await Deno.mkdir(`${modulePath}/presentation/validators`, {
    recursive: true,
  });
  await Deno.mkdir(`${modulePath}/presentation/schemas`, { recursive: true });
  await Deno.mkdir(`${modulePath}/presentation/routes`, { recursive: true });
  await Deno.mkdir(`${modulePath}/__tests__/fixtures`, { recursive: true });
  await Deno.mkdir(`${modulePath}/__tests__/mocks`, { recursive: true });

  // Write all files
  await Deno.writeTextFile(
    `${modulePath}/domain/${kebab}.entity.ts`,
    generateEntity(pascal, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/application/${kebab}-repository.interface.ts`,
    generateRepositoryInterface(pascal, pascalPlural, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/application/${kebab}.service.ts`,
    generateService(pascal, pascalPlural, camel, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/application/${kebab}.service_test.ts`,
    generateServiceTest(pascal, pascalPlural, camel, camelPlural, kebab, name),
  );
  await Deno.writeTextFile(
    `${modulePath}/infrastructure/${kebab}.mapper.ts`,
    generateMapper(pascal, pascalPlural, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/infrastructure/${kebab}.repository.ts`,
    generateRepository(pascal, pascalPlural, kebab, plural),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/${kebab}.controller.ts`,
    generateController(pascal, pascalPlural, camel, kebab, kebabPlural),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/${kebab}.module.ts`,
    generateModule(pascal, camel, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/${kebab}-id-param.validator.ts`,
    generateIdParamValidator(pascal, camel),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/create-${kebab}-body.validator.ts`,
    generateCreateBodyValidator(pascal, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/update-${kebab}-body.validator.ts`,
    generateUpdateBodyValidator(pascal, kebab),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/get-many-${kebabPlural}-query.validator.ts`,
    generateQueryValidator(pascalPlural),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/schemas/${kebab}-response.schema.ts`,
    generateResponseSchema(pascal, camel, pascalPlural),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/schemas/error-response.schema.ts`,
    generateErrorSchema(pascal),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/get-many-${kebabPlural}.route.ts`,
    generateGetManyRoute(pascalPlural, kebabPlural, kebab, plural),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/get-one-${kebab}.route.ts`,
    generateGetOneRoute(pascal, pascalPlural, camel, kebab, name),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/create-${kebab}.route.ts`,
    generateCreateRoute(pascal, pascalPlural, camel, kebab, name),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/update-${kebab}.route.ts`,
    generateUpdateRoute(pascal, pascalPlural, camel, kebab, name),
  );
  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/delete-${kebab}.route.ts`,
    generateDeleteRoute(pascal, pascalPlural, camel, kebab, name),
  );
  await Deno.writeTextFile(
    `${modulePath}/__tests__/fixtures/${kebab}.fixtures.ts`,
    generateFixtures(pascal, kebab, camelPlural, name),
  );
  await Deno.writeTextFile(
    `${modulePath}/__tests__/mocks/${kebab}.repository.mock.ts`,
    generateMockRepository(pascal, pascalPlural, camel, camelPlural, kebab),
  );

  console.log(`✓ Module '${pascal}' created at ${modulePath}`);
  console.log(`
Files created:
  - domain/${kebab}.entity.ts
  - application/${kebab}-repository.interface.ts
  - application/${kebab}.service.ts
  - application/${kebab}.service_test.ts
  - infrastructure/${kebab}.mapper.ts
  - infrastructure/${kebab}.repository.ts
  - presentation/${kebab}.controller.ts
  - presentation/${kebab}.module.ts
  - presentation/validators/${kebab}-id-param.validator.ts
  - presentation/validators/create-${kebab}-body.validator.ts
  - presentation/validators/update-${kebab}-body.validator.ts
  - presentation/validators/get-many-${kebabPlural}-query.validator.ts
  - presentation/schemas/${kebab}-response.schema.ts
  - presentation/schemas/error-response.schema.ts
  - presentation/routes/get-many-${kebabPlural}.route.ts
  - presentation/routes/get-one-${kebab}.route.ts
  - presentation/routes/create-${kebab}.route.ts
  - presentation/routes/update-${kebab}.route.ts
  - presentation/routes/delete-${kebab}.route.ts
  - __tests__/fixtures/${kebab}.fixtures.ts
  - __tests__/mocks/${kebab}.repository.mock.ts

Don't forget to:
  1. Add the table to your database schema
  2. Register the controller in main.ts:
     app.route("/${plural}", ${camel}Controller);
  3. Run tests with: deno test src/modules/${name}/`);
}

const moduleConfig = getModuleConfig();
await createModule(moduleConfig);
