import { Router } from "express";
import { createProduct } from "../controllers/product.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

/**
 * @route POST /api/products
 * @desc create product
 * @access Private
 */

router.post("/", upload.array("images", 5), createProduct);
