// import mongoose from "mongoose";

// const RideSchema = new mongoose.Schema({
//   driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   vehicleDetails: {
//     type: { 
//       type: String, 
//       enum: ['car', 'bike', 'van'],  // Match frontend options
//       required: true 
//     },
//     number: { 
//       type: String, 
//       required: true,
//       uppercase: true  // Match frontend toUpperCase()
//     },
//     seatsAvailable: { 
//       type: Number, 
//       required: true,
//       min: 1,
//       max: 8  // Match frontend max seats (van)
//     }
//   },
//   route: {
//     origin: { type: String, required: true },
//     destination: { type: String, required: true },
//     departureTime: { type: Date, required: true },
//     arrivalTime: { type: Date, required: true },
//     preferredRoutes: [{
//       type: String,
//       enum: [
//         'Hostel A',
//         'Main Gate',
//         'Library',
//         'Academic Block',
//         'Sports Complex',
//         'Cafeteria',
//         'Shopping Complex',
//         'Metro Station'
//       ]
//     }]
//   },
//   preferences: {
//     ac: { type: Boolean, default: false },
//     music: { type: Boolean, default: false },
//     smoking: { type: Boolean, default: false }
//   },
//   contactPreferences: {
//     call: { type: Boolean, default: false },
//     chat: { type: Boolean, default: false },
//     whatsapp: { type: Boolean, default: false }
//   },
//   fare: { 
//     type: Number, 
//     default: 0,
//     min: 0  // Match frontend min attribute
//   },
//   status: { 
//     type: String, 
//     enum: ['active', 'completed', 'cancelled'],
//     default: 'active'
//   },
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   bookings: [{
//     rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     seatsBooked: { type: Number, required: true },
//     bookingTime: { type: Date, default: Date.now },
//     status: { 
//       type: String, 
//       enum: ['confirmed', 'cancelled'],
//       default: 'confirmed'
//     }
//   }],
//   requests: [{
//     rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     seatsNeeded: { type: Number, required: true },
//     message: { type: String },
//     status: { 
//       type: String, 
//       enum: ['pending', 'accepted', 'rejected'],
//       default: 'pending'
//     },
//     requestTime: { type: Date, default: Date.now }
//   }]
// });

// const Ride = mongoose.model("Ride", RideSchema);
// export default Ride;


import mongoose from "mongoose";

const RideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  route: {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    waypoints: [String]
  },
  vehicleDetails: {
    type: { type: String, enum: ['car', 'bike', 'van'], required: true },
    number: { type: String, required: true, uppercase: true },
    seatsAvailable: { type: Number, required: true, min: 1 },
    hasAC: { type: Boolean, default: false }
  },
  fare: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  preferences: {
    femaleOnly: { type: Boolean, default: false },
    nonSmoking: { type: Boolean, default: true }
  },
  passengers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seats: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'] }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Ride", RideSchema);
// export default Ride;
