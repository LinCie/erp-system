# Requirements Document

## Introduction

This document defines the requirements for the Trade Module, a REST API module for managing trade transactions in the Deno/Hono backend. The module replicates the functionality of the Laravel TradeController and TradeService, providing CRUD operations for trades with support for trade details (line items), filtering, pagination, and status management.

## Glossary

- **Trade**: A transaction record representing a business trade/transaction between parties (sender, receiver, handler)
- **Trade_Detail**: A line item within a trade, representing an item with quantity, price, and other attributes
- **Trade_Service**: The application service that orchestrates trade business logic
- **Trade_Repository**: The data access layer for trade persistence operations
- **Trade_Controller**: The HTTP handler that processes trade API requests
- **Space**: A workspace/organization context that trades belong to
- **Player**: A user/entity that can be a sender, receiver, or handler of trades
- **Item**: A product/item that can be referenced in trade details

## Requirements

### Requirement 1: List Trades

**User Story:** As an API consumer, I want to retrieve a paginated list of trades filtered by space and other criteria, so that I can view and manage trades efficiently.

#### Acceptance Criteria

1. WHEN a GET request is made to /trades with a spaceId query parameter, THE Trade_Controller SHALL return a paginated list of trades belonging to that space
2. WHEN the status query parameter is provided, THE Trade_Repository SHALL filter trades by the specified status value
3. WHEN the modelType query parameter is provided, THE Trade_Repository SHALL filter trades that have details with the specified model_type
4. WHEN the search query parameter is provided, THE Trade_Repository SHALL filter trades where number, sender_notes, receiver_notes, handler_notes, or status contain the search term
5. WHEN page and limit query parameters are provided, THE Trade_Repository SHALL return the corresponding page of results with the specified limit
6. WHEN sort and order query parameters are provided, THE Trade_Repository SHALL order results by the specified field and direction
7. THE Trade_Controller SHALL return response metadata including totalItems, totalPages, currentPage, and itemsPerPage

### Requirement 2: Get Single Trade

**User Story:** As an API consumer, I want to retrieve a single trade by ID with all its details, so that I can view complete trade information.

#### Acceptance Criteria

1. WHEN a GET request is made to /trades/{id}, THE Trade_Controller SHALL return the trade with the specified ID
2. THE Trade_Repository SHALL include trade details (line items) in the response
3. IF the trade with the specified ID does not exist, THEN THE Trade_Controller SHALL return a 404 error response
4. THE Trade_Repository SHALL exclude soft-deleted trades (where deleted_at is not null)

### Requirement 3: Create Trade

**User Story:** As an API consumer, I want to create a new trade, so that I can record new business transactions.

#### Acceptance Criteria

1. WHEN a POST request is made to /trades with valid data, THE Trade_Service SHALL create a new trade record
2. THE Trade_Repository SHALL set the initial status to 'TX_DRAFT'
3. WHEN the number field is not provided, THE Trade_Service SHALL auto-generate a number in the format 'TRD_{id}'
4. THE Trade_Repository SHALL set space_type to 'SPACE' and model_type to 'TRD' internally
5. WHEN sent_time is not provided, THE Trade_Service SHALL default to the current timestamp
6. THE Trade_Controller SHALL return the created trade with a 201 status code

### Requirement 4: Update Trade

**User Story:** As an API consumer, I want to update an existing trade and its details, so that I can modify trade information as needed.

#### Acceptance Criteria

1. WHEN a PUT request is made to /trades/{id} with valid data, THE Trade_Service SHALL update the trade record
2. WHEN details array is provided, THE Trade_Repository SHALL delete existing details and create new ones
3. THE Trade_Repository SHALL calculate total from details using the formula: sum(quantity * price * (1 - discount))
4. THE Trade_Repository SHALL calculate debit and credit for each detail: debit = quantity >= 0 ? quantity : 0, credit = quantity < 0 ? abs(quantity) : 0
5. IF the trade with the specified ID does not exist, THEN THE Trade_Controller SHALL return a 404 error response
6. THE Trade_Controller SHALL return the updated trade with a 200 status code

### Requirement 5: Delete Trade

**User Story:** As an API consumer, I want to delete a trade, so that I can remove unwanted trade records.

#### Acceptance Criteria

1. WHEN a DELETE request is made to /trades/{id}, THE Trade_Service SHALL soft-delete the trade
2. THE Trade_Repository SHALL set deleted_at to the current timestamp and status to 'archived'
3. THE Trade_Repository SHALL also soft-delete all associated trade details
4. IF the trade with the specified ID does not exist, THEN THE Trade_Controller SHALL return a 404 error response
5. THE Trade_Controller SHALL return a 204 status code with no content on successful deletion

### Requirement 6: Trade Status Management

**User Story:** As an API consumer, I want trades to have defined status values, so that I can track the lifecycle of trades.

#### Acceptance Criteria

1. THE Trade_Entity SHALL support the following status values: TX_DRAFT, TX_READY, TX_SENT, TX_RECEIVED, TX_COMPLETED, TX_CANCELED, TX_RETURN, TX_CLOSED
2. WHEN a trade is created, THE Trade_Service SHALL set the initial status to TX_DRAFT
3. WHEN filtering by status, THE Trade_Repository SHALL support filtering by any valid status value

### Requirement 7: Trade Details Management

**User Story:** As an API consumer, I want to manage trade details (line items) within trades, so that I can track items, quantities, and prices.

#### Acceptance Criteria

1. THE Trade_Detail_Entity SHALL contain item_id, model_type, sku, name, quantity, price, discount, weight, and notes fields
2. THE Trade_Repository SHALL support model_type values: ITR, SO, BILL, PAY, PO, DMG, RTR, TAX, UNDF
3. WHEN creating or updating trade details, THE Trade_Repository SHALL set detail_type to 'ITM' internally
4. THE Trade_Repository SHALL store quantity, price, discount, and weight as decimal strings

### Requirement 8: Authentication and Authorization

**User Story:** As an API consumer, I want trade endpoints to be protected, so that only authenticated users can access them.

#### Acceptance Criteria

1. THE Trade_Controller SHALL require JWT authentication for all endpoints
2. WHEN a request is made without a valid JWT token, THE Trade_Controller SHALL return a 401 error response

### Requirement 9: Data Validation

**User Story:** As an API consumer, I want input data to be validated, so that invalid data is rejected with clear error messages.

#### Acceptance Criteria

1. WHEN creating a trade, THE Trade_Controller SHALL validate that sender_id is provided
2. WHEN updating a trade, THE Trade_Controller SHALL validate that handler_id is provided
3. WHEN providing details, THE Trade_Controller SHALL validate that each detail has item_id, model_type, quantity, and price
4. WHEN validation fails, THE Trade_Controller SHALL return a 400 error response with validation error details
