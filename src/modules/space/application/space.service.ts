import {
  GetManySpacesProps,
  ISpaceRepository,
} from "./space-repository.interface.ts";
import { SpaceEntity as Space } from "../domain/space.entity.ts";

class SpaceService {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async getMany(props: GetManySpacesProps) {
    return await this.spaceRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.spaceRepository.getOne(id);
  }

  async create(data: Omit<Space, "id">) {
    return await this.spaceRepository.create(data);
  }

  async update(id: number, data: Partial<Space>) {
    return await this.spaceRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.spaceRepository.delete(id);
  }
}

export { SpaceService };
