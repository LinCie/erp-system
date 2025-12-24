# Transaction Module

The Transaction module provides a comprehensive system for managing business
transactions with support for line items (details), polymorphic relationships,
automatic total calculation, and status management.

## Overview

This module implements a flexible transaction system that can represent various
business operations such as sales orders, purchase orders, quotes, invoices, and
more. Each transaction can contain multiple line items (transaction details)
with automatic total calculation and support for both inventory and accounting
operations.

## Features

- **Transaction Details**: Support for multiple line items per transaction with
  quantity, price, discount, and weight
- **Polymorphic Relationships**: Link transactions to different entity types
  (players, persons, groups, items, etc.)
- **Automatic Total Calculation**: Totals are automatically calculated from
  transaction details
- **Number Generation**: Unique transaction numbers following the pattern
  `{type_type}_{id}`
- **Status Management**: Track transaction lifecycle with status values
- **JSON Metadata**: Store flexible additional information (files, tags, links,
  addresses)
- **Accounting Support**: Debit/credit fields for financial accounting
  integration
- **Atomic Updates**: Update transactions and details together in a single
  operation
- **Advanced Filtering**: Query transactions by status, date range, parties, and
  more

## Architecture

The module follows Clean Architecture with four layers:

```
transaction/
├── domain/                    # Entities (business objects)
│   ├── transaction.entity.ts
│   └── transaction-detail.entity.ts
├── application/               # Use cases and interfaces
│   ├── transaction-repository.interface.ts
│   ├── transaction-detail-repository.interface.ts
│   └── transaction.service.ts
├── infrastructure/            # External implementations
│   ├── transaction.mapper.ts
│   ├── transaction-detail.mapper.ts
│   ├── transaction.repository.ts
│   └── transaction-detail.repository.ts
└── presentation/              # API layer
    ├── transaction.controller.ts
    ├── transaction.module.ts
    ├── routes/
    ├── validators/
    └── schemas/
```

## Entities

### TransactionEntity

Represents a business transaction between parties.

**Key Fields:**

- **Identification**: `id`, `number`, `class`
- **Polymorphic Relationships**: `sender_type/id`, `receiver_type/id`,
  `handler_type/id`, `input_type/id`, `output_type/id`, `parent_type/id`,
  `relation_type/id`, `space_type/id`, `model_type/id`, `type_type/id`
- **Financial**: `total`, `total_details`, `fee`, `fee_rules` (all stored as
  strings for decimal precision)
- **Timestamps**: `request_time`, `sent_time`, `received_time`, `created_at`,
  `updated_at`, `deleted_at`
- **Notes**: `description`, `sender_notes`, `receiver_notes`, `handler_notes`,
  `handler_number`, `notes`
- **Metadata**: `files`, `tags`, `links` (JSON arrays), `input_address`,
  `output_address` (JSON objects)
- **Status**: Inherited from BaseEntity (e.g., 'TX_DRAFT', 'TX_SENT',
  'TX_RECEIVED', 'TX_CLOSED')

### TransactionDetailEntity

Represents a line item within a transaction.

**Key Fields:**

- **Foreign Key**: `transaction_id` (required)
- **Polymorphic Relationships**: `detail_type/id`, `model_type/id`
- **Item Information**: `sku`, `name`, `code` (denormalized for historical
  tracking)
- **Quantities and Pricing**: `quantity`, `price`, `discount`, `weight`,
  `cost_per_unit` (all stored as strings)
- **Accounting**: `debit`, `credit` (stored as strings)
- **Additional Data**: `data` (JSON), `notes`

## API Endpoints

### Get Many Transactions

```http
GET /transactions?page=1&limit=10&status=TX_DRAFT&model_type=SO
```

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status
- `model_type` (string, optional): Filter by model type
- `sender_id` (number, optional): Filter by sender
- `receiver_id` (number, optional): Filter by receiver
- `handler_id` (number, optional): Filter by handler
- `sent_time_from` (date, optional): Filter by sent date range start
- `sent_time_to` (date, optional): Filter by sent date range end
- `received_time_from` (date, optional): Filter by received date range start
- `received_time_to` (date, optional): Filter by received date range end
- `sort` (string, optional): Sort field
- `order` (string, optional): Sort order ('asc' or 'desc')

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "number": "SO_1",
      "status": "TX_DRAFT",
      "total": "150.00",
      "total_details": "150.00",
      "sender_type": "Player",
      "sender_id": 5,
      "receiver_type": "Person",
      "receiver_id": 10,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### Get One Transaction

```http
GET /transactions/{id}?includeDetails=true
```

**Query Parameters:**

- `includeDetails` (boolean, optional): Include transaction details in response
  (default: false)

**Response (with details):**

```json
{
  "id": 1,
  "number": "SO_1",
  "status": "TX_DRAFT",
  "total": "150.00",
  "total_details": "150.00",
  "sender_type": "Player",
  "sender_id": 5,
  "receiver_type": "Person",
  "receiver_id": 10,
  "details": [
    {
      "id": 1,
      "transaction_id": 1,
      "sku": "ITEM-001",
      "name": "Product A",
      "quantity": "2.00",
      "price": "50.00",
      "discount": "0.00",
      "debit": "2.00",
      "credit": "0.00"
    },
    {
      "id": 2,
      "transaction_id": 1,
      "sku": "ITEM-002",
      "name": "Product B",
      "quantity": "1.00",
      "price": "50.00",
      "discount": "0.00",
      "debit": "1.00",
      "credit": "0.00"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Create Transaction

```http
POST /transactions
```

**Request Body:**

```json
{
  "type_type": "SO",
  "sender_type": "Player",
  "sender_id": 5,
  "receiver_type": "Person",
  "receiver_id": 10,
  "status": "TX_DRAFT",
  "total": "0.00",
  "fee": "0.00",
  "description": "Sales order for customer"
}
```

**Response:** Returns the created transaction with generated `id` and `number`.

### Update Transaction

```http
PATCH /transactions/{id}
```

**Request Body:**

```json
{
  "status": "TX_SENT",
  "sent_time": "2024-01-02T10:00:00Z",
  "sender_notes": "Shipped via express delivery"
}
```

**Response:** Returns the updated transaction.

### Update Transaction with Details

```http
PUT /transactions/{id}/with-details
```

This endpoint performs an atomic update of both the transaction and its details.
All existing details are deleted and replaced with the new details provided.
Totals are automatically recalculated.

**Request Body:**

```json
{
  "transaction": {
    "status": "TX_SENT",
    "sent_time": "2024-01-02T10:00:00Z"
  },
  "details": [
    {
      "sku": "ITEM-001",
      "name": "Product A",
      "quantity": "3.00",
      "price": "50.00",
      "discount": "0.10",
      "cost_per_unit": "30.00",
      "debit": "3.00",
      "credit": "0.00"
    },
    {
      "sku": "ITEM-002",
      "name": "Product B",
      "quantity": "2.00",
      "price": "75.00",
      "discount": "0.00",
      "cost_per_unit": "45.00",
      "debit": "2.00",
      "credit": "0.00"
    }
  ]
}
```

**Response:** Returns the updated transaction with recalculated totals.

**Important Notes:**

- All operations are performed within a database transaction
- If any error occurs, all changes are rolled back
- Old details are soft-deleted (deleted_at is set)
- Totals are automatically recalculated from the new details
- Cannot update transactions with status 'TX_CLOSED'

### Delete Transaction

```http
DELETE /transactions/{id}
```

Performs a soft delete by setting `status` to 'archived' and `deleted_at`
timestamp. All associated transaction details are also soft-deleted.

**Response:** 204 No Content

## Business Logic

### Total Calculation

Totals are automatically calculated from transaction details using the formula:

```
detail_amount = quantity × price × (1 - discount)
total = sum of all detail_amounts
total_details = sum of detail_amounts excluding model_type 'BILL' and 'PAY'
```

**Example:**

```typescript
// Detail 1: quantity=2, price=50, discount=0.10
// Amount = 2 × 50 × (1 - 0.10) = 90.00

// Detail 2: quantity=1, price=100, discount=0.00
// Amount = 1 × 100 × (1 - 0.00) = 100.00

// Total = 90.00 + 100.00 = 190.00
```

### Number Generation

Transaction numbers are automatically generated after creation following the
pattern:

```
{type_type}_{id}
```

**Examples:**

- `SO_123` (Sales Order with id=123)
- `PO_456` (Purchase Order with id=456)
- `TX_789` (Generic transaction with id=789, default type_type)

Numbers are only generated if not provided during creation and are never
overwritten on updates.

### Debit/Credit Calculation

For accounting integration, debit and credit fields are calculated based on
quantity:

- **Positive quantity**: `debit = quantity`, `credit = 0`
- **Negative quantity**: `debit = 0`, `credit = abs(quantity)`

This allows transactions to be used for both inventory movements and financial
accounting.

### Status Management

Transactions follow a lifecycle tracked by the `status` field:

- `TX_DRAFT`: Initial state, can be modified
- `TX_SENT`: Transaction has been sent
- `TX_RECEIVED`: Transaction has been received
- `TX_CLOSED`: Terminal state, cannot be modified

Attempting to update a transaction with status `TX_CLOSED` will result in an
error.

## Usage Examples

### Creating a Sales Order with Details

```typescript
// 1. Create the transaction
const transaction = await transactionService.create({
  type_type: "SO",
  sender_type: "Player",
  sender_id: 5,
  receiver_type: "Person",
  receiver_id: 10,
  status: "TX_DRAFT",
  total: "0.00",
  fee: "0.00",
});

// 2. Add details using updateWithDetails
const updated = await transactionService.updateWithDetails(
  transaction.id,
  { status: "TX_DRAFT" },
  [
    {
      sku: "ITEM-001",
      name: "Product A",
      quantity: "2.00",
      price: "50.00",
      discount: "0.00",
      cost_per_unit: "30.00",
      debit: "2.00",
      credit: "0.00",
    },
    {
      sku: "ITEM-002",
      name: "Product B",
      quantity: "1.00",
      price: "50.00",
      discount: "0.00",
      cost_per_unit: "30.00",
      debit: "1.00",
      credit: "0.00",
    },
  ],
);

// Total is automatically calculated: 150.00
console.log(updated.total); // "150.00"
console.log(updated.number); // "SO_1"
```

### Querying Transactions with Filters

```typescript
// Get all draft sales orders for a specific sender
const result = await transactionService.getMany({
  status: "TX_DRAFT",
  model_type: "SO",
  sender_id: 5,
  page: 1,
  limit: 20,
  sort: "created_at",
  order: "desc",
});

console.log(result.data); // Array of transactions
console.log(result.metadata.totalItems); // Total count
```

### Retrieving Transaction with Details

```typescript
// Get transaction with all details included
const transaction = await transactionService.getOne(1, true);

console.log(transaction.details); // Array of transaction details
console.log(transaction.total); // Calculated total
```

### Updating Transaction Status

```typescript
// Update transaction status and add notes
const updated = await transactionService.update(1, {
  status: "TX_SENT",
  sent_time: new Date(),
  sender_notes: "Shipped via express delivery",
});
```

### Atomic Update with Details

```typescript
// Update transaction and replace all details atomically
const updated = await transactionService.updateWithDetails(
  1,
  {
    status: "TX_SENT",
    sent_time: new Date(),
  },
  [
    {
      sku: "ITEM-001",
      name: "Product A (Updated)",
      quantity: "3.00",
      price: "55.00",
      discount: "0.05",
      cost_per_unit: "32.00",
      debit: "3.00",
      credit: "0.00",
    },
  ],
);

// Old details are deleted, new details are created, totals recalculated
```

## Data Types

### Decimal Fields

All monetary and quantity fields are stored as strings to maintain precision:

- `total`, `total_details`, `fee`
- `quantity`, `price`, `discount`, `weight`, `cost_per_unit`
- `debit`, `credit`

**Example:**

```typescript
const detail = {
  quantity: "2.50", // Not 2.5 (number)
  price: "19.99", // Not 19.99 (number)
  discount: "0.10", // Not 0.1 (number)
};
```

### Optional Fields

Optional fields use TypeScript's optional syntax (`?`) and are `undefined` when
not set:

```typescript
interface TransactionEntity {
  description?: string; // undefined when not set
  sender_notes?: string; // undefined when not set
}
```

In the database, these are stored as `NULL`, but the mapper converts between
`NULL` and `undefined`.

### JSON Fields

JSON fields are typed appropriately:

```typescript
interface TransactionEntity {
  files?: string[]; // Array of file URLs
  tags?: string[]; // Array of tags
  links?: string[]; // Array of links
  input_address?: Record<string, unknown>; // Address object
  output_address?: Record<string, unknown>; // Address object
}

interface TransactionDetailEntity {
  data?: Record<string, unknown>; // Flexible JSON data
}
```

## Error Handling

### Common Errors

- `TRANSACTION_NOT_FOUND`: Transaction with specified ID does not exist
- `TRANSACTION_DETAIL_NOT_FOUND`: Transaction detail with specified ID does not
  exist
- `TRANSACTION_CLOSED`: Cannot modify a transaction with status 'TX_CLOSED'
- `TRANSACTION_CREATE_FAILED`: Failed to create transaction
- `TRANSACTION_UPDATE_FAILED`: Failed to update transaction
- `INVALID_TRANSACTION_STATUS`: Invalid status value provided
- `INVALID_TRANSACTION_DETAIL`: Invalid detail data provided
- `TOTAL_CALCULATION_FAILED`: Error calculating totals
- `NUMBER_GENERATION_FAILED`: Error generating transaction number

### Error Responses

```json
{
  "error": "TRANSACTION_NOT_FOUND",
  "message": "Transaction with id 999 not found"
}
```

## Testing

The module includes comprehensive test coverage:

- **Unit Tests**: Service layer delegation and business logic
- **Property-Based Tests**: Correctness properties verified with fast-check
- **Integration Tests**: Repository operations with real database

### Running Tests

```bash
deno task test:transaction
```

## Dependencies

- **Hono**: Web framework and routing
- **Kysely**: Type-safe SQL query builder
- **Zod**: Schema validation
- **MySQL**: Database storage

## Related Modules

- **Item Module**: Transaction details can reference items
- **Space Module**: Transactions can be scoped to spaces
- **Player/Person Modules**: Transactions can have players/persons as parties

## Migration Notes

When migrating from the Laravel implementation:

1. All decimal fields are strings in TypeScript (not numbers)
2. Optional fields use `undefined` (not `null`)
3. JSON fields are properly typed (not generic objects)
4. Soft deletes set both `status: 'archived'` and `deleted_at`
5. The `updateWithDetails` operation is atomic (uses database transactions)

## Future Enhancements

Potential future improvements:

- Transaction templates for common transaction types
- Workflow automation based on status changes
- Approval workflows for high-value transactions
- Integration with external accounting systems
- Batch transaction processing
- Transaction reversal/cancellation support
