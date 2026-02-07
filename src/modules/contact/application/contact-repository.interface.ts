import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import { ContactEntity as Contact } from "../domain/contact.entity.ts";

type GetManyContactsProps = GetManyPropsType & {
  spaceId: number;
  withFullDetails: boolean;
  withLastTrade?: boolean;
  type?: string;
  search?: string;
};

type GetManyContactsReturn = {
  data: Contact[];
  metadata: GetManyMetadataType;
};

interface IContactRepository {
  getMany(props: GetManyContactsProps): Promise<GetManyContactsReturn>;
  getOne(id: number): Promise<Contact>;
  create(data: Omit<Contact, "id">): Promise<Contact>;
  update(id: number, data: Partial<Contact>): Promise<Contact>;
  delete(id: number): Promise<void>;
}

export type { GetManyContactsProps, GetManyContactsReturn, IContactRepository };
