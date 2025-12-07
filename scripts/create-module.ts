import { dirname, fromFileUrl, join } from "@std/path";
import { toCamelCase, toPascalCase } from "@std/text";

const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));
const BASE_PATH = join(SCRIPT_DIR, "..", "src", "modules");

function getModuleName(): string {
  const name = Deno.args[0];
  if (!name) {
    console.error("Usage: deno task create:module <module-name>");
    console.error("Example: deno task create:module user");
    Deno.exit(1);
  }
  return name.toLowerCase();
}

async function createModule(name: string) {
  const pascal = toPascalCase(name);
  const camel = toCamelCase(name);
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

  // Entity
  await Deno.writeTextFile(
    `${modulePath}/domain/${name}.entity.ts`,
    `import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ${pascal}Entity extends BaseEntity {
  name: string;
}

export type { ${pascal}Entity };
`,
  );

  // Repository Interface
  await Deno.writeTextFile(
    `${modulePath}/application/${name}-repository.interface.ts`,
    `import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${name}.entity.ts";

type GetMany${pascal}sProps = GetManyPropsType;

interface I${pascal}Repository {
  getMany(props: GetMany${pascal}sProps): Promise<${pascal}[]>;
  getOne(id: number): Promise<${pascal}>;
  create(data: Omit<${pascal}, "id">): Promise<${pascal}>;
  update(id: number, data: Partial<${pascal}>): Promise<${pascal}>;
  delete(id: number): Promise<void>;
}

export type { GetMany${pascal}sProps, I${pascal}Repository };
`,
  );

  // Service
  await Deno.writeTextFile(
    `${modulePath}/application/${name}.service.ts`,
    `import {
  GetMany${pascal}sProps,
  I${pascal}Repository,
} from "./${name}-repository.interface.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${name}.entity.ts";

class ${pascal}Service {
  constructor(private readonly ${camel}Repository: I${pascal}Repository) {}

  async getMany(props: GetMany${pascal}sProps) {
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
    `${modulePath}/infrastructure/${name}.repository.ts`,
    `import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import {
  GetMany${pascal}sProps,
  I${pascal}Repository,
} from "../application/${name}-repository.interface.ts";
import { ${pascal}Entity as ${pascal} } from "../domain/${name}.entity.ts";

class ${pascal}Repository implements I${pascal}Repository {
  constructor(private readonly db: PersistenceType) {}

  async getMany(props: GetMany${pascal}sProps) {
    const { page = 1, limit = 10, status = "active" } = props;

    const result = await this.db
      .selectFrom("${name}s")
      .where("status", "=", status)
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return result as ${pascal}[];
  }

  async getOne(id: number) {
    const result = await this.db
      .selectFrom("${name}s")
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
      .insertInto("${name}s")
      .values({ ...data, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) {
      throw new Error("${pascal} not created");
    }

    return this.getOne(Number(created.insertId));
  }

  async update(id: number, data: Partial<${pascal}>) {
    await this.db
      .updateTable("${name}s")
      .set({ ...data, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  async delete(id: number) {
    await this.db
      .updateTable("${name}s")
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
    `${modulePath}/presentation/validators/${name}IdParam.ts`,
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
    `${modulePath}/presentation/validators/create${pascal}Body.ts`,
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
    `${modulePath}/presentation/validators/update${pascal}Body.ts`,
    `import { z } from "@hono/zod-openapi";
import { create${pascal}BodySchema } from "./create${pascal}Body.ts";

const update${pascal}BodySchema = create${pascal}BodySchema.partial().openapi("Update${pascal}Body");

type Update${pascal}Body = z.infer<typeof update${pascal}BodySchema>;

export { update${pascal}BodySchema };
export type { Update${pascal}Body };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/validators/getMany${pascal}sQuery.ts`,
    `import { z } from "@hono/zod-openapi";

const getMany${pascal}sQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({ example: "active" }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
  })
  .openapi("GetMany${pascal}sQuery");

type GetMany${pascal}sQuery = z.infer<typeof getMany${pascal}sQuerySchema>;

export { getMany${pascal}sQuerySchema };
export type { GetMany${pascal}sQuery };
`,
  );

  // Schemas
  await Deno.writeTextFile(
    `${modulePath}/presentation/schemas/${name}-response.schema.ts`,
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

const ${camel}ListResponseSchema = z.array(${camel}ResponseSchema).openapi("${pascal}ListResponse");

export { ${camel}ResponseSchema, ${camel}ListResponseSchema };
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
    `${modulePath}/presentation/routes/get-many-${name}s.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { getMany${pascal}sQuerySchema } from "../validators/getMany${pascal}sQuery.ts";
import { ${camel}ListResponseSchema } from "../schemas/${name}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getMany${pascal}sRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["${pascal}s"],
  summary: "Get many ${name}s",
  security: [{ Bearer: [] }],
  request: {
    query: getMany${pascal}sQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: ${camel}ListResponseSchema } },
      description: "List of ${name}s",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getMany${pascal}sRoute };
`,
  );

  await Deno.writeTextFile(
    `${modulePath}/presentation/routes/get-one-${name}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${name}IdParam.ts";
import { ${camel}ResponseSchema } from "../schemas/${name}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOne${pascal}Route = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["${pascal}s"],
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
    `${modulePath}/presentation/routes/create-${name}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { create${pascal}BodySchema } from "../validators/create${pascal}Body.ts";
import { ${camel}ResponseSchema } from "../schemas/${name}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const create${pascal}Route = createRoute({
  method: "post",
  path: "/",
  tags: ["${pascal}s"],
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
    `${modulePath}/presentation/routes/update-${name}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${name}IdParam.ts";
import { update${pascal}BodySchema } from "../validators/update${pascal}Body.ts";
import { ${camel}ResponseSchema } from "../schemas/${name}-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const update${pascal}Route = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["${pascal}s"],
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
    `${modulePath}/presentation/routes/delete-${name}.route.ts`,
    `import { createRoute } from "@hono/zod-openapi";
import { ${camel}IdParamSchema } from "../validators/${name}IdParam.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const delete${pascal}Route = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["${pascal}s"],
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
    `${modulePath}/presentation/${name}.controller.ts`,
    `import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { ${pascal}Service } from "../application/${name}.service.ts";
import { getMany${pascal}sRoute } from "./routes/get-many-${name}s.route.ts";
import { getOne${pascal}Route } from "./routes/get-one-${name}.route.ts";
import { create${pascal}Route } from "./routes/create-${name}.route.ts";
import { update${pascal}Route } from "./routes/update-${name}.route.ts";
import { delete${pascal}Route } from "./routes/delete-${name}.route.ts";

function define${pascal}Controller(service: ${pascal}Service) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getMany${pascal}sRoute, async (c) => {
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
    `${modulePath}/presentation/${name}.module.ts`,
    `import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { ${pascal}Repository } from "../infrastructure/${name}.repository.ts";
import { ${pascal}Service } from "../application/${name}.service.ts";
import { define${pascal}Controller } from "./${name}.controller.ts";

const db = getDatabase();

const ${camel}Repo = new ${pascal}Repository(db);
const ${camel}Service = new ${pascal}Service(${camel}Repo);
const ${camel}Controller = define${pascal}Controller(${camel}Service);

export { ${camel}Controller };
`,
  );

  console.log(`✓ Module '${pascal}' created at ${modulePath}`);
  console.log(`
Files created:
  - domain/${name}.entity.ts
  - application/${name}-repository.interface.ts
  - application/${name}.service.ts
  - infrastructure/${name}.repository.ts
  - presentation/${name}.controller.ts
  - presentation/${name}.module.ts
  - presentation/validators/${name}IdParam.ts
  - presentation/validators/create${pascal}Body.ts
  - presentation/validators/update${pascal}Body.ts
  - presentation/validators/getMany${pascal}sQuery.ts
  - presentation/schemas/${name}-response.schema.ts
  - presentation/schemas/error-response.schema.ts
  - presentation/routes/get-many-${name}s.route.ts
  - presentation/routes/get-one-${name}.route.ts
  - presentation/routes/create-${name}.route.ts
  - presentation/routes/update-${name}.route.ts
  - presentation/routes/delete-${name}.route.ts

Don't forget to:
  1. Add the table to your database schema
  2. Register the controller in main.ts:
     app.route("/${name}s", ${camel}Controller);`);
}

const moduleName = getModuleName();
await createModule(moduleName);
