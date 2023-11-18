import express from "express";
import mongoose from "mongoose";
import {
  registerValidation,
  loginValidation,
  postCreateValidation,
} from "./validations.js";
import multer from "multer";
import {UserController, PostController} from "./controllers/index.js";
import {handleValidationErrors, checkAuth} from "./utils/index.js";
import cors from "cors";
import {config as dotenvConfig} from "dotenv";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig({path: resolve(__dirname, ".env")});

const uri = `mongodb+srv://mikhailptichkin:${process.env.MONGO_DB_PASSWORD}@cluster0.zn7kax1.mongodb.net/blog?retryWrites=true&w=majority`;

mongoose
  .connect(uri)
  .then(() => console.log("DB connection success"))
  .catch((err) => console.log("DB connection fail,", err));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, callback) => {
    callback(null, "uploads");
  },
  filename: (_, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({storage});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// auth
app.post(
  "/auth/login",
  loginValidation,
  handleValidationErrors,
  UserController.login
);
app.get("/auth/me", checkAuth, UserController.me);
app.post(
  "/auth/register",
  registerValidation,
  handleValidationErrors,
  UserController.register
);

//upload image
app.post("/upload", checkAuth, upload.single("image"), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

//post
app.get("/posts", PostController.getAll);
app.get("/posts/:id", PostController.getOne);
app.post(
  "/posts",
  checkAuth,
  postCreateValidation,
  handleValidationErrors,
  PostController.create
);
app.patch(
  "/posts/:id",
  checkAuth,
  postCreateValidation,
  handleValidationErrors,
  PostController.update
);
app.delete("/posts/:id", checkAuth, PostController.remove);

app.listen(8000, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("server running on port 8000");
});

// import {ServerApiVersion, MongoClient} from "mongodb";
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });
// async function run() {
//   try {
//     await client.connect();
//     await client.db("mikhailptichkin").command({ping: 1});
//     console.log("DB connection success");
//   } catch (err) {
//     console.log("db connection failed,", err);
//   }
// }
// run();
