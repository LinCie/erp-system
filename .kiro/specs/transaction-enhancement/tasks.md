# Implementation Plan

- [x] 1. Create TransactionDetail domain entity
  - Create `src/modules/transaction/domain/transaction-detail.entity.ts`
  - Define TransactionDetailEntity interface extending BaseEntity
  - Include all fields: transaction_id, detail_type/id, model_type/id, sku, name, code, quantity, price, discount, weight, cost_per_unit, debit, credit, data, notes
  - Use string type for decimal fields (quantity, price, discount, weight, cost_per_unit, debit, credit)
  - Use optional fields with undefined for nullable database columns (e.g., `sku?: string` instead of `sku: string | null`)
  - Use Record<string, unknown> | undefined for data JSON field
  - _Requirements: 1.2, 7.1, 9.1, 9.2, 9.3_

- [x] 2. Update Transaction domain entity
  - Update `src/modules/transaction/domain/transaction.entity.ts`
  - Add all polymorphic relationship fields (sender_type/id, receiver_type/id, handler_type/id, input_type/id, output_type/id, parent_type/id, relation_type/id, space_type/id, model_type/id, type_type/id)
  - Use optional fields with undefined for nullable database columns (e.g., `number?: string` instead of `number: string | null`)
  - Add financial fields (total, total_details, fee, fee_rules) as strings
  - Add timestamp fields (request_time, sent_time, received_time)
  - Add notes fields (description, sender_notes, receiver_notes, handler_notes, handler_number, notes)
  - Add JSON fields (input_address, output_address, files, tags, links) with appropriate types using optional syntax
  - Add number and class fields
  - Remove the simple name field
  - _Requirements: 3.1, 3.2, 3.3, 4.5, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Create TransactionDetail infrastructure layer
  - [x] 3.1 Create TransactionDetail mapper
    - Create `src/modules/transaction/infrastructure/transaction-detail.mapper.ts`
    - Implement toInsertable() method converting entity to database row (undefined → null for optional fields, objects → JSON strings)
    - Implement toUpdateable() method for partial updates
    - Implement toEntity() method converting database row to entity (null → undefined for optional fields, JSON strings → objects)
    - Add Zod schemas for validation during transformation
    - Handle decimal string conversions
    - _Requirements: 1.2, 6.5, 7.1_

  - [x] 3.2 Create TransactionDetail repository interface
    - Create `src/modules/transaction/application/transaction-detail-repository.interface.ts`
    - Define ITransactionDetailRepository interface
    - Add methods: getMany(transaction_id), getOne(id), create(data), createMany(data), update(id, data), delete(id), deleteByTransactionId(transaction_id)
    - Define return types for each method
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 3.3 Implement TransactionDetail repository
    - Create `src/modules/transaction/infrastructure/transaction-detail.repository.ts`
    - Implement ITransactionDetailRepository interface
    - Use Kysely for database operations
    - Implement getMany() to retrieve all details for a transaction
    - Implement getOne() to retrieve single detail
    - Implement create() to add single detail
    - Implement createMany() to add multiple details efficiently
    - Implement update() to modify detail
    - Implement delete() for soft delete (set deleted_at)
    - Implement deleteByTransactionId() to soft delete all details for a transaction
    - Use mapper for all conversions
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ]* 3.4 Write property test for TransactionDetail repository
  - **Property 10: Item information preservation**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 4. Update Transaction infrastructure layer
  - [x] 4.1 Update Transaction mapper
    - Update `src/modules/transaction/infrastructure/transaction.mapper.ts`
    - Update entitySchema to include all new fields with optional() for nullable database fields
    - Update insertableSchema for create operations with nullable() for database columns
    - Update updateableSchema for update operations
    - Handle JSON field conversions (files, tags, links, addresses)
    - Handle decimal string conversions for financial fields
    - Handle null/undefined conversions: undefined → null when going to DB, null → undefined when coming from DB
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 4.5, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.2 Update Transaction repository interface
    - Update `src/modules/transaction/application/transaction-repository.interface.ts`
    - Add includeDetails parameter to getOne()
    - Add updateWithDetails() method signature
    - Add generateNumber() method signature
    - Add calculateTotals() method signature
    - Update GetManyTransactionsProps to include filtering options (status, model_type, sender_id, receiver_id, handler_id, date ranges)
    - _Requirements: 1.1, 1.3, 2.1, 4.1, 8.1, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 4.3 Implement Transaction repository enhancements
    - Update `src/modules/transaction/infrastructure/transaction.repository.ts`
    - Update getOne() to optionally include details using Kysely joins or separate query
    - Implement generateNumber() method following pattern `{type_type}_{id}` (default type_type to 'TX')
    - Implement calculateTotals() method: sum (quantity × price × (1 - discount)) for all details, separate total_details excluding 'BILL' and 'PAY' model_types
    - Implement updateWithDetails() method using database transaction
    - In updateWithDetails(): delete old details, create new details, calculate totals, update transaction
    - Update getMany() to support new filtering options
    - Inject TransactionDetailRepository for detail operations
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 4.4 Write property test for total calculation
  - **Property 1: Total calculation consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ]* 4.5 Write property test for total_details exclusion
  - **Property 8: Total_details exclusion**
  - **Validates: Requirements 2.5**

- [ ]* 4.6 Write property test for number generation
  - **Property 3: Number generation uniqueness**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 4.7 Write property test for number preservation
  - **Property 4: Number preservation**
  - **Validates: Requirements 4.3, 4.4**

- [ ]* 4.8 Write property test for debit/credit calculation
  - **Property 5: Debit/credit calculation**
  - **Validates: Requirements 7.2, 7.3**

- [x] 5. Update Transaction service layer
  - [x] 5.1 Update Transaction service
    - Update `src/modules/transaction/application/transaction.service.ts`
    - Inject TransactionDetailRepository in constructor
    - Update getOne() to pass includeDetails parameter
    - Add updateWithDetails() method that delegates to repository
    - Add validation for closed transactions (status check before updates)
    - Add helper methods for common operations if needed
    - _Requirements: 1.3, 1.4, 5.4, 8.1, 8.2, 8.3_

  - [ ]* 5.2 Write unit tests for Transaction service
    - Update `src/modules/transaction/application/transaction.service_test.ts`
    - Test getMany delegates to repository
    - Test getOne with includeDetails parameter
    - Test create delegates to repository
    - Test update delegates to repository
    - Test updateWithDetails calls repository with correct parameters
    - Test delete delegates to repository
    - Test error propagation from repository
    - Test closed transaction validation
    - _Requirements: 1.1, 1.3, 1.4, 5.4, 8.1_

- [ ]* 5.3 Write property test for update atomicity
  - **Property 6: Update atomicity**
  - **Validates: Requirements 8.4, 8.5**

- [ ]* 5.4 Write property test for detail deletion before update
  - **Property 7: Detail deletion before update**
  - **Validates: Requirements 8.1, 8.2**

- [ ]* 5.5 Write property test for cascade deletion
  - **Property 2: Detail cascade deletion**
  - **Validates: Requirements 1.5**

- [x] 6. Create test infrastructure
  - [x] 6.1 Create TransactionDetail fixtures
    - Create `src/modules/transaction/__tests__/fixtures/transaction-detail.fixtures.ts`
    - Create validDetail fixture with all required fields
    - Create minimalDetail fixture with minimal fields
    - Create detailsList array with multiple details
    - Create fixtures for different model_types (SO, PO, BILL, PAY)
    - _Requirements: 1.2, 7.1_

  - [x] 6.2 Create TransactionDetail arbitraries
    - Create `src/modules/transaction/__tests__/arbitraries/transaction-detail.arbitraries.ts`
    - Create transactionDetailEntityArb for complete entity
    - Create createTransactionDetailArb for create operations (without id)
    - Create partialTransactionDetailArb for updates
    - Create numericStringArb for decimal fields
    - Create modelTypeArb for model_type values
    - _Requirements: 1.2, 7.1_

  - [x] 6.3 Create TransactionDetail mock repository
    - Create `src/modules/transaction/__tests__/mocks/transaction-detail.repository.mock.ts`
    - Implement ITransactionDetailRepository interface
    - Add call tracking for all methods
    - Add configurable error throwing
    - Add utility methods (reset, setError, getCalls, etc.)
    - _Requirements: 1.1, 1.4_

  - [x] 6.4 Update Transaction fixtures
    - Update `src/modules/transaction/__tests__/fixtures/transaction.fixtures.ts`
    - Create validTransaction fixture with all new fields
    - Create transactionWithDetails fixture
    - Create fixtures for different transaction types (TRD, QUO)
    - Create fixtures for different statuses
    - _Requirements: 3.1, 3.2, 3.3, 4.5, 5.1, 6.1, 6.2, 6.3_

  - [x] 6.5 Update Transaction arbitraries
    - Update `src/modules/transaction/__tests__/arbitraries/transaction.arbitraries.ts`
    - Update transactionEntityArb with all new fields
    - Create polymorphicRelationshipArb for type/id pairs
    - Create jsonMetadataArb for files, tags, links
    - Create addressArb for input_address and output_address
    - Create statusArb for status values
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.6 Update Transaction mock repository
    - Update `src/modules/transaction/__tests__/mocks/transaction.repository.mock.ts`
    - Add updateWithDetails method
    - Add generateNumber method
    - Add calculateTotals method
    - Update getOne to support includeDetails
    - _Requirements: 1.3, 2.1, 4.1, 8.1_

- [ ]* 6.7 Write property test for JSON round-trip
  - **Property 9: JSON field round-trip**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 7. Update presentation layer
  - [x] 7.1 Create TransactionDetail validators
    - Create `src/modules/transaction/presentation/validators/create-transaction-detail-body.validator.ts`
    - Create `src/modules/transaction/presentation/validators/update-transaction-detail-body.validator.ts`
    - Add validation for all detail fields
    - Add OpenAPI metadata with examples
    - Use string type for decimal fields
    - _Requirements: 1.2, 7.1_

  - [x] 7.2 Update Transaction validators
    - Update `src/modules/transaction/presentation/validators/create-transaction-body.validator.ts`
    - Update `src/modules/transaction/presentation/validators/update-transaction-body.validator.ts`
    - Create `src/modules/transaction/presentation/validators/update-transaction-with-details-body.validator.ts`
    - Update `src/modules/transaction/presentation/validators/get-many-transactions-query.validator.ts` with new filter options
    - Add validation for all new transaction fields
    - Add validation for polymorphic relationships
    - Add validation for JSON fields
    - Add OpenAPI metadata
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.3 Create TransactionDetail response schemas
    - Create `src/modules/transaction/presentation/schemas/transaction-detail-response.schema.ts`
    - Define transactionDetailResponseSchema with all fields
    - Add OpenAPI metadata with examples
    - _Requirements: 1.2, 1.3_

  - [x] 7.4 Update Transaction response schemas
    - Update `src/modules/transaction/presentation/schemas/transaction-response.schema.ts`
    - Add all new transaction fields
    - Create transactionWithDetailsResponseSchema that includes details array
    - Add OpenAPI metadata
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.5 Create/update Transaction routes
    - Update `src/modules/transaction/presentation/routes/get-one-transaction.route.ts` to support includeDetails query parameter
    - Update `src/modules/transaction/presentation/routes/get-many-transactions.route.ts` with new filter options
    - Create `src/modules/transaction/presentation/routes/update-transaction-with-details.route.ts` for atomic updates
    - Update route definitions with new request/response schemas
    - _Requirements: 1.3, 8.1, 8.2, 8.3, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.6 Update Transaction controller
    - Update `src/modules/transaction/presentation/transaction.controller.ts`
    - Update getOne handler to pass includeDetails parameter
    - Update getMany handler to pass new filter parameters
    - Add updateWithDetails handler for atomic updates
    - Add error handling for closed transactions
    - _Requirements: 1.3, 5.4, 8.1, 8.2, 8.3, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.7 Update Transaction module
    - Update `src/modules/transaction/presentation/transaction.module.ts`
    - Instantiate TransactionDetailMapper
    - Instantiate TransactionDetailRepository with db and mapper
    - Pass TransactionDetailRepository to TransactionRepository
    - Pass both repositories to TransactionService
    - Wire up new routes
    - _Requirements: 1.1, 1.3, 8.1_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update documentation
  - [x] 9.1 Update module README (if exists)
    - Document new transaction fields
    - Document transaction details
    - Document updateWithDetails operation
    - Document filtering options
    - Provide usage examples
    - _Requirements: 1.1, 1.3, 8.1, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 9.2 Add API documentation comments
    - Add JSDoc comments to all new methods
    - Document parameters and return types
    - Document error conditions
    - Document business logic (total calculation, number generation)
    - _Requirements: 2.1, 4.1, 8.1_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
