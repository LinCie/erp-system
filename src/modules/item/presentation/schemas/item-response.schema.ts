import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const inventoryItemSchema = z.object({
  balance: z.coerce.number().openapi({ example: 1000 }),
  cost_per_unit: z.coerce.number().openapi({ example: 100 }),
  notes: z.string().optional().openapi({ example: "Notes" }),
  space_name: z.string().openapi({ example: "Space 1" }),
  status: z.string().openapi({ example: "active" }),
}).openapi("InventoryItem");

const itemFileSchema = z
  .object({
    name: z.string().openapi({ example: "product.pdf" }),
    path: z.string().openapi({ example: "items/1234567890-product.pdf" }),
    size: z.number().openapi({ example: 102400 }),
  })
  .openapi("ItemFile");

const itemImageSchema = z
  .object({
    name: z.string().openapi({ example: "product.jpg" }),
    path: z.string().openapi({ example: "items/1234567890-product.jpg" }),
    size: z.number().openapi({ example: 102400 }),
    isNew: z.boolean().optional().openapi({ example: true }),
  })
  .openapi("ItemImage");

const itemResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Item" }),
    code: z.string().optional().openapi({ example: "ITEM-001" }),
    description: z.string().optional().openapi({
      example: "Item description",
    }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    cost: z.string().openapi({ example: "10000" }),
    price: z.string().openapi({ example: "15000" }),
    price_discount: z.string().optional().openapi({ example: "5000" }),
    weight: z.string().openapi({ example: "1.5" }),
    notes: z.string().optional().openapi({
      example: "Additional notes",
    }),
    status: z.string().openapi({ example: "active" }),
    images: z.array(itemImageSchema).optional().openapi({
      example: [{
        name: "product.jpg",
        path: "items/1234567890-product.jpg",
        size: 102400,
        isNew: true,
      }],
    }),
    files: z.array(itemFileSchema).optional().openapi({
      example: [{
        name: "product.pdf",
        path: "items/1234567890-product.pdf",
        size: 102400,
      }],
    }),
    inventories: z.array(inventoryItemSchema).optional().openapi({
      example: [{
        balance: 100,
        cost_per_unit: 100,
        notes: "",
        space_name: "",
        status: "active",
      }],
    }),
  })
  .openapi("ItemResponse");

const GetManyItemsResponseSchema = z.object({
  data: z.array(itemResponseSchema),
  metadata: getManyMetadataSchema,
});

const requestUploadResponseSchema = z.object({
  url: z.string().openapi({ example: "https://upload.example.com" }),
  key: z.string().openapi({ example: "items/1234567890-product.jpg" }),
}).openapi(
  "RequestUploadResponse",
);

export {
  GetManyItemsResponseSchema,
  itemResponseSchema,
  requestUploadResponseSchema,
};
