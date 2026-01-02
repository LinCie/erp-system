# Implementation Plan: Trade Module

## Overview

This implementation plan breaks down the Trade Module into discrete coding tasks following Clean Architecture principles. Each task builds on previous tasks, ensuring incremental progress with no orphaned code.

## Tasks

- [x] 1. Set up domain layer
  - [x] 1.1 Create trade-detail.type.ts with TradeDetailType interface
    - Define fields: id, item_id, model_type, sku, name, quantity, price, discount, weight, debit, credit, notes
    - Export type
    - _Requirements: 7.1, 7.4_

  - [x] 1.2 Create trade.entity.ts with TradeEntity interface
    - Import BaseEntity and FileType from shared
    - Import TradeDetailType
    - Define TradeEntity extending Omit<BaseEntity, "status">
    - Include fields: number, space_id, status, total, sent_time, received_time, sender_id, receiver_id, handler_id, parent_id, sender_notes, receiver_notes, handler_notes, description, fee, files, tags, links, details
    - Export type
    - _Requirements: 6.1_

- [x] 2. Set up application layer
  - [x] 2.1 Create trade-repository.interface.ts
    - Import GetManyPropsType and GetManyMetadataType from shared
    - Import TradeEntity
    - Define GetManyTradesProps type with spaceId, modelType, withDetails
    - Define GetManyTradesReturn type with data and metadata
    - Define GetOneTradeProps type with id and withDetails
    - Define CreateTradeData type
    - Define UpdateTradeData type with details array
    - Define ITradeRepository interface with getMany, getOne, create, update, delete methods
    - Export all types and interface
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [x] 2.2 Create trade.service.ts
    - Import ITradeRepository and related types
    - Create TradeService class with constructor accepting ITradeRepository
    - Implement getMany method delegating to repository
    - Implement getOne method delegating to repository
    - Implement create method delegating to repository
    - Implement update method delegating to repository
    - Implement delete method delegating to repository
    - Export TradeService class
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 3. Set up infrastructure layer
  - [x] 3.1 Create trade.mapper.ts
    - Import Insertable, Updateable from kysely
    - Import z from @hono/zod-openapi
    - Create TradeMapper class with internal Zod schemas
    - Implement toInsertable method for trade entity
    - Implement toUpdateable method for partial trade entity
    - Implement toEntity method for database row
    - Implement detailToInsertable method for trade detail
    - Implement detailToEntity method for detail row
    - Handle JSON fields (files, tags, links) serialization/deserialization
    - Export TradeMapper class
    - _Requirements: 7.4_

  - [x] 3.2 Create trade.repository.ts
    - Import PersistenceType, jsonArrayFrom, safeBigintToNumber
    - Import ITradeRepository and related types
    - Import TradeMapper
    - Create TradeRepository class implementing ITradeRepository
    - Implement getMany with filtering (spaceId, status, modelType, search), pagination, sorting
    - Include details using jsonArrayFrom subquery
    - Filter out soft-deleted records (deleted_at is null)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.4_

  - [x] 3.3 Implement getOne in trade.repository.ts
    - Query single trade by ID
    - Include details using jsonArrayFrom subquery
    - Throw TRADE_NOT_FOUND error if not found
    - Filter out soft-deleted records
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Implement create in trade.repository.ts
    - Set internal fields: space_type='SPACE', model_type='TRD', sender_type='PLAY'
    - Set initial status to 'TX_DRAFT'
    - Default sent_time to current timestamp if not provided
    - Insert trade record
    - Auto-generate number as 'TRD_{id}' if not provided
    - Update record with generated number
    - Return created trade via getOne
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.5 Implement update in trade.repository.ts
    - Update trade record with provided data
    - Set handler_type='PLAY', receiver_type='PLAY' internally
    - If details provided, soft-delete existing details and create new ones
    - Set detail_type='ITM' internally for each detail
    - Calculate debit/credit for each detail: debit = quantity >= 0 ? quantity : 0, credit = quantity < 0 ? abs(quantity) : 0
    - Calculate total from details: sum(quantity * price * (1 - discount))
    - Update trade total
    - Return updated trade via getOne
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.6 Implement delete in trade.repository.ts
    - Soft-delete trade by setting deleted_at and status='archived'
    - Soft-delete all associated details
    - Throw TRADE_NOT_FOUND error if trade doesn't exist
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Checkpoint - Verify infrastructure layer
  - Ensure all repository methods are implemented
  - Verify mapper transformations work correctly
  - Ask the user if questions arise

- [x] 5. Set up presentation layer - validators
  - [x] 5.1 Create trade-id-param.validator.ts
    - Define Zod schema for id path parameter with coerce.number()
    - Add OpenAPI metadata with param config
    - Export schema and inferred type
    - _Requirements: 2.1, 4.1, 5.1_

  - [x] 5.2 Create get-many-trades-query.validator.ts
    - Define Zod schema for query parameters
    - Include: spaceId (required), page, limit, status, modelType, search, sort, order
    - Add OpenAPI metadata with examples
    - Export schema and inferred type
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 5.3 Create create-trade-body.validator.ts
    - Define Zod schema for create request body
    - Include: space_id (required), sender_id (required), sent_time, sender_notes, number
    - Add OpenAPI metadata with examples
    - Export schema and inferred type
    - _Requirements: 3.1, 9.1_

  - [x] 5.4 Create update-trade-body.validator.ts
    - Define Zod schema for update request body
    - Include: handler_id (required), sent_time, received_time, receiver_id, receiver_notes, handler_notes, description, status, parent_id, files, tags, links, details
    - Define nested schema for details array with item_id, model_type, quantity, price (all required), discount, weight, sku, name, notes (optional)
    - Add OpenAPI metadata with examples
    - Export schema and inferred type
    - _Requirements: 4.1, 9.2, 9.3_

- [x] 6. Set up presentation layer - schemas
  - [x] 6.1 Create trade-response.schema.ts
    - Define Zod schema for trade detail response
    - Define Zod schema for single trade response
    - Define Zod schema for getMany response with data array and metadata
    - Add OpenAPI metadata with examples
    - Export all schemas
    - _Requirements: 1.7, 2.2, 7.1_

  - [x] 6.2 Create error-response.schema.ts
    - Define Zod schema for error response with error, message, details fields
    - Add OpenAPI metadata
    - Export schema
    - _Requirements: 9.4_

- [x] 7. Set up presentation layer - routes
  - [x] 7.1 Create get-many-trades.route.ts
    - Use createRoute from @hono/zod-openapi
    - Define GET / route with query validator and response schema
    - Add security config for JWT
    - Add tags and summary
    - Export route
    - _Requirements: 1.1, 8.1_

  - [x] 7.2 Create get-one-trade.route.ts
    - Define GET /{id} route with param validator and response schema
    - Add 404 error response
    - Add security config for JWT
    - Export route
    - _Requirements: 2.1, 2.3, 8.1_

  - [x] 7.3 Create create-trade.route.ts
    - Define POST / route with body validator and response schema
    - Add 201 success response
    - Add 400 validation error response
    - Add security config for JWT
    - Export route
    - _Requirements: 3.1, 3.6, 8.1, 9.1_

  - [x] 7.4 Create update-trade.route.ts
    - Define PUT /{id} route with param validator, body validator, and response schema
    - Add 404 error response
    - Add 400 validation error response
    - Add security config for JWT
    - Export route
    - _Requirements: 4.1, 4.5, 4.6, 8.1, 9.2_

  - [x] 7.5 Create delete-trade.route.ts
    - Define DELETE /{id} route with param validator
    - Add 204 no content success response
    - Add 404 error response
    - Add security config for JWT
    - Export route
    - _Requirements: 5.1, 5.4, 5.5, 8.1_

- [x] 8. Set up presentation layer - controller and module
  - [x] 8.1 Create trade.controller.ts
    - Import OpenAPIHono and jwt middleware
    - Import TradeService
    - Import all routes
    - Create defineTradeController function accepting TradeService
    - Set up JWT middleware for all routes
    - Implement handler for getManyTradesRoute
    - Implement handler for getOneTradeRoute
    - Implement handler for createTradeRoute
    - Implement handler for updateTradeRoute
    - Implement handler for deleteTradeRoute
    - Export defineTradeController function
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Create trade.module.ts
    - Import getDatabase from shared infrastructure
    - Import TradeRepository, TradeMapper, TradeService, defineTradeController
    - Instantiate TradeMapper
    - Instantiate TradeRepository with db and mapper
    - Instantiate TradeService with repository
    - Create controller using defineTradeController
    - Export tradeController
    - _Requirements: All_

- [x] 9. Register module in main.ts
  - Import tradeController from trade module
  - Register route with app.route('/trades', tradeController)
  - _Requirements: All_

- [x] 10. Final checkpoint - Verify complete implementation
  - Ensure all endpoints are accessible
  - Verify JWT authentication works
  - Test basic CRUD operations manually
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
