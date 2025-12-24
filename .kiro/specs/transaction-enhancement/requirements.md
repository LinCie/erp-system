# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Deno transaction module to match the functionality of the Laravel transaction system. The enhancement will add support for transaction details (line items), polymorphic relationships, automatic total calculation, number generation, and status management.

## Glossary

- **Transaction**: A record representing a business transaction between parties (e.g., sales order, purchase order, quote)
- **Transaction Detail**: A line item within a transaction, representing individual items/services with quantity, price, and discount
- **Polymorphic Relationship**: A database relationship where a field can reference different entity types (e.g., sender can be a Player, Person, or Group)
- **System**: The Deno transaction module
- **Soft Delete**: Marking a record as deleted without physically removing it from the database
- **Total**: The calculated sum of all transaction detail amounts
- **Number**: A unique identifier for a transaction following the pattern `{type}_{id}`
- **Status**: The current state of a transaction in its lifecycle (e.g., DRAFT, SENT, RECEIVED)

## Requirements

### Requirement 1

**User Story:** As a developer, I want to create transactions with multiple line items, so that I can represent complex business transactions with multiple products or services.

#### Acceptance Criteria

1. WHEN a transaction is created with details, THE System SHALL store both the transaction header and all associated detail records
2. WHEN a transaction detail is added, THE System SHALL include quantity, price, discount, weight, cost_per_unit, sku, and name fields
3. WHEN retrieving a transaction, THE System SHALL include all associated transaction details
4. WHEN a transaction is updated, THE System SHALL allow updating both header and detail information
5. WHEN a transaction is deleted, THE System SHALL soft delete both the transaction and all associated details

### Requirement 2

**User Story:** As a developer, I want transactions to automatically calculate totals from details, so that I don't have to manually compute and maintain total amounts.

#### Acceptance Criteria

1. WHEN transaction details are created or updated, THE System SHALL calculate the total as the sum of (quantity × price × (1 - discount)) for all details
2. WHEN a detail is added to a transaction, THE System SHALL recalculate and update the transaction total
3. WHEN a detail is removed from a transaction, THE System SHALL recalculate and update the transaction total
4. WHEN a detail quantity, price, or discount is modified, THE System SHALL recalculate and update the transaction total
5. WHEN calculating totals, THE System SHALL exclude details with model_type of 'BILL' or 'PAY' from total_details but include them in the overall total

### Requirement 3

**User Story:** As a developer, I want transactions to have polymorphic relationships, so that I can link transactions to different entity types (players, persons, groups, items, etc.).

#### Acceptance Criteria

1. WHEN a transaction is created, THE System SHALL support polymorphic sender, receiver, and handler relationships
2. WHEN a transaction is created, THE System SHALL support polymorphic input, output, parent, and relation relationships
3. WHEN a transaction is created, THE System SHALL support polymorphic space, model, and type relationships
4. WHEN a transaction detail is created, THE System SHALL support polymorphic detail and model relationships
5. WHEN retrieving a transaction, THE System SHALL allow including related entities based on the polymorphic type

### Requirement 4

**User Story:** As a developer, I want transactions to automatically generate unique numbers, so that each transaction has a human-readable identifier.

#### Acceptance Criteria

1. WHEN a transaction is created without a number, THE System SHALL generate a number after the transaction is saved
2. WHEN generating a number, THE System SHALL use the pattern `{type_type}_{id}` where type_type defaults to 'TX' if not provided
3. WHEN a transaction already has a number, THE System SHALL not overwrite it
4. WHEN a transaction is updated, THE System SHALL preserve the existing number
5. WHEN retrieving transactions, THE System SHALL include the generated number

### Requirement 5

**User Story:** As a developer, I want transactions to support status management, so that I can track the lifecycle of transactions.

#### Acceptance Criteria

1. WHEN a transaction is created, THE System SHALL set the default status to 'TX_DRAFT'
2. WHEN a transaction status is updated, THE System SHALL validate the status value
3. WHEN retrieving transactions, THE System SHALL allow filtering by status
4. WHEN a transaction is in a terminal status (e.g., 'TX_CLOSED'), THE System SHALL prevent modifications
5. WHEN querying transactions, THE System SHALL support status-based filtering

### Requirement 6

**User Story:** As a developer, I want transactions to support JSON metadata fields, so that I can store flexible additional information like files, tags, and links.

#### Acceptance Criteria

1. WHEN a transaction is created, THE System SHALL support storing files as a JSON array
2. WHEN a transaction is created, THE System SHALL support storing tags as a JSON array
3. WHEN a transaction is created, THE System SHALL support storing links as a JSON array
4. WHEN a transaction is created, THE System SHALL support storing input_address and output_address as JSON objects
5. WHEN retrieving a transaction, THE System SHALL parse JSON fields into appropriate TypeScript types

### Requirement 7

**User Story:** As a developer, I want transaction details to support both inventory and accounting fields, so that I can use transactions for both inventory management and financial accounting.

#### Acceptance Criteria

1. WHEN a transaction detail is created, THE System SHALL support debit and credit fields for accounting
2. WHEN a transaction detail quantity is positive, THE System SHALL set debit to the quantity and credit to zero
3. WHEN a transaction detail quantity is negative, THE System SHALL set credit to the absolute value and debit to zero
4. WHEN a transaction detail is created, THE System SHALL support cost_per_unit for inventory costing
5. WHEN a transaction detail is created, THE System SHALL support weight for shipping calculations

### Requirement 8

**User Story:** As a developer, I want to update transactions with details in a single operation, so that I can maintain data consistency and simplify the API.

#### Acceptance Criteria

1. WHEN updating a transaction with details, THE System SHALL delete all existing details
2. WHEN updating a transaction with details, THE System SHALL create new details from the provided data
3. WHEN updating a transaction with details, THE System SHALL recalculate totals after updating details
4. WHEN updating a transaction with details, THE System SHALL perform all operations within a database transaction
5. WHEN an error occurs during update, THE System SHALL rollback all changes

### Requirement 9

**User Story:** As a developer, I want transaction details to store item information, so that I can track what items are included even if the item master data changes.

#### Acceptance Criteria

1. WHEN a transaction detail is created, THE System SHALL store the item SKU
2. WHEN a transaction detail is created, THE System SHALL store the item name
3. WHEN a transaction detail is created, THE System SHALL store the item code
4. WHEN an item is deleted or modified, THE System SHALL preserve the historical item information in transaction details
5. WHEN retrieving transaction details, THE System SHALL include the stored item information

### Requirement 10

**User Story:** As a developer, I want to query transactions with various filters, so that I can retrieve specific subsets of transactions efficiently.

#### Acceptance Criteria

1. WHEN querying transactions, THE System SHALL support filtering by status
2. WHEN querying transactions, THE System SHALL support filtering by date range (sent_time, received_time)
3. WHEN querying transactions, THE System SHALL support filtering by sender, receiver, or handler
4. WHEN querying transactions, THE System SHALL support filtering by model_type
5. WHEN querying transactions, THE System SHALL support searching across number, notes, and detail information
