# Design Document: Trade Module

## Overview

The Trade Module provides a REST API for managing trade transactions in the Deno/Hono backend. It replicates the functionality of the Laravel TradeController and TradeService, following Clean Architecture principles with domain, application, infrastructure, and presentation layers.

The module handles CRUD operations for trades with support for trade details (line items), filtering, pagination, status management, and automatic calculations for totals and debit/credit values.

## Architecture

The module follows the established Clean Architecture pattern used in the existing item module:

```
src/modules/trade/
├── domain/                    # Entities and business rules
│   ├── trade.entity.ts
│   └── trade-detail.type.ts
├── application/               # Use cases and interfaces
│   ├── trade-repository.interface.ts
│   └── trade.service.ts
├── infrastructure/            # External implementations
│   ├── trade.mapper.ts
│   └── trade.repository.ts
└── presentation/              # Controllers, routes, validators
    ├── trade.controller.ts
    ├── trade.module.ts
    ├── routes/
    │   ├── get-many-trades.route.ts
    │   ├── get-one-trade.route.ts
    │   ├── create-trade.route.ts
    │   ├── update-trade.route.ts
    │   └── delete-trade.route.ts
    ├── schemas/
    │   ├── trade-response.schema.ts
    │   └── error-response.schema.ts
    └── validators/
        ├── trade-id-param.validator.ts
        ├── create-trade-body.validator.ts
        ├── update-trade-body.validator.ts
        └── get-many-trades-query.validator.ts
```

### Dependency Flow

```
Presentation → Application → Domain
      ↓
Infrastructure (implements Application interfaces)
```

## Components and Interfaces

### Domain Layer

#### TradeEntity

```typescript
interface TradeDetailType {
  id: number;
  item_id?: number;
  model_type: string;
  sku?: string;
  name?: string;
  quantity: string;
  price: string;
  discount: string;
  weight: string;
  debit: string;
  credit: string;
  notes?: string;
}

interface TradeEntity extends Omit<BaseEntity, "status"> {
  number: string;
  space_id: number;
  status: string;
  total: string;
  sent_time?: Date;
  received_time?: Date;
  sender_id?: number;
  receiver_id?: number;
  handler_id?: number;
  parent_id?: number;
  sender_notes?: string;
  receiver_notes?: string;
  handler_notes?: string;
  description?: string;
  fee?: string;
  files?: FileType[];
  tags?: string[];
  links?: LinkType[];
  details?: TradeDetailType[];
}
```

### Application Layer

#### ITradeRepository Interface

```typescript
type GetManyTradesProps = GetManyPropsType & {
  spaceId: number;
  modelType?: string;
  withDetails?: boolean;
};

type GetManyTradesReturn = {
  data: Trade[];
  metadata: GetManyMetadataType;
};

type GetOneTradeProps = {
  id: number;
  withDetails?: boolean;
};

interface ITradeRepository {
  getMany(props: GetManyTradesProps): Promise<GetManyTradesReturn>;
  getOne(props: GetOneTradeProps): Promise<Trade>;
  create(data: CreateTradeData): Promise<Trade>;
  update(id: number, data: UpdateTradeData): Promise<Trade>;
  delete(id: number): Promise<void>;
}
```

#### TradeService

```typescript
class TradeService {
  constructor(private readonly tradeRepository: ITradeRepository) {}

  async getMany(props: GetManyTradesProps): Promise<GetManyTradesReturn>;
  async getOne(props: GetOneTradeProps): Promise<Trade>;
  async create(data: CreateTradeData): Promise<Trade>;
  async update(id: number, data: UpdateTradeData): Promise<Trade>;
  async delete(id: number): Promise<void>;
}
```

### Infrastructure Layer

#### TradeMapper

Transforms between entity and database row:
- `toInsertable(entity)`: Converts entity to database insertable format
- `toUpdateable(entity)`: Converts partial entity to database updateable format
- `toEntity(row)`: Converts database row to entity
- `detailToInsertable(detail)`: Converts detail to database insertable format
- `detailToEntity(row)`: Converts detail row to entity

#### TradeRepository

Implements `ITradeRepository` using Kysely:
- Handles polymorphic type fields internally (space_type='SPACE', model_type='TRD', sender_type='PLAY', etc.)
- Joins with transaction_details table for details
- Calculates total from details: `sum(quantity * price * (1 - discount))`
- Calculates debit/credit: `debit = quantity >= 0 ? quantity : 0`, `credit = quantity < 0 ? abs(quantity) : 0`
- Auto-generates number: `TRD_{id}`
- Soft delete with deleted_at timestamp

### Presentation Layer

#### API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /trades | List trades with pagination | JWT |
| GET | /trades/{id} | Get single trade | JWT |
| POST | /trades | Create new trade | JWT |
| PUT | /trades/{id} | Update trade | JWT |
| DELETE | /trades/{id} | Soft delete trade | JWT |

#### Request/Response Schemas

**GetManyTradesQuery:**
```typescript
{
  spaceId: number;          // Required
  page?: number;            // Default: 1
  limit?: number;           // Default: 10
  status?: string;          // Filter by status
  modelType?: string;       // Filter by detail model_type
  search?: string;          // Search in number, notes, status
  sort?: string;            // Sort field
  order?: 'asc' | 'desc';   // Sort direction
}
```

**CreateTradeBody:**
```typescript
{
  space_id: number;         // Required
  sender_id: number;        // Required
  sent_time?: string;       // ISO date string
  sender_notes?: string;
  number?: string;          // Auto-generated if not provided
}
```

**UpdateTradeBody:**
```typescript
{
  handler_id: number;       // Required
  sent_time?: string;
  received_time?: string;
  receiver_id?: number;
  receiver_notes?: string;
  handler_notes?: string;
  description?: string;
  status?: string;
  parent_id?: number;
  files?: FileType[];
  tags?: string[];
  links?: LinkType[];
  details?: TradeDetailInput[];
}
```

**TradeDetailInput:**
```typescript
{
  item_id: number;          // Required
  model_type: string;       // Required (SO, PO, BILL, PAY, etc.)
  quantity: string;         // Required
  price: string;            // Required
  discount?: string;        // Default: "0"
  weight?: string;          // Default: "0"
  sku?: string;
  name?: string;
  notes?: string;
}
```

## Data Models

### Database Schema (transactions table)

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| number | varchar | Trade number (auto-generated) |
| space_type | varchar | Always 'SPACE' |
| space_id | bigint | Space foreign key |
| model_type | varchar | Always 'TRD' for trades |
| sender_type | varchar | Always 'PLAY' |
| sender_id | bigint | Sender player ID |
| receiver_type | varchar | Always 'PLAY' |
| receiver_id | bigint | Receiver player ID |
| handler_type | varchar | Always 'PLAY' |
| handler_id | bigint | Handler player ID |
| parent_type | varchar | 'TX' if has parent |
| parent_id | bigint | Parent transaction ID |
| sent_time | datetime | When trade was sent |
| received_time | datetime | When trade was received |
| total | decimal(30,2) | Calculated total |
| fee | decimal(20,2) | Fee amount |
| description | text | Trade description |
| sender_notes | text | Sender notes |
| receiver_notes | text | Receiver notes |
| handler_notes | text | Handler notes |
| status | varchar | Trade status |
| files | json | Attached files |
| tags | json | Tags array |
| links | json | Links array |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Update timestamp |
| deleted_at | datetime | Soft delete timestamp |

### Database Schema (transaction_details table)

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| transaction_id | bigint | Foreign key to transactions |
| detail_type | varchar | Always 'ITM' |
| detail_id | bigint | Item ID |
| model_type | varchar | Detail type (SO, PO, etc.) |
| sku | varchar | Item SKU |
| name | varchar | Item name |
| quantity | decimal(20,2) | Quantity |
| price | decimal(20,2) | Unit price |
| discount | decimal(20,2) | Discount rate (0-1) |
| weight | decimal(20,2) | Weight |
| debit | decimal(25,2) | Debit amount |
| credit | decimal(25,2) | Credit amount |
| notes | varchar | Detail notes |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Update timestamp |
| deleted_at | datetime | Soft delete timestamp |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Space Filtering Consistency

*For any* spaceId provided in a getMany request, all returned trades SHALL have space_id equal to the provided spaceId.

**Validates: Requirements 1.1**

### Property 2: Status Filtering Consistency

*For any* status value provided in a getMany request, all returned trades SHALL have status equal to the provided status value.

**Validates: Requirements 1.2**

### Property 3: Model Type Filtering Consistency

*For any* modelType value provided in a getMany request, all returned trades SHALL have at least one detail with model_type equal to the provided modelType value.

**Validates: Requirements 1.3**

### Property 4: Search Results Relevance

*For any* search term provided in a getMany request, all returned trades SHALL contain the search term in at least one of: number, sender_notes, receiver_notes, handler_notes, or status.

**Validates: Requirements 1.4**

### Property 5: Pagination Correctness

*For any* page and limit values provided in a getMany request, the number of returned trades SHALL be at most equal to the limit, and the metadata SHALL correctly reflect totalItems, totalPages, currentPage, and itemsPerPage.

**Validates: Requirements 1.5, 1.7**

### Property 6: Sorting Correctness

*For any* sort field and order direction provided in a getMany request, the returned trades SHALL be ordered by the specified field in the specified direction.

**Validates: Requirements 1.6**

### Property 7: Trade Retrieval Identity

*For any* valid trade ID, the getOne operation SHALL return a trade with id equal to the requested ID.

**Validates: Requirements 2.1**

### Property 8: Soft Delete Exclusion

*For any* getMany or getOne request, trades with non-null deleted_at SHALL NOT be included in the results.

**Validates: Requirements 2.4**

### Property 9: Initial Status Invariant

*For any* newly created trade, the status SHALL be 'TX_DRAFT'.

**Validates: Requirements 3.2**

### Property 10: Number Auto-Generation

*For any* trade created without a number, the generated number SHALL follow the format 'TRD_{id}' where id is the trade's database ID.

**Validates: Requirements 3.3**

### Property 11: Default Sent Time

*For any* trade created without sent_time, the sent_time SHALL be set to a timestamp within a reasonable tolerance of the current time.

**Validates: Requirements 3.5**

### Property 12: Total Calculation Correctness

*For any* trade with details, the total SHALL equal the sum of (quantity * price * (1 - discount)) for all details.

**Validates: Requirements 4.3**

### Property 13: Debit/Credit Calculation Correctness

*For any* trade detail, debit SHALL equal quantity if quantity >= 0 else 0, and credit SHALL equal abs(quantity) if quantity < 0 else 0.

**Validates: Requirements 4.4**

### Property 14: Details Replacement

*For any* update operation with a details array, the trade's details after update SHALL exactly match the provided details array (old details removed, new details added).

**Validates: Requirements 4.2**

### Property 15: Soft Delete Behavior

*For any* delete operation, the trade's deleted_at SHALL be set to a non-null timestamp and status SHALL be 'archived'.

**Validates: Requirements 5.1, 5.2**

### Property 16: Cascading Soft Delete

*For any* delete operation on a trade, all associated trade details SHALL also have deleted_at set to a non-null timestamp.

**Validates: Requirements 5.3**

### Property 17: Valid Status Values

*For any* trade, the status SHALL be one of: TX_DRAFT, TX_READY, TX_SENT, TX_RECEIVED, TX_COMPLETED, TX_CANCELED, TX_RETURN, TX_CLOSED.

**Validates: Requirements 6.1**

### Property 18: Valid Model Type Values

*For any* trade detail, the model_type SHALL be one of: ITR, SO, BILL, PAY, PO, DMG, RTR, TAX, UNDF.

**Validates: Requirements 7.2**

### Property 19: Decimal String Format

*For any* trade detail, the quantity, price, discount, and weight fields SHALL be string representations of decimal numbers.

**Validates: Requirements 7.4**

### Property 20: Authentication Enforcement

*For any* request without a valid JWT token, the response SHALL have status code 401.

**Validates: Requirements 8.1, 8.2**

## Error Handling

### Error Codes

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| TRADE_NOT_FOUND | 404 | Trade with specified ID does not exist |
| VALIDATION_ERROR | 400 | Request body validation failed |
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| INTERNAL_ERROR | 500 | Unexpected server error |

### Error Response Format

```typescript
{
  error: string;
  message: string;
  details?: Record<string, string[]>;
}
```

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:
- Service delegation to repository
- Mapper transformations (entity ↔ database row)
- Validation schema edge cases
- Error handling scenarios

### Property-Based Tests

Property-based tests verify universal properties across all inputs using fast-check:
- Each property from the Correctness Properties section should have a corresponding property test
- Minimum 100 iterations per property test
- Tag format: **Feature: trade-module, Property {number}: {property_text}**

### Test Configuration

- Use fast-check for property-based testing
- Mock repository for service unit tests
- Integration tests for repository with test database
- Each property test must reference its design document property
