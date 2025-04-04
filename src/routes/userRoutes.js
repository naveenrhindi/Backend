import express from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Register Route
router.post("/register", registerUser);

// ✅ Login Route
router.post("/login", loginUser);

// ✅ Protected User Profile Route
router.get("/profile", protect, getUserProfile);

// ✅ Update User Profile (Protected Route)
router.put("/update", protect, updateUserProfile);

export default router;
