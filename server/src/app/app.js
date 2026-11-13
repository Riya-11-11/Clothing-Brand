import express from "express";
import router from "../routes/auth.routes.js";

import productRouter from "../routes/product.routes.js"
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", router);
app.use("/api/products", productRouter);

export default app;
