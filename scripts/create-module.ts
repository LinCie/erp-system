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

  // Entity
  await Deno.writeTextFile(
    `${modulePath}/domain/${kebab}.entity.ts`,
    `import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ${pascal}Entity extends BaseEntity {
  name: string;
}

export type { ${pascal}Entity };
`,
  );

  // Repository Interface
  await Deno.writeTextFile(
    `${modulePath}/application/${kebab}-repository.interface.ts`,
    `import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${kebab}.entity.ts";

type GetMany${pascalPlural}Props = GetManyPropsType;

interface I${pascal}Repository {
  getMany(props: GetMany${pascalPlural}Props): Promise<${pascal}[]>;
  getOne(id: number): Promise<${pascal}>;
  create(data: Omit<${pascal}, "id">): Promise<${pascal}>;
  update(id: number, data: Partial<${pascal}>): Promise<${pascal}>;
  delete(id: number): Promise<void>;
}

export type { GetMany${pascalPlural}Props, I${pascal}Repository };
`,
  );

  // Service
  await Deno.writeTextFile(
    `${modulePath}/application/${kebab}.service.ts`,
    `import {
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
`,
  );

  // Repository
  await Deno.writeTextFile(
    `${modulePath}/infrastructure/${kebab}.repository.ts`,
    `import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import {
  GetMany${pascalPlural}Props,
  I${pascal}Repository,
} from "../application/${kebab}-repository.interface.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${kebab}.entity.ts";

class ${pascal}Repository implements I${pascal}Repository {
  constructor(private readonly db: PersistenceType) {}

  async getMany(props: GetMany${pascalPlural}Props) {
    const { page = 1, limit = 10, status = "active" } = props;

    const result = await this.db
      .selectFrom("${plural}")
      .where("status", "=", status)
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return result as ${pascal}[];
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

    return result as ${pascal};
  }

  async create(data: Omit<${pascal}, "id">) {
    const created = await this.db
      .insertInto("${plural}")
      .values({ ...data, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("${pascal} not created");
    }

    return this.getOne(Number(created.insertId));
  }

  async update(id: number, data: Partial<${pascal}>) {
    await this.db
      .updateTable("${plural}")
      .set({ ...data, updated_at: new Date() })
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
`,
  );

  // Validators
  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/${kebab}-id-param.ts`,
    `import { z } from "@hono/zod-openapi";

const ${camel}IdParamSchema = z
  .object({
    id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
  })
  .openapi("${pascal}IdParam");

type ${pascal}IdParams = z.infer<typeof ${camel}IdParamSchema>;

export { ${camel}IdParamSchema };
export type { ${pascal}IdParams };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/create-${kebab}-body.ts`,
    `import { z } from "@hono/zod-openapi";

const create${pascal}BodySchema = z
  .object({
    name: z.string().openapi({ example: "My ${pascal}" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("Create${pascal}Body");

type Create${pascal}Body = z.infer<typeof create${pascal}BodySchema>;

export { create${pascal}BodySchema };
export type { Create${pascal}Body };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/update-${kebab}-body.ts`,
    `import { z } from "@hono/zod-openapi";
import { create${pascal}BodySchema } from "./create-${kebab}-body.ts";

const update${pascal}BodySchema = create${pascal}BodySchema.partial().openapi("Update${pascal}Body");

type Update${pascal}Body = z.infer<typeof update${pascal}BodySchema>;

export { update${pascal}BodySchema };
export type { Update${pascal}Body };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/get-many-${kebabPlural}-query.ts`,
    `import { z } from "@hono/zod-openapi";

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
`,
  );

  // Schemas
  await Deno.writeTextFile(
    `${modulePath}/presentation/schemas/${kebab}-response.schema.ts`,
    `import { z } from "@hono/zod-openapi";

const ${camel}ResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My ${pascal}" }),
    status: z.string().openapi({ example: "active" }),
    created_at: z.string().datetime().optional().openapi({ example: "2024-01-01T00:00:00Z" }),
    updated_at: z.string().datetime().optional().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("${pascal}Response");

const ${camelPlural}ResponseSchema = z.array(${camel}ResponseSchema).openapi("${pascalPlural}Response");

export { ${camel}ResponseSchema, ${camelPlural}ResponseSchema };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/schemas/error-response.schema.ts`,
    `import { z } from "@hono/zod-openapi";

const errorResponseSchema = z
  .object({
    message: z.string().openapi({ example: "invalid body" }),
    issues: z
      .array(
        z.object({
          code: z.string(),
          message: z.string(),
          path: z.array(z.union([z.string(), z.number()])),
        }),
      )
      .optional(),
  })
  .openapi("${pascal}ErrorResponse");

export { errorResponseSchema };
`,
  );

  // Routes
  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/get-many-${kebabPlural}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { getMany${pascalPlural}QuerySchema } from "../validators/get-many-${kebabPlural}-query.ts";
import { ${camelPlural}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getMany${pascalPlural}Route = createRoute({
  method: "get",
  path: "/",
  tags: ["${pascalPlural}"],
  summary: "Get many ${plural}",
  security: [{ Bearer: [] }],
  request: {
    query: getMany${pascalPlural}QuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: ${camelPlural}ResponseSchema } },
      description: "List of ${plural}",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getMany${pascalPlural}Route };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/get-one-${kebab}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${kebab}-id-param.ts";
import { ${camel}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOne${pascal}Route = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["${pascalPlural}"],
  summary: "Get ${name} by ID",
  security: [{ Bearer: [] }],
  request: {
    params: ${camel}IdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: ${camel}ResponseSchema } },
      description: "${pascal} details",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getOne${pascal}Route };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/create-${kebab}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { create${pascal}BodySchema } from "../validators/create-${kebab}-body.ts";
import { ${camel}ResponseSchema } from "../schemas/${kebab}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const create${pascal}Route = createRoute({
  method: "post",
  path: "/",
  tags: ["${pascalPlural}"],
  summary: "Create a new ${name}",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: create${pascal}BodySchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: ${camel}ResponseSchema } },
      description: "${pascal} created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { create${pascal}Route };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/update-${kebab}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${kebab}-id-param.ts";
import { update${pascal}BodySchema } from "../validators/update-${kebab}-body.ts";
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
    body: {
      content: {
        "application/json": { schema: update${pascal}BodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: ${camel}ResponseSchema } },
      description: "${pascal} updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { update${pascal}Route };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/delete-${kebab}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${kebab}-id-param.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const delete${pascal}Route = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["${pascalPlural}"],
  summary: "Delete a ${name}",
  security: [{ Bearer: [] }],
  request: {
    params: ${camel}IdParamSchema,
  },
  responses: {
    204: {
      description: "${pascal} deleted successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { delete${pascal}Route };
`,
  );

  // Controller
  await Deno.writeTextFile(
    `${modulePath}/presentation/${kebab}.controller.ts`,
    `import type { JwtVariables } from "hono/jwt";

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
`,
  );

  // Module
  await Deno.writeTextFile(
    `${modulePath}/presentation/${kebab}.module.ts`,
    `import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { ${pascal}Repository } from "../infrastructure/${kebab}.repository.ts";
import { ${pascal}Service } from "../application/${kebab}.service.ts";
import { define${pascal}Controller } from "./${kebab}.controller.ts";

const db = getDatabase();

const ${camel}Repo = new ${pascal}Repository(db);
const ${camel}Service = new ${pascal}Service(${camel}Repo);
const ${camel}Controller = define${pascal}Controller(${camel}Service);

export { ${camel}Controller };
`,
  );

  // Test Fixtures
  await Deno.writeTextFile(
    `${modulePath}/__tests__/fixtures/${kebab}.fixtures.ts`,
    `import type { ${pascal}Entity } from "../../domain/${kebab}.entity.ts";

/**
 * Valid ${name} fixture with all required fields
 */
const valid${pascal}: ${pascal}Entity = {
  id: 1,
  name: "Test ${pascal}",
  status: "active",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

/**
 * ${pascal} without optional fields
 */
const minimal${pascal}: ${pascal}Entity = {
  id: 2,
  name: "Minimal ${pascal}",
  status: "active",
};

/**
 * Inactive ${name} fixture
 */
const inactive${pascal}: ${pascal}Entity = {
  id: 3,
  name: "Inactive ${pascal}",
  status: "inactive",
};

/**
 * Archived (soft-deleted) ${name} fixture
 */
const archived${pascal}: ${pascal}Entity = {
  id: 4,
  name: "Archived ${pascal}",
  status: "archived",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
};

/**
 * List of ${plural} for testing getMany operations
 */
const ${camelPlural}List: ${pascal}Entity[] = [
  valid${pascal},
  minimal${pascal},
  inactive${pascal},
  {
    id: 5,
    name: "Fourth ${pascal}",
    status: "active",
  },
  {
    id: 6,
    name: "Fifth ${pascal}",
    status: "active",
  },
];

/**
 * ${pascal} data without ID (for create operations)
 */
const create${pascal}Data: Omit<${pascal}Entity, "id"> = {
  name: "New ${pascal}",
  status: "active",
};

/**
 * Partial ${name} data (for update operations)
 */
const update${pascal}Data: Partial<${pascal}Entity> = {
  name: "Updated ${pascal} Name",
};

export {
  archived${pascal},
  create${pascal}Data,
  inactive${pascal},
  ${camelPlural}List,
  minimal${pascal},
  update${pascal}Data,
  valid${pascal},
};
`,
  );

  // Mock Repository
  await Deno.writeTextFile(
    `${modulePath}/__tests__/mocks/${kebab}.repository.mock.ts`,
    `// deno-lint-ignore-file require-await
import type {
  GetMany${pascalPlural}Props,
  I${pascal}Repository,
} from "../../application/${kebab}-repository.interface.ts";
import type { ${pascal}Entity } from "../../domain/${kebab}.entity.ts";

/**
 * Configuration options for Mock${pascal}Repository
 */
interface MockRepositoryOptions {
  /** Initial ${plural} to populate the mock repository */
  ${camelPlural}?: ${pascal}Entity[];
  /** Error to throw on method calls */
  shouldThrow?: Error;
}

/**
 * Represents a method call made to the mock repository
 */
interface MethodCall {
  method: string;
  args: unknown[];
}

/**
 * Mock implementation of I${pascal}Repository for testing
 */
class Mock${pascal}Repository implements I${pascal}Repository {
  private ${camelPlural}: ${pascal}Entity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.${camelPlural} = options?.${camelPlural} ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  /**
   * Reset the mock state
   */
  reset(options?: MockRepositoryOptions): void {
    this.${camelPlural} = options?.${camelPlural} ?? [];
    this.shouldThrow = options?.shouldThrow;
    this.calls = [];
  }

  /**
   * Configure the mock to throw an error on subsequent calls
   */
  setError(error: Error): void {
    this.shouldThrow = error;
  }

  /**
   * Clear any configured error
   */
  clearError(): void {
    this.shouldThrow = undefined;
  }

  /**
   * Get all recorded method calls
   */
  getCalls(): MethodCall[] {
    return this.calls;
  }

  /**
   * Get calls for a specific method
   */
  getCallsForMethod(methodName: string): MethodCall[] {
    return this.calls.filter((call) => call.method === methodName);
  }

  /**
   * Clear all recorded calls
   */
  clearCalls(): void {
    this.calls = [];
  }

  async getMany(props: GetMany${pascalPlural}Props): Promise<${pascal}Entity[]> {
    this.calls.push({ method: "getMany", args: [props] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    let filtered = [...this.${camelPlural}];

    // Filter by status if provided
    if (props.status) {
      filtered = filtered.filter((item) => item.status === props.status);
    }

    // Apply pagination
    const page = props.page ?? 1;
    const limit = props.limit ?? 10;
    const offset = (page - 1) * limit;

    return filtered.slice(offset, offset + limit);
  }

  async getOne(id: number): Promise<${pascal}Entity> {
    this.calls.push({ method: "getOne", args: [id] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const item = this.${camelPlural}.find((item) => item.id === id);
    if (!item) {
      throw new Error("${pascal} not found");
    }

    return item;
  }

  async create(data: Omit<${pascal}Entity, "id">): Promise<${pascal}Entity> {
    this.calls.push({ method: "create", args: [data] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const newId = this.${camelPlural}.length > 0
      ? Math.max(...this.${camelPlural}.map((i) => i.id)) + 1
      : 1;

    const newItem: ${pascal}Entity = {
      ...data,
      id: newId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.${camelPlural}.push(newItem);
    return newItem;
  }

  async update(id: number, data: Partial<${pascal}Entity>): Promise<${pascal}Entity> {
    this.calls.push({ method: "update", args: [id, data] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const index = this.${camelPlural}.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error("${pascal} not found");
    }

    const updated: ${pascal}Entity = {
      ...this.${camelPlural}[index],
      ...data,
      id,
      updated_at: new Date(),
    };

    this.${camelPlural}[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.calls.push({ method: "delete", args: [id] });

    if (this.shouldThrow) {
      throw this.shouldThrow;
    }

    const index = this.${camelPlural}.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("${pascal} not found");
    }

    // Perform soft delete
    this.${camelPlural}[index] = {
      ...this.${camelPlural}[index],
      status: "archived",
      deleted_at: new Date(),
    };
  }
}

export { Mock${pascal}Repository };
export type { MethodCall, MockRepositoryOptions };
`,
  );

  // Service Test
  await Deno.writeTextFile(
    `${modulePath}/application/${kebab}.service_test.ts`,
    `import { assertEquals, assertRejects } from "@std/assert";
import { ${pascal}Service } from "./${kebab}.service.ts";
import { Mock${pascal}Repository } from "../__tests__/mocks/${kebab}.repository.mock.ts";
import { ${camelPlural}List, create${pascal}Data, update${pascal}Data } from "../__tests__/fixtures/${kebab}.fixtures.ts";
import type { GetMany${pascalPlural}Props } from "./${kebab}-repository.interface.ts";

/**
 * Unit tests for ${pascal}Service
 * Tests verify that the service correctly delegates operations to the repository
 */

Deno.test("${pascal}Service - getMany delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);
  const props: GetMany${pascalPlural}Props = { page: 1, limit: 10 };

  const result = await service.getMany(props);

  const calls = mockRepo.getCallsForMethod("getMany");
  assertEquals(calls.length, 1, "getMany should be called once");
  assertEquals(calls[0].args[0], props, "getMany should receive the same props");
  assertEquals(result.length, ${camelPlural}List.length, "Should return all ${plural}");
});

Deno.test("${pascal}Service - getOne delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);
  const id = 1;

  const result = await service.getOne(id);

  const calls = mockRepo.getCallsForMethod("getOne");
  assertEquals(calls.length, 1, "getOne should be called once");
  assertEquals(calls[0].args[0], id, "getOne should receive the same id");
  assertEquals(result.id, id, "Should return the correct ${name}");
});

Deno.test("${pascal}Service - create delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: [] });
  const service = new ${pascal}Service(mockRepo);

  const result = await service.create(create${pascal}Data);

  const calls = mockRepo.getCallsForMethod("create");
  assertEquals(calls.length, 1, "create should be called once");
  assertEquals(calls[0].args[0], create${pascal}Data, "create should receive the same data");
  assertEquals(result.name, create${pascal}Data.name, "Should return the created ${name}");
});

Deno.test("${pascal}Service - update delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);
  const id = 1;

  const result = await service.update(id, update${pascal}Data);

  const calls = mockRepo.getCallsForMethod("update");
  assertEquals(calls.length, 1, "update should be called once");
  assertEquals(calls[0].args[0], id, "update should receive the same id");
  assertEquals(calls[0].args[1], update${pascal}Data, "update should receive the same data");
  assertEquals(result.name, update${pascal}Data.name, "Should return the updated ${name}");
});

Deno.test("${pascal}Service - delete delegates to repository", async () => {
  const mockRepo = new Mock${pascal}Repository({ ${camelPlural}: ${camelPlural}List });
  const service = new ${pascal}Service(mockRepo);
  const id = 1;

  await service.delete(id);

  const calls = mockRepo.getCallsForMethod("delete");
  assertEquals(calls.length, 1, "delete should be called once");
  assertEquals(calls[0].args[0], id, "delete should receive the same id");
});

Deno.test("${pascal}Service - getMany propagates repository errors", async () => {
  const error = new Error("Database connection failed");
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: error });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(
    () => service.getMany({}),
    Error,
    "Database connection failed",
  );
});

Deno.test("${pascal}Service - getOne propagates repository errors", async () => {
  const error = new Error("${pascal} not found");
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: error });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(
    () => service.getOne(999),
    Error,
    "${pascal} not found",
  );
});

Deno.test("${pascal}Service - create propagates repository errors", async () => {
  const error = new Error("Validation failed");
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: error });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(
    () => service.create(create${pascal}Data),
    Error,
    "Validation failed",
  );
});

Deno.test("${pascal}Service - update propagates repository errors", async () => {
  const error = new Error("${pascal} not found");
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: error });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(
    () => service.update(999, update${pascal}Data),
    Error,
    "${pascal} not found",
  );
});

Deno.test("${pascal}Service - delete propagates repository errors", async () => {
  const error = new Error("${pascal} not found");
  const mockRepo = new Mock${pascal}Repository({ shouldThrow: error });
  const service = new ${pascal}Service(mockRepo);

  await assertRejects(
    () => service.delete(999),
    Error,
    "${pascal} not found",
  );
});
`,
  );

  console.log(`✓ Module '${pascal}' created at ${modulePath}`);
  console.log(`
Files created:
  - domain/${kebab}.entity.ts
  - application/${kebab}-repository.interface.ts
  - application/${kebab}.service.ts
  - application/${kebab}.service_test.ts
  - infrastructure/${kebab}.repository.ts
  - presentation/${kebab}.controller.ts
  - presentation/${kebab}.module.ts
  - presentation/validators/${kebab}-id-param.ts
  - presentation/validators/create-${kebab}-body.ts
  - presentation/validators/update-${kebab}-body.ts
  - presentation/validators/get-many-${kebabPlural}-query.ts
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
