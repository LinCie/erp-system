interface BaseEntity {
  id: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export type { BaseEntity };
