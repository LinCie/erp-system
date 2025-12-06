import {
  GetManyItemsProps,
  IItemRepository,
} from "./item-repository.interface.ts";
import { ItemEntity as Item } from "../domain/item.entity.ts";

class ItemService {
  constructor(private readonly itemRepository: IItemRepository) {}

  async getMany(props: GetManyItemsProps) {
    return await this.itemRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.itemRepository.getOne(id);
  }

  async create(data: Omit<Item, "id">) {
    return await this.itemRepository.create(data);
  }

  async update(id: number, data: Partial<Item>) {
    return await this.itemRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.itemRepository.delete(id);
  }
}

export { ItemService };
