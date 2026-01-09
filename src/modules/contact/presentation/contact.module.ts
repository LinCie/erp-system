import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { ContactRepository } from "../infrastructure/contact.repository.ts";
import { ContactService } from "../application/contact.service.ts";
import { defineContactController } from "./contact.controller.ts";
import { ContactMapper } from "../infrastructure/contact.mapper.ts";

const db = getDatabase();

const contactMapper = new ContactMapper();
const contactRepo = new ContactRepository(db, contactMapper);
const contactService = new ContactService(contactRepo);
const contactController = defineContactController(contactService);

export { contactController };
