import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // Import User Model

// ✅ Register User
export const registerUser = async (req, res) => {
    try {
      const { name, email, password, role, gender } = req.body;
  
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create new user (only required fields)
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        gender
      });

      await user.save();
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  

// ✅ Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT Token with name included
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,  // ✅ Ensure name is included
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Adjust expiration as needed
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Fetch User Profile
export const getUserProfile = async (req, res) => {
  try {
    res.json({
      id: req.user.userId,
      name: req.user.name,
      email: req.user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update User Profile
export const updateUserProfile = async (req, res) => {
    try {
      console.log("Decoded User:", req.user); // ✅ Debugging log
  
      const user = await User.findById(req.user._id); // ✅ Use _id instead of id
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // ✅ Update only provided fields
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.vehicleType = req.body.vehicleType || user.vehicleType;
      user.vehicleNumber = req.body.vehicleNumber || user.vehicleNumber;
      user.seatsAvailable = req.body.seatsAvailable || user.seatsAvailable;
      user.currentLocation = req.body.currentLocation || user.currentLocation;
      user.preferredRoutes = req.body.preferredRoutes || user.preferredRoutes;
  
      await user.save();
  
      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
