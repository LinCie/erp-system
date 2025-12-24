# Design Document

## Overview

This design enhances the Deno transaction module to support complex business transactions with line items (details), polymorphic relationships, automatic total calculation, and status management. The design follows Clean Architecture principles and matches the functionality of the Laravel transaction system while maintaining TypeScript type safety and the existing Deno module patterns.

The enhancement adds a new TransactionDetail entity and updates the Transaction entity to include all fields from the database schema. The repository layer will handle cascading operations for details, and the service layer will provide business logic for total calculation and number generation.

## Architecture

The module follows Clean Architecture with four layers:

```
transaction/
├── domain/                    # Entities (business objects)
│   ├── transaction.entity.ts
│   └── transaction-detail.entity.ts (NEW)
├── application/               # Use cases and interfaces
│   ├── transaction-repository.interface.ts
│   ├── transaction-detail-repository.interface.ts (NEW)
│   └── transaction.service.ts
├── infrastructure/            # External implementations
│   ├── transaction.mapper.ts
│   ├── transaction-detail.mapper.ts (NEW)
│   ├── transaction.repository.ts
│   └── transaction-detail.repository.ts (NEW)
└── presentation/              # API layer
    ├── transaction.controller.ts
    ├── routes/
    ├── validators/
    └── schemas/
```

### Key Design Decisions

1. **Separate Detail Entity**: TransactionDetail is a separate entity with its own repository for flexibility
2. **Cascading Operations**: Transaction repository handles detail operations to maintain consistency
3. **Mapper Responsibility**: Mappers handle type conversions (string decimals, null/undefined, JSON parsing)
4. **Service Layer Logic**: Business logic (totals, number generation) lives in the service layer
5. **Database Transactions**: Use Kysely transactions for atomic updates

## Components and Interfaces

### Domain Layer

#### TransactionEntity

```typescript
interface TransactionEntity extends BaseEntity {
  // Identification
  number?: string;
  class?: string;
  
  // Polymorphic Relationships (type + id pattern)
  space_type?: string;
  space_id?: number;
  model_type?: string;
  model_id?: number;
  type_type?: string;
  type_id?: number;
  
  // Transaction Parties
  sender_type?: string;
  sender_id?: number;
  receiver_type?: string;
  receiver_id?: number;
  handler_type?: string;
  handler_id?: number;
  
  // Transaction Flow
  input_type?: string;
  input_id?: number;
  output_type?: string;
  output_id?: number;
  parent_type?: string;
  parent_id?: number;
  relation_type?: string;
  relation_id?: number;
  
  // Addresses (JSON)
  input_address?: Record<string, unknown>;
  output_address?: Record<string, unknown>;
  
  // Timestamps
  request_time?: Date;
  sent_time?: Date;
  received_time?: Date;
  
  // Financial
  total: string; // Decimal as string - required
  total_details?: string; // Decimal as string
  fee: string; // Decimal as string - required
  fee_rules?: string;
  
  // Notes
  description?: string;
  sender_notes?: string;
  receiver_notes?: string;
  handler_notes?: string;
  handler_number?: string;
  notes?: string;
  
  // Metadata (JSON)
  files?: string[];
  tags?: string[];
  links?: string[];
  
  // Inherited from BaseEntity: id, status, created_at, updated_at, deleted_at
}
```

#### TransactionDetailEntity

```typescript
interface TransactionDetailEntity extends BaseEntity {
  // Foreign Key
  transaction_id: number; // Required - foreign key
  
  // Polymorphic Relationships
  detail_type?: string;
  detail_id?: number;
  model_type?: string;
  model_id?: number;
  
  // Item Information (denormalized for history)
  sku?: string;
  name?: string;
  code?: string;
  
  // Quantities and Pricing
  quantity: string; // Decimal as string - required
  price: string; // Decimal as string - required
  discount: string; // Decimal as string - required
  weight?: string; // Decimal as string
  cost_per_unit: string; // Decimal as string - required
  
  // Accounting
  debit: string; // Decimal as string - required
  credit: string; // Decimal as string - required
  
  // Additional Data
  data?: Record<string, unknown>; // JSON
  notes?: string;
  
  // Inherited from BaseEntity: id, status, created_at, updated_at, deleted_at
}
```

### Application Layer

#### ITransactionRepository

```typescript
interface ITransactionRepository {
  getMany(props: GetManyTransactionsProps): Promise<GetManyTransactionsReturn>;
  getOne(id: number, includeDetails?: boolean): Promise<Transaction>;
  create(data: Omit<Transaction, "id">): Promise<Transaction>;
  update(id: number, data: Partial<Transaction>): Promise<Transaction>;
  updateWithDetails(
    id: number,
    transaction: Partial<Transaction>,
    details: Omit<TransactionDetail, "id" | "transaction_id">[]
  ): Promise<Transaction>;
  delete(id: number): Promise<void>;
  generateNumber(transaction: Transaction): string;
  calculateTotals(details: TransactionDetail[]): { total: string; total_details: string };
}

type GetManyTransactionsProps = GetManyPropsType & {
  status?: string;
  model_type?: string;
  sender_id?: number;
  receiver_id?: number;
  handler_id?: number;
  sent_time_from?: Date;
  sent_time_to?: Date;
  received_time_from?: Date;
  received_time_to?: Date;
};
```

#### ITransactionDetailRepository

```typescript
interface ITransactionDetailRepository {
  getMany(transaction_id: number): Promise<TransactionDetail[]>;
  getOne(id: number): Promise<TransactionDetail>;
  create(data: Omit<TransactionDetail, "id">): Promise<TransactionDetail>;
  createMany(data: Omit<TransactionDetail, "id">[]): Promise<TransactionDetail[]>;
  update(id: number, data: Partial<TransactionDetail>): Promise<TransactionDetail>;
  delete(id: number): Promise<void>;
  deleteByTransactionId(transaction_id: number): Promise<void>;
}
```

#### TransactionService

```typescript
class TransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly transactionDetailRepository: ITransactionDetailRepository
  ) {}

  async getMany(props: GetManyTransactionsProps);
  async getOne(id: number, includeDetails?: boolean);
  async create(data: Omit<Transaction, "id">);
  async update(id: number, data: Partial<Transaction>);
  async updateWithDetails(
    id: number,
    transaction: Partial<Transaction>,
    details: Omit<TransactionDetail, "id" | "transaction_id">[]
  );
  async delete(id: number);
}
```

## Data Models

### Database Schema

The database schema already exists and matches the Laravel implementation:

**transactions table:**
- Primary key: `id`
- Polymorphic fields: `*_type` and `*_id` pairs for relationships
- Decimal fields: `total`, `total_details`, `fee` (stored as strings in TypeScript)
- JSON fields: `input_address`, `output_address`, `files`, `tags`, `links`
- Timestamps: `request_time`, `sent_time`, `received_time`, `created_at`, `updated_at`, `deleted_at`
- Status: `status` with default 'TX_DRAFT'

**transaction_details table:**
- Primary key: `id`
- Foreign key: `transaction_id` (cascades on delete)
- Polymorphic fields: `detail_type/id`, `model_type/id`
- Decimal fields: `quantity`, `price`, `discount`, `weight`, `cost_per_unit`, `debit`, `credit`
- JSON field: `data`
- Item fields: `sku`, `name`, `code` (denormalized for history)

### Type Conversions

| Database Type | TypeScript Type | Notes |
|---------------|----------------|-------|
| DECIMAL | string | MySQL decimals map to strings to avoid precision loss |
| JSON | Record<string, unknown> or string[] | Parsed in mapper |
| DATETIME | Date | Converted by Kysely |
| NULL | undefined | Database nulls become undefined in entities |
| undefined | NULL | Entity undefined becomes null in database |

**Mapper Rules:**
- `undefined` → `null` when going to database (toInsertable, toUpdateable)
- `null` → `undefined` when coming from database (toEntity)
- JSON strings → parsed objects/arrays (toEntity)
- Objects/arrays → JSON strings (toInsertable)
- **Primary mapper responsibility**: Handle the impedance mismatch between TypeScript's `undefined` (for optional fields) and SQL's `NULL` (for missing values)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Total calculation consistency
*For any* set of transaction details, calculating the total as sum of (quantity × price × (1 - discount)) should equal the stored transaction total after an update
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: Detail cascade deletion
*For any* transaction, when the transaction is soft deleted, all associated details should also be soft deleted
**Validates: Requirements 1.5**

### Property 3: Number generation uniqueness
*For any* transaction without a number, after calling generateNumber(), the number should follow the pattern `{type_type}_{id}` and be unique
**Validates: Requirements 4.1, 4.2**

### Property 4: Number preservation
*For any* transaction with an existing number, updating the transaction should not change the number
**Validates: Requirements 4.3, 4.4**

### Property 5: Debit/credit calculation
*For any* transaction detail with positive quantity, debit should equal quantity and credit should be zero; for negative quantity, credit should equal absolute value and debit should be zero
**Validates: Requirements 7.2, 7.3**

### Property 6: Update atomicity
*For any* transaction update with details, if an error occurs, all changes (transaction and details) should be rolled back
**Validates: Requirements 8.4, 8.5**

### Property 7: Detail deletion before update
*For any* transaction being updated with new details, all existing details should be deleted before new details are created
**Validates: Requirements 8.1, 8.2**

### Property 8: Total_details exclusion
*For any* transaction, total_details should exclude details with model_type 'BILL' or 'PAY', but total should include all details
**Validates: Requirements 2.5**

### Property 9: JSON field round-trip
*For any* transaction with JSON fields (files, tags, links, addresses), serializing then deserializing should produce equivalent data
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 10: Item information preservation
*For any* transaction detail, the stored sku, name, and code should remain unchanged even if the referenced item entity is modified or deleted
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Repository Layer Errors

```typescript
// Transaction not found
throw new Error("TRANSACTION_NOT_FOUND");

// Transaction detail not found
throw new Error("TRANSACTION_DETAIL_NOT_FOUND");

// Failed to create transaction
throw new Error("TRANSACTION_CREATE_FAILED");

// Failed to update transaction
throw new Error("TRANSACTION_UPDATE_FAILED");

// Database transaction rollback
throw new Error("TRANSACTION_ROLLBACK_FAILED");

// Invalid transaction status
throw new Error("INVALID_TRANSACTION_STATUS");
```

### Service Layer Errors

```typescript
// Cannot modify closed transaction
throw new Error("TRANSACTION_CLOSED");

// Invalid detail data
throw new Error("INVALID_TRANSACTION_DETAIL");

// Total calculation error
throw new Error("TOTAL_CALCULATION_FAILED");

// Number generation error
throw new Error("NUMBER_GENERATION_FAILED");
```

### Validation Errors

- Missing required fields (transaction_id for details)
- Invalid decimal format for amounts
- Invalid JSON format for metadata fields
- Invalid status value
- Invalid polymorphic type values

## Testing Strategy

### Unit Tests

**TransactionService Tests:**
- Test getMany delegates to repository with correct props
- Test getOne retrieves transaction with/without details
- Test create delegates to repository
- Test update delegates to repository
- Test updateWithDetails calls repository with transaction and details
- Test delete delegates to repository
- Test error propagation from repository

**TransactionDetailService Tests:**
- Test getMany retrieves all details for a transaction
- Test create adds a detail
- Test createMany adds multiple details
- Test delete removes a detail
- Test deleteByTransactionId removes all details for a transaction

### Property-Based Tests

**Property 1: Total Calculation Consistency**
- Generate random transaction details with quantity, price, discount
- Calculate expected total: sum of (quantity × price × (1 - discount))
- Call calculateTotals() and verify result matches expected
- Run 100+ iterations with different detail combinations

**Property 2: Detail Cascade Deletion**
- Generate random transaction with random number of details
- Soft delete the transaction
- Verify all details have deleted_at set
- Verify transaction has deleted_at set

**Property 3: Number Generation Uniqueness**
- Generate random transactions without numbers
- Call generateNumber() on each
- Verify all numbers follow pattern `{type_type}_{id}`
- Verify all numbers are unique

**Property 4: Number Preservation**
- Generate random transaction with existing number
- Update transaction with random data
- Verify number remains unchanged

**Property 5: Debit/Credit Calculation**
- Generate random transaction details with positive and negative quantities
- For positive quantity: verify debit = quantity, credit = 0
- For negative quantity: verify credit = abs(quantity), debit = 0

**Property 6: Update Atomicity**
- Generate random transaction with details
- Simulate error during detail creation
- Verify transaction changes are rolled back
- Verify no orphaned details exist

**Property 7: Detail Deletion Before Update**
- Create transaction with random details
- Update with new set of random details
- Verify old details are deleted (soft delete)
- Verify new details exist

**Property 8: Total_details Exclusion**
- Generate details with mix of model_types including 'BILL' and 'PAY'
- Calculate totals
- Verify total includes all details
- Verify total_details excludes 'BILL' and 'PAY'

**Property 9: JSON Field Round-trip**
- Generate random JSON data for files, tags, links, addresses
- Create transaction with JSON data
- Retrieve transaction
- Verify JSON data matches original

**Property 10: Item Information Preservation**
- Create transaction detail with item info (sku, name, code)
- Modify or delete the referenced item
- Retrieve transaction detail
- Verify item info unchanged

### Integration Tests

- Test creating transaction with details in single operation
- Test updating transaction and details together
- Test retrieving transaction with details included
- Test soft deleting transaction cascades to details
- Test filtering transactions by various criteria
- Test total calculation with real database data
- Test number generation with real database sequences

### Test Framework

- **Unit Tests**: Deno.test with mock repositories
- **Property Tests**: fast-check library (100+ iterations per property)
- **Integration Tests**: Deno.test with real database (test database)

### Test Data

**Fixtures:**
- Valid transaction with all fields
- Minimal transaction with required fields only
- Transaction with multiple details
- Transaction with JSON metadata
- Archived transaction

**Arbitraries (for property tests):**
- Transaction entity arbitrary
- Transaction detail entity arbitrary
- Decimal string arbitrary (for amounts)
- JSON metadata arbitrary
- Polymorphic relationship arbitrary
- Status value arbitrary

### Coverage Goals

- Unit test coverage: 90%+ for service layer
- Property test coverage: All 10 correctness properties
- Integration test coverage: All CRUD operations and complex workflows
- Edge case coverage: Empty details, null values, boundary amounts
