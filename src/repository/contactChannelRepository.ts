import { db } from "../configs/db";
import { ContactChannelUpdate } from "../types/channel.typs";
import { ContactChannelCreate } from "../validators/contactChannelSchema";

// Create
export const createContactChannelRepository = async(channels: ContactChannelCreate) =>{
    const [result]: any = await db.query(
        `INSERT INTO contact_channels (channel_code, channel_name) VALUES(?, ?)`,
        [channels.channel_code, channels.channel_name]
    )

    return {id: result.insertId, ...channels}
}

// Get all with pagination and search
export const getAllContactChannelsRepository = async (
  page: number,
  limit: number,
  search?: string
) => {
  const offset = (page - 1) * limit;

  let whereClause = "";
  const params: any[] = [];

  if (search) {
    whereClause = "WHERE channel_code LIKE ? OR channel_name LIKE ?";
    const like = `%${search}%`;
    params.push(like, like);
  }

  // Get total count
  const [countResult]: any = await db.query(
    `SELECT COUNT(*) as total FROM contact_channels ${whereClause}`,
    params
  );
  const total = countResult[0].total;

  // Get paginated data
  const [rows]: any = await db.query(
    `SELECT channel_code, channel_name FROM contact_channels ${whereClause} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    },
  };
};

// Get by code
export const getContactChannelByCodeRepository = async(code: string) =>{
    const [rows]: any = await db.query(
        `SELECT * FROM contact_channels WHERE channel_code = ?`,
        [code]
    );

    return rows[0] || null;
}

// Update
export const updateContactChannelRepository = async (
    code: string,
    update: Partial<ContactChannelUpdate>
)=>{
   const [result]: any = await db.query(
    `UPDATE contact_channels SET channel_name =? WHERE channel_code =?`,
    [update.channel_name,code]
   );
   return { affectedRows: result.affectedRows}
}

// Delete
export const deleteContactChannelRepository = async (code: string) =>{
    const [result]: any = await db.query(
        `DELETE FROM contact_channels WHERE channel_code = ?`,
        [code]
    );
    return { affectedRow: result.affectedRows }
}