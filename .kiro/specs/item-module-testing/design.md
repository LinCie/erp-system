# Design Document: Item Module Testing

## Overview

This design document outlines the architecture and implementation approach for a comprehensive testing suite for the Item module. The testing suite follows a layered approach matching the Clean Architecture of the module, with unit tests for each layer, property-based tests for invariants, and integration tests for HTTP endpoints.

The testing stack consists of:
- **Deno.test()**: Built-in unit testing framework
- **@std/assert**: Standard assertion library
- **fast-check**: Property-based testing library for generating test data and verifying invariants

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Test Suite                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Unit Tests  │  │ Integration │  │ Property-Based Tests    │  │
│  │             │  │ Tests       │  │                         │  │
│  │ - Service   │  │ - Controller│  │ - Entity mapping        │  │
│  │ - Repository│  │ - HTTP      │  │ - Pagination invariants │  │
│  │ - Mapping   │  │ - Auth      │  │ - Service delegation    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Test Utilities                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Mock Repo   │  │ Fixtures    │  │ fast-check Arbitraries  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Test File Structure

```
src/modules/item/
├── application/
│   ├── item.service.ts
│   └── item.service_test.ts          # Service unit tests
├── infrastructure/
│   ├── item.repository.ts
│   └── item.repository_test.ts       # Repository unit tests
├── presentation/
│   ├── item.controller.ts
│   └── item.controller_test.ts       # Controller integration tests
└── __tests__/
    ├── fixtures/
    │   └── item.fixtures.ts          # Test data fixtures
    ├── mocks/
    │   └── item.repository.mock.ts   # Mock repository implementation
    ├── arbitraries/
    │   └── item.arbitraries.ts       # fast-check arbitraries
    └── item.properties_test.ts       # Property-based tests
```

### Mock Repository Interface

```typescript
// __tests__/mocks/item.repository.mock.ts
import type { IItemRepository, GetManyItemsProps } from "../../application/item-repository.interface.ts";
import type { ItemEntity } from "../../domain/item.entity.ts";

interface MockRepositoryOptions {
  items?: ItemEntity[];
  shouldThrow?: Error;
}

class MockItemRepository implements IItemRepository {
  private items: ItemEntity[] = [];
  private shouldThrow?: Error;
  public calls: { method: string; args: unknown[] }[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.items = options?.items ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  async getMany(props: GetManyItemsProps) { /* ... */ }
  async getOne(id: number) { /* ... */ }
  async create(item: Omit<ItemEntity, "id">) { /* ... */ }
  async update(id: number, item: Partial<ItemEntity>) { /* ... */ }
  async delete(id: number) { /* ... */ }
}
```

### fast-check Arbitraries

```typescript
// __tests__/arbitraries/item.arbitraries.ts
import fc from "fast-check";
import type { ItemEntity } from "../../domain/item.entity.ts";

const numericStringArb = fc.float({ min: 0, max: 999999, noNaN: true })
  .map(n => n.toFixed(2));

const itemEntityArb: fc.Arbitrary<ItemEntity> = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  cost: numericStringArb,
  price: numericStringArb,
  weight: numericStringArb,
  status: fc.constantFrom("active", "inactive", "archived"),
  code: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  sku: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  // ... other optional fields
});

const partialItemArb: fc.Arbitrary<Partial<ItemEntity>> = fc.record({
  name: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  cost: fc.option(numericStringArb, { nil: undefined }),
  price: fc.option(numericStringArb, { nil: undefined }),
  // ... other fields
}, { requiredKeys: [] });

const getManyPropsArb = fc.record({
  spaceId: fc.nat(),
  page: fc.integer({ min: 1, max: 100 }),
  limit: fc.integer({ min: 1, max: 100 }),
  type: fc.constantFrom("full", "partial"),
  status: fc.constantFrom("active", "inactive", "archived"),
  search: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
});
```

### Test Fixtures

```typescript
// __tests__/fixtures/item.fixtures.ts
import type { ItemEntity } from "../../domain/item.entity.ts";

const validItem: ItemEntity = {
  id: 1,
  name: "Test Item",
  cost: "10.00",
  price: "15.00",
  weight: "1.50",
  status: "active",
  sku: "TEST-001",
};

const itemsList: ItemEntity[] = [
  validItem,
  { ...validItem, id: 2, name: "Second Item", sku: "TEST-002" },
  { ...validItem, id: 3, name: "Third Item", sku: "TEST-003" },
];
```

## Data Models

### Test Configuration

The test suite requires the following dependencies added to `deno.json`:

```json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@^1.0.0",
    "fast-check": "npm:fast-check@^3.0.0"
  },
  "tasks": {
    "test": "deno test --allow-env --allow-read --allow-net",
    "test:coverage": "deno test --allow-env --allow-read --allow-net --coverage=cov_profile",
    "test:item": "deno test --allow-env --allow-read --allow-net src/modules/item/"
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Service Delegation Preserves Arguments

*For any* valid service method call (getMany, getOne, create, update, delete), the underlying repository method SHALL receive identical arguments to those passed to the service.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Entity Mapping Round-Trip Consistency

*For any* valid ItemEntity, when mapped to an insertable database object and then mapped back to an entity, the essential fields (id, name, cost, price, weight, status) SHALL be preserved with identical values.

**Validates: Requirements 2.1, 2.3, 3.1**

### Property 3: Partial Update Mapping Completeness

*For any* partial ItemEntity containing a subset of fields, when mapped to an updateable object, the result SHALL contain exactly the fields that were provided (non-undefined) in the input.

**Validates: Requirements 2.4, 3.2**

### Property 4: Numeric String Format Preservation

*For any* valid numeric string field (cost, price, weight), after mapping operations, the value SHALL remain a valid parseable decimal number string.

**Validates: Requirements 2.5, 3.3**

### Property 5: Pagination Limit Invariant

*For any* pagination parameters where limit is a positive integer, the getMany operation SHALL return at most `limit` items in the result set.

**Validates: Requirements 4.1, 5.1**

### Property 6: Search Filter Correctness

*For any* non-empty search term, all items returned by getMany SHALL have either their name or sku field containing the search term as a substring.

**Validates: Requirements 4.2, 5.2**

### Property 7: Soft Delete State Invariant

*For any* item that has been deleted, the item SHALL have status equal to "archived" AND deleted_at set to a valid Date timestamp.

**Validates: Requirements 4.5, 5.3**

## Error Handling

### Test Error Scenarios

| Scenario | Expected Behavior | Test Approach |
|----------|-------------------|---------------|
| Repository throws error | Service propagates error | Mock repository to throw, assert error propagates |
| Item not found | Throw "Item not found" error | Call getOne with non-existent id |
| Invalid JWT | Return 401 status | Make request without auth header |
| Validation failure | Return 400 status | Send malformed request body |

### Error Assertion Patterns

```typescript
import { assertRejects } from "@std/assert";

Deno.test("should throw when item not found", async () => {
  await assertRejects(
    () => repository.getOne(999),
    Error,
    "Item not found"
  );
});
```

## Testing Strategy

### Dual Testing Approach

The testing suite employs both unit testing and property-based testing:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties that should hold across all valid inputs

### Property-Based Testing Framework

- **Library**: fast-check (npm:fast-check@^3.0.0)
- **Minimum Iterations**: 100 runs per property test
- **Annotation Format**: Each property test MUST include a comment referencing the design document property

```typescript
// **Feature: item-module-testing, Property 2: Entity Mapping Round-Trip Consistency**
Deno.test("Property: Entity mapping round-trip preserves data", async () => {
  await fc.assert(
    fc.property(itemEntityArb, (item) => {
      const insertable = mapToInsertable(item);
      const entity = mapToEntity(insertable);
      return entity.name === item.name && 
             entity.cost === item.cost &&
             entity.price === item.price;
    }),
    { numRuns: 100 }
  );
});
```

### Test Categories and Coverage

| Category | Test Type | Files | Coverage Target |
|----------|-----------|-------|-----------------|
| Service Layer | Unit | item.service_test.ts | 100% of public methods |
| Repository Mapping | Unit + Property | item.repository_test.ts | All mapping functions |
| Repository CRUD | Integration | item.repository_test.ts | All CRUD operations |
| Controller | Integration | item.controller_test.ts | All HTTP endpoints |
| Invariants | Property | item.properties_test.ts | All correctness properties |

### Mocking Strategy

| Component | Mock Approach | Purpose |
|-----------|---------------|---------|
| IItemRepository | Interface implementation | Service unit tests |
| Kysely Database | Not mocked (integration) | Repository tests |
| ItemService | Interface mock | Controller tests |
| JWT Secret | Environment variable | Auth tests |
| Gemini AI | Mock client | AI service tests (optional) |

### Test Execution

```bash
# Run all tests
deno task test

# Run with coverage
deno task test:coverage

# Run only item module tests
deno task test:item

# Run specific test file
deno test src/modules/item/application/item.service_test.ts
```
