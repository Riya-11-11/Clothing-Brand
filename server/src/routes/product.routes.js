import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
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

/**
 * @route GET /api/products/:slug
 * @desc Fetch a product
 * @access public
 */

router.get("/:slug", getSingleProduct);

/**
 * @route POST /api/products/updateproduct/:id
 * @desc Update a product
 * @access Private (Admin only)
 */

router.patch(
  "/updateproduct/:id",
  verifyToken,
  authorizeAdmin,
  upload.array("images", 5),
  updateProduct,
);

export default router;
