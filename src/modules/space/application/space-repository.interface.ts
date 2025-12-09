import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { SpaceEntity as Space } from "../domain/space.entity.ts";

type GetManySpacesProps = GetManyPropsType & { userId: number };

interface ISpaceRepository {
  getMany(props: GetManySpacesProps): Promise<Space[]>;
  getOne(id: number): Promise<Space>;
  create(data: Omit<Space, "id">): Promise<Space>;
  update(id: number, data: Partial<Space>): Promise<Space>;
  delete(id: number): Promise<void>;
}

export type { GetManySpacesProps, ISpaceRepository };
