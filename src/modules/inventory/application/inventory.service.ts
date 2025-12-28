import {
  GetManyInventoriesProps,
  GetMutationsProps,
  IInventoryRepository,
} from "./inventory-repository.interface.ts";
import { InventoryEntity as Inventory } from "../domain/inventory.entity.ts";

class InventoryService {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async getMany(props: GetManyInventoriesProps) {
    return await this.inventoryRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.inventoryRepository.getOne(id);
  }

  async getMutations(props: GetMutationsProps) {
    return await this.inventoryRepository.getMutations(props);
  }

  async create(data: Omit<Inventory, "id">) {
    return await this.inventoryRepository.create(data);
  }

  async update(id: number, data: Partial<Inventory>) {
    return await this.inventoryRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.inventoryRepository.delete(id);
  }
}

export { InventoryService };
