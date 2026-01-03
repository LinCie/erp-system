/**
 * Error thrown when mapper transformation fails
 * Used for validation errors during entity <-> DB row conversion
 */
class MapperError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly field?: string;

  constructor(
    message: string,
    options?: {
      code?: string;
      details?: unknown;
      field?: string;
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "MapperError";
    this.code = options?.code ?? "MAPPER_VALIDATION_ERROR";
    this.details = options?.details;
    this.field = options?.field;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MapperError);
    }
  }

  /**
   * Create error for invalid entity data
   */
  static invalidEntity(
    entityName: string,
    details?: unknown,
    cause?: Error,
  ): MapperError {
    return new MapperError(
      `Invalid ${entityName} entity data`,
      {
        code: "INVALID_ENTITY",
        details,
        cause,
      },
    );
  }

  /**
   * Create error for invalid database row
   */
  static invalidRow(
    entityName: string,
    details?: unknown,
    cause?: Error,
  ): MapperError {
    return new MapperError(
      `Invalid ${entityName} database row`,
      {
        code: "INVALID_ROW",
        details,
        cause,
      },
    );
  }

  /**
   * Create error for missing required field
   */
  static missingField(
    entityName: string,
    field: string,
  ): MapperError {
    return new MapperError(
      `Missing required field: ${field}`,
      {
        code: "MISSING_FIELD",
        field,
        details: { entityName, field },
      },
    );
  }

  /**
   * Create error for invalid field type
   */
  static invalidFieldType(
    entityName: string,
    field: string,
    expected: string,
    received: string,
  ): MapperError {
    return new MapperError(
      `Invalid type for field ${field}: expected ${expected}, received ${received}`,
      {
        code: "INVALID_FIELD_TYPE",
        field,
        details: { entityName, field, expected, received },
      },
    );
  }

  /**
   * Create error for transformation failure
   */
  static transformationFailed(
    entityName: string,
    operation: "toEntity" | "toInsertable" | "toUpdateable",
    cause?: Error,
  ): MapperError {
    return new MapperError(
      `Failed to transform ${entityName} during ${operation}`,
      {
        code: "TRANSFORMATION_FAILED",
        details: { entityName, operation },
        cause,
      },
    );
  }
}

export { MapperError };
