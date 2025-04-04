import express from "express";
import { 
    createRide, 
    searchRides, 
    bookRide, 
    cancelBooking, 
    requestRide, 
    handleRideRequest,
    getRideHistory,
    getChatHistory  // Add this import
} from "../controllers/rideController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create Ride (Only for Logged-in Drivers)
router.post("/create", protect, createRide);

// ✅ Search Rides (Only for Logged-in Riders)
router.get("/search", protect, searchRides); 

// New booking route
router.post("/:rideId/book", protect, bookRide);

// New cancellation route
router.delete("/:rideId/cancel", protect, cancelBooking);

// New ride request route
router.post("/:rideId/request", protect, requestRide);

// Handle ride request (accept/reject)
router.put("/:rideId/request/:requestId", protect, handleRideRequest);

// Add this new route for ride history
router.get("/history/:userId", protect, getRideHistory);

// Add this new route for chat history
router.get("/:rideId/chat", protect, getChatHistory);

export default router;
