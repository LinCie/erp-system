import fc from "fast-check";
import type { TransactionDetailEntity } from "../../domain/transaction-detail.entity.ts";

/**
 * Arbitrary for numeric string values (quantity, price, discount, weight, cost_per_unit, debit, credit)
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
 * Arbitrary for model_type values
 * Common transaction detail types
 */
const modelTypeArb: fc.Arbitrary<string> = fc.constantFrom(
  "SO",
  "PO",
  "BILL",
  "PAY",
  "INV",
  "QUO",
);

/**
 * Arbitrary for detail_type values
 * Common entity types that can be referenced
 */
const detailTypeArb: fc.Arbitrary<string> = fc.constantFrom(
  "Item",
  "Account",
  "Service",
  "Product",
);

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
 * Arbitrary for optional JSON data field
 */
const optionalDataArb: fc.Arbitrary<Record<string, unknown> | undefined> = fc
  .option(
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.oneof(
        fc.string({ maxLength: 100 }),
        fc.nat(),
        fc.boolean(),
      ),
    ),
    { nil: undefined },
  );

/**
 * Arbitrary for complete TransactionDetailEntity with all fields
 */
const transactionDetailEntityArb: fc.Arbitrary<TransactionDetailEntity> = fc
  .record({
    id: fc.nat(),
    transaction_id: fc.nat({ max: 10000 }),
    detail_type: fc.option(detailTypeArb, { nil: undefined }),
    detail_id: optionalNumberArb,
    model_type: fc.option(modelTypeArb, { nil: undefined }),
    model_id: optionalNumberArb,
    sku: optionalStringArb(50),
    name: optionalStringArb(255),
    code: optionalStringArb(50),
    quantity: numericStringArb,
    price: numericStringArb,
    discount: numericStringArb,
    weight: fc.option(numericStringArb, { nil: undefined }),
    cost_per_unit: numericStringArb,
    debit: numericStringArb,
    credit: numericStringArb,
    data: optionalDataArb,
    notes: optionalStringArb(1000),
    status: statusArb,
    created_at: optionalDateArb,
    updated_at: optionalDateArb,
    deleted_at: optionalDateArb,
  });

/**
 * Arbitrary for TransactionDetailEntity without id (for create operations)
 */
const createTransactionDetailArb: fc.Arbitrary<
  Omit<TransactionDetailEntity, "id">
> = fc.record({
  transaction_id: fc.nat({ max: 10000 }),
  detail_type: fc.option(detailTypeArb, { nil: undefined }),
  detail_id: optionalNumberArb,
  model_type: fc.option(modelTypeArb, { nil: undefined }),
  model_id: optionalNumberArb,
  sku: optionalStringArb(50),
  name: optionalStringArb(255),
  code: optionalStringArb(50),
  quantity: numericStringArb,
  price: numericStringArb,
  discount: numericStringArb,
  weight: fc.option(numericStringArb, { nil: undefined }),
  cost_per_unit: numericStringArb,
  debit: numericStringArb,
  credit: numericStringArb,
  data: optionalDataArb,
  notes: optionalStringArb(1000),
  status: statusArb,
  created_at: optionalDateArb,
  updated_at: optionalDateArb,
  deleted_at: optionalDateArb,
});

/**
 * Arbitrary for partial TransactionDetailEntity (for update operations)
 * Generates objects with a random subset of fields
 */
const partialTransactionDetailArb: fc.Arbitrary<
  Partial<TransactionDetailEntity>
> = fc.record(
  {
    detail_type: fc.option(detailTypeArb, { nil: undefined }),
    detail_id: optionalNumberArb,
    model_type: fc.option(modelTypeArb, { nil: undefined }),
    model_id: optionalNumberArb,
    sku: optionalStringArb(50),
    name: optionalStringArb(255),
    code: optionalStringArb(50),
    quantity: fc.option(numericStringArb, { nil: undefined }),
    price: fc.option(numericStringArb, { nil: undefined }),
    discount: fc.option(numericStringArb, { nil: undefined }),
    weight: fc.option(numericStringArb, { nil: undefined }),
    cost_per_unit: fc.option(numericStringArb, { nil: undefined }),
    debit: fc.option(numericStringArb, { nil: undefined }),
    credit: fc.option(numericStringArb, { nil: undefined }),
    data: optionalDataArb,
    notes: optionalStringArb(1000),
    status: fc.option(statusArb, { nil: undefined }),
  },
  { requiredKeys: [] },
);

export {
  createTransactionDetailArb,
  detailTypeArb,
  modelTypeArb,
  numericStringArb,
  optionalDataArb,
  optionalDateArb,
  optionalNumberArb,
  optionalStringArb,
  partialTransactionDetailArb,
  statusArb,
  transactionDetailEntityArb,
};
