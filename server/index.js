import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/chat", chatRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
