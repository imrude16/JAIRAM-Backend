import { connect } from "mongoose";
import { MONGO_URI } from "../../config/env";

const connectDB = async () => {
    try {
        await connect(MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
};

export default connectDB;
