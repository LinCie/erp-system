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
  await Deno.mkdir(`${modulePath}/presentation`, { recursive: true });

  // Entity
  await Deno.writeTextFile(
    `${modulePath}/domain/${name}.entity.ts`,
    `
import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ${pascal}Entity extends BaseEntity {};

export type { ${pascal}Entity };
    `,
  );

  // Repository Interface
  await Deno.writeTextFile(
    `${modulePath}/application/${name}-repository.interface.ts`,
    `
import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
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
    `
import {
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
    `
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
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

  // Controller
  await Deno.writeTextFile(
    `${modulePath}/presentation/${name}.controller.ts`,
    `
import { Hono } from "hono";
import { ${pascal}Service } from "../application/${name}.service.ts";

function define${pascal}Controller(service: ${pascal}Service) {
  const app = new Hono();

  app.get("/", async (c) => {
    const result = await service.getMany({});
    return c.json(result);
  });

  app.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await service.getOne(id);
    return c.json(result);
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const result = await service.create(body);
    return c.json(result, 201);
  });

  app.patch("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const result = await service.update(id, body);
    return c.json(result);
  });

  app.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
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
    `
import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
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

Don't forget to:
  1. Add the table to your database schema
  2. Register the controller in main.ts`);
}

const moduleName = getModuleName();
await createModule(moduleName);
