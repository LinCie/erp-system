import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface UserEntity extends BaseEntity {
  name: string;
  email: string;
  password: string;
}

export type { UserEntity };
