import config from "../config/config.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization; //give value of Authorization header

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  const parts = authHeader.split(" ");

  if (parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });
  }

  const token = parts[1]; //0th -> Bearer 1st -> actual access token

  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.user = decoded; //attach user info
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}

export async function authorizeAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
    
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Internal server error",
    });
  }
}
