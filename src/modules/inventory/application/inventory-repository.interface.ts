import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import { InventoryEntity as Inventory } from "../domain/inventory.entity.ts";

type GetManyInventoriesProps = GetManyPropsType;

type GetManyInventoriesReturn = {
  data: Inventory[];
  metadata: GetManyMetadataType;
};

interface IInventoryRepository {
  getMany(props: GetManyInventoriesProps): Promise<GetManyInventoriesReturn>;
  getOne(id: number): Promise<Inventory>;
  create(data: Omit<Inventory, "id">): Promise<Inventory>;
  update(id: number, data: Partial<Inventory>): Promise<Inventory>;
  delete(id: number): Promise<void>;
}

export type { GetManyInventoriesProps, GetManyInventoriesReturn, IInventoryRepository };
