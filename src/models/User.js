import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^[a-zA-Z0-9._%+-]+@campus\.edu$/, "Only campus emails allowed"]
  },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["student", "staff"], default: 'student', required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
},
createdAt: {
    type: Date,
    default: Date.now
}
});

const User = mongoose.model("User", UserSchema);
export default User;
