// deno-lint-ignore-file require-await
import { assertEquals } from "@std/assert";
import { sign } from "hono/jwt";
import { defineItemController } from "./item.controller.ts";
import { ItemService } from "../application/item.service.ts";
import { ItemAiService } from "../infrastructure/item.ai-service.ts";
import { MockItemRepository } from "../__tests__/mocks/item.repository.mock.ts";
import {
  createItemData,
  itemsList,
  updateItemData,
  validItem,
} from "../__tests__/fixtures/item.fixtures.ts";

/**
 * Test app factory that creates a controller with mock dependencies
 */
function createTestApp() {
  // Set JWT_SECRET for testing if not already set
  if (!Deno.env.get("JWT_SECRET")) {
    Deno.env.set("JWT_SECRET", "test-secret-key-for-testing");
  }

  const mockRepo = new MockItemRepository({ items: [...itemsList] });
  const service = new ItemService(mockRepo);

  // Mock AI service - we don't need real Gemini for controller tests
  const mockAiService = {
    generate: async (_spaceId: number, _prompt: string) => {
      return "Mock AI response";
    },
  } as ItemAiService;

  const controller = defineItemController(service, mockAiService);

  return { app: controller, mockRepo };
}

/**
 * Generate a valid JWT token for testing
 */
async function generateTestToken(): Promise<string> {
  const jwtSecret = Deno.env.get("JWT_SECRET") || "test-secret-key-for-testing";

  const payload = {
    sub: "1",
    jti: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  return await sign(payload, jwtSecret);
}

/**
 * **Validates: Requirements 6.1**
 * Test GET /items returns 200 with items
 */
Deno.test("GET /items returns 200 with items list", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/?spaceId=1&type=full", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(Array.isArray(body.data), true);
  assertEquals(body.data.length > 0, true);
  assertEquals(body.metadata !== undefined, true);
});

/**
 * **Validates: Requirements 6.1**
 * Test GET /items with pagination parameters
 */
Deno.test("GET /items respects pagination parameters", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/?spaceId=1&type=full&page=1&limit=2", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.data.length <= 2, true);
  assertEquals(body.metadata.itemsPerPage, 2);
  assertEquals(body.metadata.currentPage, 1);
});

/**
 * **Validates: Requirements 6.2**
 * Test GET /items/:id returns 200 with item
 */
Deno.test("GET /items/:id returns 200 with item", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/1", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.id, 1);
  assertEquals(body.name, validItem.name);
});

/**
 * **Validates: Requirements 6.2**
 * Test GET /items/:id returns error for non-existent item
 */
Deno.test("GET /items/:id returns error for non-existent item", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/999", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assertEquals(res.status, 500);
});

/**
 * **Validates: Requirements 6.3**
 * Test POST /items returns 201 with created item
 */
Deno.test("POST /items returns 201 with created item", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createItemData),
  });

  assertEquals(res.status, 201);

  const body = await res.json();
  assertEquals(body.name, createItemData.name);
  assertEquals(body.cost, createItemData.cost);
  assertEquals(body.price, createItemData.price);
  assertEquals(body.id !== undefined, true);
});

/**
 * **Validates: Requirements 6.4**
 * Test PUT /items/:id returns 200 with updated item
 */
Deno.test("PATCH /items/:id returns 200 with updated item", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/1", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateItemData),
  });

  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.id, 1);
  assertEquals(body.name, updateItemData.name);
  assertEquals(body.price, updateItemData.price);
});

/**
 * **Validates: Requirements 6.5**
 * Test DELETE /items/:id returns 204
 */
Deno.test("DELETE /items/:id returns 204", async () => {
  const { app } = createTestApp();
  const token = await generateTestToken();

  const res = await app.request("/1", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assertEquals(res.status, 204);

  const body = await res.text();
  assertEquals(body, "");
});

/**
 * **Validates: Requirements 6.6**
 * Test requests without JWT return 401
 */
Deno.test("GET /items without JWT returns 401", async () => {
  const { app } = createTestApp();

  const res = await app.request("/", {
    method: "GET",
  });

  assertEquals(res.status, 401);
});

/**
 * **Validates: Requirements 6.6**
 * Test POST without JWT returns 401
 */
Deno.test("POST /items without JWT returns 401", async () => {
  const { app } = createTestApp();

  const res = await app.request("/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createItemData),
  });

  assertEquals(res.status, 401);
});

/**
 * **Validates: Requirements 6.6**
 * Test PATCH without JWT returns 401
 */
Deno.test("PATCH /items/:id without JWT returns 401", async () => {
  const { app } = createTestApp();

  const res = await app.request("/1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateItemData),
  });

  assertEquals(res.status, 401);
});

/**
 * **Validates: Requirements 6.6**
 * Test DELETE without JWT returns 401
 */
Deno.test("DELETE /items/:id without JWT returns 401", async () => {
  const { app } = createTestApp();

  const res = await app.request("/1", {
    method: "DELETE",
  });

  assertEquals(res.status, 401);
});

/**
 * **Validates: Requirements 6.6**
 * Test with invalid JWT returns 401
 */
Deno.test("GET /items with invalid JWT returns 401", async () => {
  const { app } = createTestApp();

  const res = await app.request("/", {
    method: "GET",
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });

  assertEquals(res.status, 401);
});
