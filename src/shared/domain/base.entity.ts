import type { StatusType } from "./types/status.type.ts";

interface BaseEntity {
  id: number;
  status: StatusType;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export type { BaseEntity };
