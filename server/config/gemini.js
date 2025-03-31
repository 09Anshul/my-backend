import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY, { apiVersion: "v1" });

export default genAI;