import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import {
  InventoryEntity as Inventory,
  InventoryMutation,
} from "../domain/inventory.entity.ts";

type GetManyInventoriesProps = GetManyPropsType;

type GetManyInventoriesReturn = {
  data: Inventory[];
  metadata: GetManyMetadataType;
};

type GetMutationsProps = {
  inventory_id: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
};

type MutationSummary = {
  initialBalance: number;
  initialDebit: number;
  initialCredit: number;
  pageDebit: number;
  pageCredit: number;
};

type GetMutationsReturn = {
  data: InventoryMutation[];
  metadata: GetManyMetadataType;
  summary: MutationSummary;
};

interface IInventoryRepository {
  getMany(props: GetManyInventoriesProps): Promise<GetManyInventoriesReturn>;
  getOne(id: number): Promise<Inventory>;
  getMutations(props: GetMutationsProps): Promise<GetMutationsReturn>;
  create(data: Omit<Inventory, "id">): Promise<Inventory>;
  update(id: number, data: Partial<Inventory>): Promise<Inventory>;
  delete(id: number): Promise<void>;
}

export type {
  GetManyInventoriesProps,
  GetManyInventoriesReturn,
  GetMutationsProps,
  GetMutationsReturn,
  IInventoryRepository,
  MutationSummary,
};
