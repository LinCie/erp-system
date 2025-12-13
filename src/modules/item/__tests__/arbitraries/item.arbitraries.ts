import fc from "fast-check";
import type { ItemEntity } from "../../domain/item.entity.ts";
import type { GetManyItemsProps } from "../../application/item-repository.interface.ts";

/**
 * Arbitrary for numeric string values (cost, price, weight)
 * Generates valid decimal numbers as strings with 2 decimal places
 */
const numericStringArb: fc.Arbitrary<string> = fc
  .float({
    min: 0,
    max: Math.fround(999999.99),
    noNaN: true,
    noDefaultInfinity: true,
  })
  .map((n) => n.toFixed(2));

/**
 * Arbitrary for status values
 */
const statusArb: fc.Arbitrary<"active" | "inactive" | "archived"> = fc
  .constantFrom("active", "inactive", "archived");

/**
 * Arbitrary for optional string fields
 * Generates either undefined or a non-empty string
 */
const optionalStringArb = (
  maxLength = 255,
): fc.Arbitrary<string | undefined> =>
  fc.option(
    fc.string({ minLength: 1, maxLength }),
    { nil: undefined },
  );

/**
 * Arbitrary for optional number fields
 */
const optionalNumberArb: fc.Arbitrary<number | undefined> = fc.option(
  fc.nat(),
  { nil: undefined },
);

/**
 * Arbitrary for optional Date fields
 */
const optionalDateArb: fc.Arbitrary<Date | undefined> = fc.option(
  fc.date(),
  { nil: undefined },
);

/**
 * Arbitrary for complete ItemEntity with all fields
 */
const itemEntityArb: fc.Arbitrary<ItemEntity> = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  cost: numericStringArb,
  price: numericStringArb,
  weight: numericStringArb,
  status: statusArb,
  code: optionalStringArb(50),
  description: optionalStringArb(1000),
  sku: optionalStringArb(50),
  notes: optionalStringArb(1000),
  model_id: optionalNumberArb,
  model_type: optionalStringArb(50),
  parent_id: optionalNumberArb,
  parent_type: optionalStringArb(50),
  space_id: optionalNumberArb,
  space_type: optionalStringArb(50),
  type_id: optionalNumberArb,
  type_type: optionalStringArb(50),
  primary_code: optionalStringArb(50),
  created_at: optionalDateArb,
  updated_at: optionalDateArb,
  deleted_at: optionalDateArb,
});

/**
 * Arbitrary for ItemEntity without id (for create operations)
 */
const createItemArb: fc.Arbitrary<Omit<ItemEntity, "id">> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  cost: numericStringArb,
  price: numericStringArb,
  weight: numericStringArb,
  status: statusArb,
  code: optionalStringArb(50),
  description: optionalStringArb(1000),
  sku: optionalStringArb(50),
  notes: optionalStringArb(1000),
  model_id: optionalNumberArb,
  model_type: optionalStringArb(50),
  parent_id: optionalNumberArb,
  parent_type: optionalStringArb(50),
  space_id: optionalNumberArb,
  space_type: optionalStringArb(50),
  type_id: optionalNumberArb,
  type_type: optionalStringArb(50),
  primary_code: optionalStringArb(50),
  created_at: optionalDateArb,
  updated_at: optionalDateArb,
  deleted_at: optionalDateArb,
});

/**
 * Arbitrary for partial ItemEntity (for update operations)
 * Generates objects with a random subset of fields
 */
const partialItemArb: fc.Arbitrary<Partial<ItemEntity>> = fc.record(
  {
    name: optionalStringArb(255),
    cost: fc.option(numericStringArb, { nil: undefined }),
    price: fc.option(numericStringArb, { nil: undefined }),
    weight: fc.option(numericStringArb, { nil: undefined }),
    status: fc.option(statusArb, { nil: undefined }),
    code: optionalStringArb(50),
    description: optionalStringArb(1000),
    sku: optionalStringArb(50),
    notes: optionalStringArb(1000),
    model_id: optionalNumberArb,
    model_type: optionalStringArb(50),
    parent_id: optionalNumberArb,
    parent_type: optionalStringArb(50),
    space_id: optionalNumberArb,
    space_type: optionalStringArb(50),
    type_id: optionalNumberArb,
    type_type: optionalStringArb(50),
    primary_code: optionalStringArb(50),
  },
  { requiredKeys: [] },
);

/**
 * Arbitrary for GetManyItemsProps
 */
const getManyPropsArb: fc.Arbitrary<GetManyItemsProps> = fc.record({
  spaceId: fc.nat(),
  type: fc.constantFrom("full", "partial"),
  page: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  search: optionalStringArb(100),
  sort: fc.option(
    fc.constantFrom("id", "price", "name", "created_at"),
    { nil: undefined },
  ),
  order: fc.option(fc.constantFrom("asc", "desc"), { nil: undefined }),
  status: fc.option(statusArb, { nil: undefined }),
  withInventory: fc.option(fc.boolean(), { nil: undefined }),
});

export {
  createItemArb,
  getManyPropsArb,
  itemEntityArb,
  numericStringArb,
  optionalDateArb,
  optionalNumberArb,
  optionalStringArb,
  partialItemArb,
  statusArb,
};
