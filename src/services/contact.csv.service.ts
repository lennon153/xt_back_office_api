import { saveAll } from "../repository/contact.csv.repository";
import { CallLog, Contact, Username } from "../types/contact.csv.type";
import fs from "fs";
import { parse } from "csv-parse";
import { callLogSchema, contactSchema, usernameSchema } from "../validators/upload.schemas";

function parseDate(value: string): Date | null {
    if (!value || value.trim() === '') return null;
    
    const timestamp = Date.parse(value);
    if (isNaN(timestamp)) {
        console.warn(`Invalid date: "${value}", using current date as fallback`);
        return new Date();
    }
    return new Date(timestamp);
}

function parseIntWithDefault(value: string, defaultValue: number = 0): number {
    if (!value || value.trim() === '') return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

function getCallStatus(status: string): CallLog["call_status"] {
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
    
    return callStatusMap[status] || "no_answer";
}

function truncateString(value: string, maxLength: number = 50): string {
    if (!value) return '';
    return value.length > maxLength ? value.substring(0, maxLength) : value;
}

// -----------------------
// Upload csv
// -----------------------
export const uploadCSVService = async (filePath: string) => {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const errors: { row: number; message: string }[] = [];
    let successCount = 0;

    await new Promise<void>((resolve, reject) => {
        parse(fileContent, { 
            columns: true, 
            skip_empty_lines: true,
            relax_column_count: true // Handle varying column counts
        }, async (err, rows: any[]) => {
            if (err) return reject(err);

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                try {
                    // Parse contact data with proper null handling
                    //FIXME:add last_call_status
                    const contact: Contact = {
                        tel: row["Phone"]?.trim() || null,
                        full_name: row["Fullname"]?.trim() || null,
                        contact_type: "customer",
                        register_date: parseDate(row["Registration date"]) || new Date(),
                        last_call_at: new Date(new Date().setDate(new Date().getDate() - (parseIntWithDefault(row["Num of days"], 0)))),
                        personal_note: truncateString(row["Notes"] || "", 255),
                        contact_line: truncateString(row["Line"] || "", 100),
                        create_at: parseDate(row["Date Record"]) || new Date(),
                        updated_at: new Date(),
                        deleted_at: null,
                        dob: parseDate(row["DOB"]),
                    };

                    // Parse call log data
                    const callLog: CallLog = {
                        contact_id: 0,
                        point_id: 1, // Default value instead of 0
                        user_id: 'YUYgP6NjGXGmBvnlv9XSbozJp1gkA6mG',
                        call_status: getCallStatus(row["Call Status"]),
                        call_note: truncateString(row["Notes"] || "", 500),
                        call_start_at: parseDate(row["Call Date"]) || new Date(),
                        call_end_at: parseDate(row["Call Date"]) || new Date(),
                        next_action_at: new Date(new Date().setDate(new Date().getDate() + 7)), // Default: 7 days from now
                    };

                    // Parse username data with proper validation
                    const usernameStatus = truncateString(row["Member Type"] || "", 20);
                    const username: Username = {
                        contact_id: 0,
                        platform_id: 1, // Default platform ID instead of null
                        username: truncateString(row["Username"] || "", 50),
                        username_status: usernameStatus,
                        life_cycle: "active",
                        has_deposited: row["Member Type"] === "Deposited" ? 1 : 0,
                        last_deposit: parseDate(row["Last_dp_Date"]),
                        vip_level: parseIntWithDefault(row["VIP level"], 0),
                    };

                    // Validate data
                    contactSchema.parse(contact);
                    callLogSchema.parse(callLog);
                    usernameSchema.parse(username);

                    await saveAll(contact, callLog, username);
                    successCount++;
                    
                } catch (error: any) {
                    console.error(`Error in row ${i + 1}:`, error);
                    errors.push({
                        row: i + 1,
                        message: error.errors 
                            ? JSON.stringify(error.errors) 
                            : error.message || String(error),
                    });
                }
            }

            resolve();
        });
    });

    return { successCount, errors };
};