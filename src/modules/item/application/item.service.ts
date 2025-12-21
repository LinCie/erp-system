import type { IStorageService } from "@/shared/application/storage.interface.ts";
import type { FileUploadRequestProps } from "@/shared/application/storage.interface.ts";
import {
  GetManyItemsProps,
  GetOneItemProps,
  IItemRepository,
} from "./item-repository.interface.ts";
import { ItemEntity as Item } from "../domain/item.entity.ts";

class ItemService {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly storageService: IStorageService,
  ) {}

  async getMany(props: GetManyItemsProps) {
    return await this.itemRepository.getMany(props);
  }

  async getOne(props: GetOneItemProps) {
    return await this.itemRepository.getOne(props);
  }

  async create(data: Omit<Item, "id">) {
    if (data.images) {
      await Promise.all(
        data.images.map((image) => {
          return { ...image, isNew: true };
        }),
      );
    }

    return await this.itemRepository.create(data);
  }

  async update(id: number, data: Partial<Omit<Item, "id">>) {
    const item = await this.getOne({ id });

    // Only process image deletions if images field is explicitly provided
    if (data.images !== undefined) {
      const newImagePaths = new Set(data.images?.map((i) => i.path) ?? []);
      const imagesToDelete = item.images?.filter(
        (image) => !newImagePaths.has(image.path),
      );

      if (imagesToDelete && imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map((image) => this.storageService.delete(image.path)),
        );
      }
    }

    // Only process file deletions if images field is explicitly provided
    if (data.files !== undefined) {
      const newFilePaths = new Set(data.files?.map((i) => i.path) ?? []);
      const filesToDelete = item.files?.filter(
        (file) => !newFilePaths.has(file.path),
      );

      if (filesToDelete && filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map((file) => this.storageService.delete(file.path)),
        );
      }
    }

    return await this.itemRepository.update(id, data);
  }

  async delete(id: number) {
    const item = await this.itemRepository.getOne({ id });

    if (item.images) {
      await Promise.all(
        item.images.map((image) => this.storageService.delete(image.path)),
      );
    }

    if (item.files) {
      await Promise.all(
        item.files.map((file) => this.storageService.delete(file.path)),
      );
    }

    return await this.itemRepository.delete(id);
  }

  async requestFileUpload({ contentType, size }: FileUploadRequestProps) {
    return await this.storageService.requestFileUpload({
      contentType,
      size,
    });
  }

  async requestImageUpload({ contentType, size }: FileUploadRequestProps) {
    return await this.storageService.requestImageUpload({
      contentType,
      size,
    });
  }
}

export { ItemService };
