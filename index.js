import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import {config as dotenvConfig} from "dotenv";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";
import {router} from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig({path: resolve(__dirname, ".env")});

const uri = process.env.MONGO_DB_URI;

mongoose
  .connect(uri)
  .then(() => console.log("DB connection success"))
  .catch((err) => console.log("DB connection fail,", err));

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
// app.use("/uploads/avatars", express.static("uploads/avatars"));
// app.use("/uploads/sessions", express.static("uploads/sessions"));

app.use("/", router);

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("server running on port 8010");
});
