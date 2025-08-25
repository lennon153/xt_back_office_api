import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";
import dotenv from "dotenv";


// Load environment variables
dotenv.config();

// Every minute task example
export const dailyDepositCheckTask = new AutoScheduler(
  async () => {
    console.log("Checking users with last deposit < 7 days...");

    const [rows] = await db.query(
      `
      SELECT 
        u.username_id, 
        u.contact_id, 
        u.platform_id, 
        u.username, 
        u.username_status, 
        u.life_cycle, 
        u.register_date, 
        u.has_deposited, 
        u.last_deposit, 
        u.vip_level,

        c.case_id,
        c.username_id,
        c.case_type,
        c.case_status,
        c.priority,
          
        ca.assignment_id,
        ca.case_id,
        ca.user_id,
        ca.assign_at,
        ca.assignment_note

      FROM usernames u
      LEFT JOIN cases c
        ON c.username_id = u.username_id
      LEFT JOIN case_assignments ca
        ON c.case_id = ca.case_id
      WHERE u.last_deposit IS NOT NULL
        AND DATEDIFF(NOW(), u.last_deposit) < 7;
      `
    );

    console.log("Users deposited within last 7 days:", rows);
  },
  {
    cronTime: process.env.DAILY_DEPOSIT_TASK_CRON || "0 9 * * *", 
    timeZone: "Asia/Phnom_Penh",
  },
  "DailyDepositCheckTask"
);
