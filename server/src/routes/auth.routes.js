import { Router } from "express";
import { loginUser, registerUser, getProfile, refreshAccessToken, logoutUser } from "../controllers/auth.controller.js";
import { verifyToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

router.post("/register", registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login a new user
 * @access Public
 */

router.post("/login", loginUser);

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */

router.get("/profile", verifyToken, getProfile);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */

router.post("/refresh-token", refreshAccessToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout existing user
 * @access Private
 */

router.post("/logout", verifyToken, logoutUser);



export default router;
