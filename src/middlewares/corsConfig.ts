import cors from "cors";

export const corsConfig = cors({
  origin: "*", // allow all origins (dev)
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // ⚠️ can't be used with origin: "*" in production
});
