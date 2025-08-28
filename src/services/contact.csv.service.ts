import { saveAll } from "../repository/contact.csv.repository";
import { CallLog, Contact, Username } from "../types/contact.csv.type";
import fs from "fs";
import { parse } from "csv-parse";
import { callLogSchema, contactSchema, usernameSchema } from "../validators/upload.schemas";



function parseDate(value: string): Date {
    const timestamp = Date.parse(value);
    if (isNaN(timestamp)) throw new Error(`Invalid date: ${value}`);
    return new Date(timestamp);
}

const callStatusMap: Record<string, CallLog["call_status"]> = {
    "Success": "success",
    "No Answer": "no_answer",
    "Callback": "callback",
    "Connected Declined": "connected_declined",
    "Wrong Number": "wrong_number",
    "Blocked": "blocked",
    "Call later": "callback",
    "Transfer": "success",
};

export const uploadCSVService = async (filePath: string) => {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const errors: { row: number; message: string }[] = [];
    let successCount = 0;

    await new Promise<void>((resolve, reject) => {
        parse(fileContent, { columns: true, skip_empty_lines: true }, async (err, rows: any[]) => {
            if (err) return reject(err);

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                try {
                    const contact: Contact = {
                        tel: row["Phone"] || null,
                        full_name: row["Fullname"] || null,
                        contact_type: "customer",
                        register_date: parseDate(row["Registration date"]),
                        last_call_at: new Date(new Date().setDate(new Date().getDate() - (parseInt(row["Num of days"]) || 0))),
                        personal_note: row["Notes"] || "",
                        contact_line: row["Line"] || "",
                        create_at: parseDate(row["Date Record"]),
                        updated_at: new Date(),
                        deleted_at: null,
                        dob: parseDate(row["DOB"]),
                    };

                    const callLog: CallLog = {
                        contact_id: 0,
                        point_id: 0,
                        user_id: null,
                        call_status: callStatusMap[row["Call Status"]] || "no_answer",
                        call_note: row["Notes"] || "",
                        call_start_at: parseDate(row["Call Date"]),
                        call_end_at: parseDate(row["Call Date"]),
                        next_action_at: new Date(),
                    };

                    const username: Username = {
                        contact_id: 0,
                        platform_id: null,
                        username: row["Username"] || "",
                        username_status: row["Member Type"] || "",
                        life_cycle: "active",
                        has_deposited: row["Member Type"] === "Deposited" ? 1 : 0,
                        last_deposit: parseDate(row["Last_dp_Date"]),
                        vip_level: parseInt(row["VIP level"]) || 0,
                    };

                    contactSchema.parse(contact);
                    callLogSchema.parse(callLog);
                    usernameSchema.parse(username);

                    await saveAll(contact, callLog, username);
                    successCount++;
                } catch (error: any) {
                    errors.push({
                        row: i + 1,
                        message: error.errors ? JSON.stringify(error.errors) : error.message || String(error),
                    });
                }
            }

            resolve();
        });
    });

    return { successCount, errors };
};