import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

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

export default router;
