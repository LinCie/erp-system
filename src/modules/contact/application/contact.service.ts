import {
  GetManyContactsProps,
  IContactRepository,
} from "./contact-repository.interface.ts";
import { ContactEntity as Contact } from "../domain/contact.entity.ts";

class ContactService {
  constructor(private readonly contactRepository: IContactRepository) {}

  async getMany(props: GetManyContactsProps) {
    return await this.contactRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.contactRepository.getOne(id);
  }

  async create(data: Omit<Contact, "id">) {
    return await this.contactRepository.create(data);
  }

  async update(id: number, data: Partial<Contact>) {
    return await this.contactRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.contactRepository.delete(id);
  }
}

export { ContactService };
