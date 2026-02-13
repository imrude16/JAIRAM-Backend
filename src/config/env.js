import dotenv from "dotenv";
dotenv.config();

const requiredEnv = ["MONGO_URI"];

requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
