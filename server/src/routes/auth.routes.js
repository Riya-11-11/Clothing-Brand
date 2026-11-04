import { Router } from "express";
import { loginUser, registerUser, getProfile } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

router.post("/register", registerUser);

/**
 * @route GET /api/auth/login
 * @desc Login a new user
 * @access Public
 */

router.get("/login", loginUser);

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */

router.get("/profile", verifyToken, getProfile);

export default router;
