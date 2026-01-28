import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { ItemEntity as Item } from "../domain/item.entity.ts";
import { GetManyMetadataType } from "../../../shared/application/types/get-many-metadata.type.ts";

type GetManyItemsProps = Omit<GetManyPropsType, "status"> & {
  spaceId: number;
  type: "full" | "partial";
  withInventory?: boolean;
  status?: "active" | "inactive" | "discounted" | "all" | "unknown";
};

type GetManyItemsReturn = {
  data: Item[];
  metadata: GetManyMetadataType;
};

type GetOneItemProps = {
  id: number;
  spaceId?: number;
  withInventory?: boolean;
};

type GetItemsByIdsProps = {
  ids: number[];
  spaceId?: number;
  withInventory?: boolean;
};

interface IItemRepository {
  getMany(props: GetManyItemsProps): Promise<GetManyItemsReturn>;
  getOne(props: GetOneItemProps): Promise<Item>;
  getByIds(props: GetItemsByIdsProps): Promise<Item[]>;
  create(item: Omit<Item, "id">): Promise<Item>;
  update(id: number, item: Partial<Item>): Promise<Item>;
  delete(id: number): Promise<void>;
}

export type {
  GetItemsByIdsProps,
  GetManyItemsProps,
  GetOneItemProps,
  IItemRepository,
};
