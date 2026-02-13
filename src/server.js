import { listen } from "./app";
import { PORT } from "./config/env";
import connectDB from "./infrastructure/mongodb/connection";

const startServer = async () => {
    try {
        await connectDB();

        listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Server failed to start", err);
        process.exit(1);
    }
};

startServer();
