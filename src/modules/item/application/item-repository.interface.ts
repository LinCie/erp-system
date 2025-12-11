import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { ItemEntity as Item } from "../domain/item.entity.ts";
import { GetManyMetadataType } from "../../../shared/application/types/get-many-metadata.type.ts";

type GetManyItemsProps = GetManyPropsType & {
  spaceId: number;
  type: "full" | "partial";
  withInventory?: boolean;
};
type GetManyItemsReturn = {
  data: Item[];
  metadata: GetManyMetadataType;
};

interface IItemRepository {
  getMany(props: GetManyItemsProps): Promise<GetManyItemsReturn>;
  getOne(id: number): Promise<Item>;
  create(item: Omit<Item, "id">): Promise<Item>;
  update(id: number, item: Partial<Item>): Promise<Item>;
  delete(id: number): Promise<void>;
}

export type { GetManyItemsProps, IItemRepository };
