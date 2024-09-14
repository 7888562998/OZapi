// Librarys
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

// Response Handler
import { AdminRouters } from "./src/Router/AdminRouters.js";

import { ResHandler } from "./src/Utils/ResponseHandler/ResHandler.js";
import { ActivityRouters } from "./src/Router/ActivityRouters.js";



export const filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(filename);

export let app = express();
const port = process.env.PORT || 3050;


const API_PreFix = "/api/v1";


app.use("/", express.static("Uploads"));

var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
// Configure body-parser to handle post requests
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan("dev"));

morganBody(app, {
  prettify: true,
  logReqUserAgent: true,
  logReqDateTime: true,
});
// Connect To Database
connectDB();


app.get("/", (req, res) => {
  res.json({ message: "Welcome to the application." });
});
// Routes

// Route For Auditors
app.use(API_PreFix, AuthRouters);
// ====// Bussiness Routes


// Route For Admin
app.use(API_PreFix, AdminRouters);

// Route For Activity
app.use(API_PreFix, ActivityRouters);



// Hunt Routes



app.use(ResHandler);
app.listen(port, () => {
  console.log(`connection is live to this port ${port}`);
});

