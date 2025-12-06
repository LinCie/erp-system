import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { ItemEntity as Item } from "../domain/item.entity.ts";

type GetManyItemsProps = GetManyPropsType & {
  spaceId: number;
  type: "full" | "partial";
};

interface IItemRepository {
  getMany(props: GetManyItemsProps): Promise<Item[]>;
  getOne(id: number): Promise<Item>;
  create(item: Omit<Item, "id">): Promise<Item>;
  update(id: number, item: Partial<Item>): Promise<Item>;
  delete(id: number): Promise<void>;
}

export type { GetManyItemsProps, IItemRepository };
