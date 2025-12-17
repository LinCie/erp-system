import type { IStorageService } from "@/shared/application/storage.interface.ts";
import {
  GetManyItemsProps,
  IItemRepository,
} from "./item-repository.interface.ts";
import { ItemEntity as Item, ItemImage } from "../domain/item.entity.ts";

type CreateItemData = Omit<Item, "id" | "images"> & {
  images?: File | File[];
};

type UpdateItemData = Partial<Omit<Item, "images">> & {
  images?: File | File[];
  existing_images?: ItemImage[];
};

class ItemService {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly storageService: IStorageService,
  ) {}

  async getMany(props: GetManyItemsProps) {
    return await this.itemRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.itemRepository.getOne(id);
  }

  async create(data: CreateItemData) {
    const { images: imageFiles, ...itemData } = data;

    let images: ItemImage[] | undefined;

    if (imageFiles) {
      const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
      images = await Promise.all(
        files.map(async (file) => {
          const result = await this.storageService.upload(file, "items");
          return {
            name: file.name,
            path: result.key,
            size: result.size,
            isNew: true,
          };
        }),
      );
    }

    return await this.itemRepository.create({ ...itemData, images });
  }

  async update(id: number, data: UpdateItemData) {
    const { images: imageFiles, existing_images, ...itemData } = data;

    const existingItem = await this.itemRepository.getOne(id);
    let images: ItemImage[] | undefined;

    // Handle existing images (keep only specified ones, delete the rest)
    if (existing_images !== undefined) {
      const existingPaths = new Set(existing_images.map((img) => img.path));
      const imagesToRemove = (existingItem.images ?? []).filter(
        (img) => !existingPaths.has(img.path),
      );

      // Only delete from S3 if isNew is true (uploaded images)
      const imagesToDeleteFromS3 = imagesToRemove.filter((img) => img.isNew);
      await Promise.all(
        imagesToDeleteFromS3.map((img) => this.storageService.delete(img.path)),
      );

      images = existing_images;
    } else {
      images = existingItem.images;
    }

    // Handle new image uploads
    if (imageFiles) {
      const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

      const newImages = await Promise.all(
        files.map(async (file) => {
          const result = await this.storageService.upload(file, "items");
          return {
            name: file.name,
            path: result.key,
            size: result.size,
            isNew: true,
          };
        }),
      );

      images = [...(images ?? []), ...newImages];
    }

    return await this.itemRepository.update(id, { ...itemData, images });
  }

  async delete(id: number) {
    const item = await this.itemRepository.getOne(id);

    if (item.images) {
      await Promise.all(
        item.images.map((image) => this.storageService.delete(image.path)),
      );
    }

    return await this.itemRepository.delete(id);
  }
}

export { ItemService };
export type { CreateItemData, UpdateItemData };
