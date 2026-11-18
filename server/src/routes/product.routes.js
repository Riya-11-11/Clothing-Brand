import { Router } from "express";
import {
  createProduct,
  getAllProducts,
} from "../controllers/product.controller.js";

import upload from "../middleware/upload.middleware.js";
import { verifyToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/products
 * @desc Create a product
 * @access Private (Admin only)
 */

router.post(
  "/",
  verifyToken,
  authorizeAdmin,
  upload.array("images", 5),
  createProduct,
);

/**
 * @route GET /api/products/allProducts
 * @desc Fetch all products
 * @access public
 */

router.get("/allProducts", getAllProducts);

export default router;
