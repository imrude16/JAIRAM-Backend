import express, { json, urlencoded } from "express";
import cors from "cors";
import globalErrorHandler from "./common/errors/errorHandler.js";
import routes from "./routes/index.js";
import optionalAuth from "./common/middlewares/optionalAuth.js";
const app = express();
app.use(cors());

/* -------- Global Middlewares -------- */
app.use(json());
app.use(urlencoded({ extended: true }));

app.use(optionalAuth);    // attaches req.user if exists (for every request)

// Routes
app.use("/api", routes);

// 🔥 GLOBAL ERROR HANDLER (MUST BE LAST)
app.use(globalErrorHandler);


export default app;