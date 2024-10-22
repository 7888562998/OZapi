// Libraries
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import morganBody from "morgan-body";
import path from "path";
import { fileURLToPath } from "url";
// DB Connection
import { connectDB } from "./src/DB/index.js";
// Routes
import { AuthRouters } from "./src/Router/AuthRouters.js";
import { AdminRouters } from "./src/Router/AdminRouters.js";
import { ResHandler } from "./src/Utils/ResponseHandler/ResHandler.js";
import { ActivityRouters } from "./src/Router/ActivityRouters.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const app = express();
const API_PreFix = "/api/v1";

app.use("/", express.static("Uploads"));

const corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

morganBody(app, {
  prettify: true,
  logReqUserAgent: true,
  logReqDateTime: true,
});

// Connect To Database
const start = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the application." });
});

// Routes
app.use(API_PreFix, AuthRouters);
app.use(API_PreFix, AdminRouters);
app.use(API_PreFix, ActivityRouters);

// Error Handling Middleware
app.use(ResHandler);

// Default export
export default app;

// Call start function to initialize DB connection
start();
