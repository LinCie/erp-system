import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { SpaceEntity as Space } from "../domain/space.entity.ts";
import { GetManyMetadataType } from "../../../shared/application/types/get-many-metadata.type.ts";

type GetManySpacesProps = GetManyPropsType & { userId: number };
type GetManySpacesReturn = {
  data: Space[];
  metadata: GetManyMetadataType;
};

interface ISpaceRepository {
  getMany(props: GetManySpacesProps): Promise<GetManySpacesReturn>;
  getOne(id: number): Promise<Space>;
  create(data: Omit<Space, "id">): Promise<Space>;
  update(id: number, data: Partial<Space>): Promise<Space>;
  delete(id: number): Promise<void>;
}

export type { GetManySpacesProps, ISpaceRepository };
