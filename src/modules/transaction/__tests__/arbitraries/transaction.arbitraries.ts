import fc from "fast-check";
import type { TransactionEntity } from "../../domain/transaction.entity.ts";
import type { GetManyTransactionsProps } from "../../application/transaction-repository.interface.ts";

/**
 * Arbitrary for numeric string values (total, total_details, fee)
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
const statusArb: fc.Arbitrary<string> = fc.constantFrom(
  "TX_DRAFT",
  "TX_SENT",
  "TX_RECEIVED",
  "TX_CLOSED",
  "active",
  "inactive",
  "archived",
);

/**
 * Arbitrary for type_type values (transaction types)
 */
const typeTypeArb: fc.Arbitrary<string> = fc.constantFrom(
  "TRD",
  "QUO",
  "INV",
  "PO",
  "SO",
  "TX",
);

/**
 * Arbitrary for polymorphic type values
 */
const polymorphicTypeArb: fc.Arbitrary<string> = fc.constantFrom(
  "Player",
  "Person",
  "Group",
  "Item",
  "Space",
  "Inventory",
  "Account",
  "Transaction",
  "Order",
);

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
 * Arbitrary for polymorphic relationship (type + id pair)
 * Generates both type and id together or both undefined
 */
const polymorphicRelationshipArb: fc.Arbitrary<
  { type?: string; id?: number }
> = fc.oneof(
  fc.constant({ type: undefined, id: undefined }),
  fc.record({
    type: polymorphicTypeArb,
    id: fc.nat({ max: 10000 }),
  }),
);

/**
 * Arbitrary for address objects (input_address, output_address)
 */
const addressArb: fc.Arbitrary<Record<string, unknown> | undefined> = fc.option(
  fc.record({
    street: fc.string({ minLength: 5, maxLength: 100 }),
    city: fc.string({ minLength: 3, maxLength: 50 }),
    state: fc.option(fc.string({ minLength: 2, maxLength: 50 }), {
      nil: undefined,
    }),
    zip: fc.string({ minLength: 5, maxLength: 10 }),
    country: fc.option(fc.string({ minLength: 2, maxLength: 50 }), {
      nil: undefined,
    }),
  }),
  { nil: undefined },
);

/**
 * Arbitrary for JSON metadata (files, tags, links)
 */
const jsonMetadataArb: fc.Arbitrary<string[] | undefined> = fc.option(
  fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 }),
  { nil: undefined },
);

/**
 * Arbitrary for complete TransactionEntity with all fields
 */
const transactionEntityArb: fc.Arbitrary<TransactionEntity> = fc.record({
  id: fc.nat(),
  number: optionalStringArb(50),
  class: optionalStringArb(50),
  space_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  space_id: optionalNumberArb,
  model_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  model_id: optionalNumberArb,
  type_type: fc.option(typeTypeArb, { nil: undefined }),
  type_id: optionalNumberArb,
  sender_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  sender_id: optionalNumberArb,
  receiver_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  receiver_id: optionalNumberArb,
  handler_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  handler_id: optionalNumberArb,
  input_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  input_id: optionalNumberArb,
  output_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  output_id: optionalNumberArb,
  parent_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  parent_id: optionalNumberArb,
  relation_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  relation_id: optionalNumberArb,
  input_address: addressArb,
  output_address: addressArb,
  request_time: optionalDateArb,
  sent_time: optionalDateArb,
  received_time: optionalDateArb,
  total: numericStringArb,
  total_details: fc.option(numericStringArb, { nil: undefined }),
  fee: numericStringArb,
  fee_rules: optionalStringArb(100),
  description: optionalStringArb(1000),
  sender_notes: optionalStringArb(1000),
  receiver_notes: optionalStringArb(1000),
  handler_notes: optionalStringArb(1000),
  handler_number: optionalStringArb(50),
  notes: optionalStringArb(1000),
  files: jsonMetadataArb,
  tags: jsonMetadataArb,
  links: jsonMetadataArb,
  status: statusArb,
  created_at: optionalDateArb,
  updated_at: optionalDateArb,
  deleted_at: optionalDateArb,
});

/**
 * Arbitrary for TransactionEntity without id (for create operations)
 */
const createTransactionArb: fc.Arbitrary<Omit<TransactionEntity, "id">> = fc
  .record({
    number: optionalStringArb(50),
    class: optionalStringArb(50),
    space_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    space_id: optionalNumberArb,
    model_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    model_id: optionalNumberArb,
    type_type: fc.option(typeTypeArb, { nil: undefined }),
    type_id: optionalNumberArb,
    sender_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    sender_id: optionalNumberArb,
    receiver_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    receiver_id: optionalNumberArb,
    handler_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    handler_id: optionalNumberArb,
    input_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    input_id: optionalNumberArb,
    output_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    output_id: optionalNumberArb,
    parent_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    parent_id: optionalNumberArb,
    relation_type: fc.option(polymorphicTypeArb, { nil: undefined }),
    relation_id: optionalNumberArb,
    input_address: addressArb,
    output_address: addressArb,
    request_time: optionalDateArb,
    sent_time: optionalDateArb,
    received_time: optionalDateArb,
    total: numericStringArb,
    total_details: fc.option(numericStringArb, { nil: undefined }),
    fee: numericStringArb,
    fee_rules: optionalStringArb(100),
    description: optionalStringArb(1000),
    sender_notes: optionalStringArb(1000),
    receiver_notes: optionalStringArb(1000),
    handler_notes: optionalStringArb(1000),
    handler_number: optionalStringArb(50),
    notes: optionalStringArb(1000),
    files: jsonMetadataArb,
    tags: jsonMetadataArb,
    links: jsonMetadataArb,
    status: statusArb,
    created_at: optionalDateArb,
    updated_at: optionalDateArb,
    deleted_at: optionalDateArb,
  });

/**
 * Arbitrary for partial TransactionEntity (for update operations)
 * Generates objects with a random subset of fields
 */
const partialTransactionArb: fc.Arbitrary<Partial<TransactionEntity>> = fc
  .record(
    {
      number: optionalStringArb(50),
      class: optionalStringArb(50),
      space_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      space_id: optionalNumberArb,
      model_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      model_id: optionalNumberArb,
      type_type: fc.option(typeTypeArb, { nil: undefined }),
      type_id: optionalNumberArb,
      sender_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      sender_id: optionalNumberArb,
      receiver_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      receiver_id: optionalNumberArb,
      handler_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      handler_id: optionalNumberArb,
      input_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      input_id: optionalNumberArb,
      output_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      output_id: optionalNumberArb,
      parent_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      parent_id: optionalNumberArb,
      relation_type: fc.option(polymorphicTypeArb, { nil: undefined }),
      relation_id: optionalNumberArb,
      input_address: addressArb,
      output_address: addressArb,
      request_time: optionalDateArb,
      sent_time: optionalDateArb,
      received_time: optionalDateArb,
      total: fc.option(numericStringArb, { nil: undefined }),
      total_details: fc.option(numericStringArb, { nil: undefined }),
      fee: fc.option(numericStringArb, { nil: undefined }),
      fee_rules: optionalStringArb(100),
      description: optionalStringArb(1000),
      sender_notes: optionalStringArb(1000),
      receiver_notes: optionalStringArb(1000),
      handler_notes: optionalStringArb(1000),
      handler_number: optionalStringArb(50),
      notes: optionalStringArb(1000),
      files: jsonMetadataArb,
      tags: jsonMetadataArb,
      links: jsonMetadataArb,
      status: fc.option(statusArb, { nil: undefined }),
    },
    { requiredKeys: [] },
  );

/**
 * Arbitrary for GetManyTransactionsProps
 */
const getManyPropsArb: fc.Arbitrary<GetManyTransactionsProps> = fc.record({
  page: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  search: optionalStringArb(100),
  sort: fc.option(
    fc.constantFrom("id", "total", "created_at", "sent_time", "received_time"),
    { nil: undefined },
  ),
  order: fc.option(fc.constantFrom("asc", "desc"), { nil: undefined }),
  status: fc.option(statusArb, { nil: undefined }),
  model_type: fc.option(polymorphicTypeArb, { nil: undefined }),
  sender_id: optionalNumberArb,
  receiver_id: optionalNumberArb,
  handler_id: optionalNumberArb,
  sent_time_from: optionalDateArb,
  sent_time_to: optionalDateArb,
  received_time_from: optionalDateArb,
  received_time_to: optionalDateArb,
});

export {
  addressArb,
  createTransactionArb,
  getManyPropsArb,
  jsonMetadataArb,
  numericStringArb,
  optionalDateArb,
  optionalNumberArb,
  optionalStringArb,
  partialTransactionArb,
  polymorphicRelationshipArb,
  polymorphicTypeArb,
  statusArb,
  transactionEntityArb,
  typeTypeArb,
};
