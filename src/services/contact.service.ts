import { AppError } from "../utils/customError";
import { HttpStatus } from "../constants/httpStatus";
import { createContactRepository, deleteContactRepository, getAllContactsRepository, getContactDetailByIdRepository, updateContactRepository } from "../repository/contact.repository";
import { formatDateHour } from "../utils/dateFormat";
import { ContactCreate } from "../types/contact.type";
import fs from "fs";
import { parse } from "csv-parse";



export const getAllContactsService = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
) => {
  try {
    const { rows, total } = await getAllContactsRepository(page, limit, search);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      contacts: rows.map((row: any) => ({
        id: row.id,
        contact_id: row.contact_id,
        tel: row.tel,
        full_name: row.full_name,
        dob: row.dob ? formatDateHour(new Date(row.dob)): null,
        contact_type: row.contact_type,
        register_date: row.register_date ? formatDateHour(new Date(row.register_date)): null,
        last_call_at: row.last_call_at ? formatDateHour(new Date(row.last_call_at)): null,
        last_call_status: row.last_call_status,
        contact_line: row.contact_line,
        personal_note:row.personal_note,
        created_at: row.create_at ? formatDateHour(new Date(row.create_at)) : null,
        updated_at: row.update_at ? formatDateHour(new Date(row.update_at)) : null,
      })),
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext,
        hasPrevious,
      },
    };
  } catch (e) {
    console.error("Error fetching contacts:", e);
    throw new AppError("Contacts not found", HttpStatus.NOT_FOUND);
  }
};


export const getContactDetailService = async (contactId: number) => {
  const rows = await getContactDetailByIdRepository(contactId);

  if (rows.length === 0) {
    throw new AppError("Contact not found", HttpStatus.NOT_FOUND);
  }

  const contact = {
    contact_id: rows[0].contact_id,
    full_name: rows[0].full_name,
    tel: rows[0].tel,
    contact_type: rows[0].contact_type,
    usernames: [] as any[],
  };

  // Group usernames by username_id
  const usernameMap = new Map<number, any>();

  rows.forEach((row: any) => {
    if (!usernameMap.has(row.username_id)) {
      usernameMap.set(row.username_id, {
        username_id: row.username_id,
        username: row.username,
        username_status: row.username_status,
        life_cycle: row.life_cycle,
        register_date: row.register_date
          ? formatDateHour(new Date(row.register_date))
          : null,
        has_deposited: row.has_deposited,
        last_deposit: row.last_deposit,
        vip_level: row.vip_level,
        platform: {
          platform_id: row.platform_id,
          platform_name: row.platform_name,
          type: {
            type_id: row.type_id,
            type_name: row.type_name,
          },
        },
        call_logs: [] as any[],
      });
    }

    // Push call log into corresponding username
    usernameMap.get(row.username_id).call_logs.push({
      point_id: row.point_id,
      staff_id: row.staff_id,
      call_status: row.call_status,
      call_start_at: row.call_start_at
        ? formatDateHour(new Date(row.call_start_at))
        : null,
      call_end_at: row.call_end_at
        ? formatDateHour(new Date(row.call_end_at))
        : null,
      next_action_at: row.next_action_at
        ? formatDateHour(new Date(row.next_action_at))
        : null,
    });
  });

  contact.usernames = Array.from(usernameMap.values());

  return contact;
};

export const createContactService = async (contact: ContactCreate) => {
  const now = new Date();

  // Merge automatic timestamps
  const contactWithTimestamps: ContactCreate = {
    ...contact,
    create_at: now,
    update_at: now,
  };

  const newContact = await createContactRepository(contactWithTimestamps);
  return newContact;
};

export const updateContactService = async (id: number, contact: Partial<ContactCreate>) =>{
  const now = new Date();
  return updateContactRepository(id, {...contact, update_at: now});
}

export const deleteContactService = async (id: number) =>{
  return deleteContactRepository(id);
}

export const uploadContactsCsvService = async (filePath: string) => {
  const contacts: ContactCreate[] = [];
  const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const row of parser) {
    const contact: ContactCreate = {
      tel: row.tel || null,
      full_name: row.full_name || null,
      contact_type: (row.contact_type as "lead" | "customer") || "lead",
      register_date: row.register_date ? new Date(row.register_date) : null,
      last_call_at: row.last_call_at ? new Date(row.last_call_at) : new Date(),
      last_call_status: row.last_call_status as any,
      personal_note: row.personal_note || null,
      contact_line: row.contact_line || null,
      create_at: new Date(),
      update_at: new Date(),
      dob: row.dob ? new Date(row.dob) : null,
    };
    contacts.push(contact);
  }

  const createdContacts = [];
  for (const c of contacts) {
    const newContact = await createContactRepository(c);
    createdContacts.push(newContact);
  }

  return createdContacts;
};