import Ride from "../models/Ride.js";
import mongoose from "mongoose";

// ✅ Create a Ride
export const createRide = async (req, res) => {
  try {
    // Check if user already has an active ride as a driver
    const existingRide = await Ride.findOne({
      driver: req.user._id,
      status: 'active'
    });

    if (existingRide) {
      return res.status(400).json({ 
        message: "You already have an active ride offer. Cannot create multiple rides.",
        activeRide: existingRide
      });
    }

    // Support both old and new request body structures
    const { 
      vehicleType, 
      vehicleNumber, 
      seatsAvailable, 
      currentLocation, 
      destination, 
      departureTime,
      arrivalTime,  // Added this
      preferredRoutes, 
      fare,
      // New nested structure
      vehicleDetails,
      route,
      preferences,
      contactPreferences
    } = req.body;

    // Use either old or new structure
    const finalVehicleType = vehicleDetails?.type || vehicleType;
    const finalVehicleNumber = vehicleDetails?.number || vehicleNumber;
    const finalSeatsAvailable = vehicleDetails?.seatsAvailable || seatsAvailable;
    const finalOrigin = route?.origin || currentLocation;
    const finalDestination = route?.destination || destination;
    const finalDepartureTime = route?.departureTime || departureTime;
    const finalArrivalTime = route?.arrivalTime || arrivalTime;
    const finalPreferredRoutes = route?.preferredRoutes || preferredRoutes;

    // Validate required fields
    if (!finalVehicleType || !finalVehicleNumber || !finalSeatsAvailable || 
        !finalOrigin || !finalDestination || !finalDepartureTime || !finalArrivalTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate departure and arrival times
    const departureTimeDate = new Date(finalDepartureTime);
    const arrivalTimeDate = new Date(finalArrivalTime);
    const currentTime = new Date();

    if (isNaN(departureTimeDate.getTime()) || isNaN(arrivalTimeDate.getTime())) {
      return res.status(400).json({ message: "Invalid time format" });
    }

    // Check if arrival is after departure
    if (arrivalTimeDate <= departureTimeDate) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    // Validate seats available
    if (finalSeatsAvailable < 1 || finalSeatsAvailable > 8) {
      return res.status(400).json({ message: "Seats available must be between 1 and 8" });
    }

    // Allow rides scheduled at least 5 minutes from now
    const minTime = new Date();
    minTime.setMinutes(minTime.getMinutes() + 5);
    if (departureTimeDate < minTime) {
      return res.status(400).json({ 
        message: "Departure time must be at least 5 minutes in the future",
        currentTime: minTime,
        providedTime: departureTimeDate
      });
    }

    const ride = new Ride({
      driver: req.user._id,
      vehicleDetails: {
        type: finalVehicleType,
        number: finalVehicleNumber,
        seatsAvailable: finalSeatsAvailable
      },
      route: {
        origin: finalOrigin,
        destination: finalDestination,
        departureTime: departureTimeDate,
        arrivalTime: arrivalTimeDate,
        preferredRoutes: finalPreferredRoutes || []
      },
      preferences: preferences || {
        ac: false,
        music: false,
        smoking: false
      },
      contactPreferences: contactPreferences || {
        call: false,
        chat: false,
        whatsapp: false
      },
      fare: parseFloat(fare) || 0,
      status: 'active'
    });

    await ride.save();
    res.status(201).json({ 
      message: "Ride created successfully", 
      ride: await ride.populate('driver', 'name email')
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Search for Rides
// export const searchRides = async (req, res) => {
//   try {
//     const { 
//       currentLocation, 
//       destination,
//       departureDate,
//       seatsNeeded,
//       maxFare
//     } = req.query;

//     // Build search query
//     const searchQuery = {
//       status: 'active',
//       seatsAvailable: { $gte: seatsNeeded || 1 }
//     };

//     if (currentLocation) {
//       searchQuery.currentLocation = { $regex: new RegExp(currentLocation, "i") };
//     }

//     if (destination) {
//       searchQuery.destination = { $regex: new RegExp(destination, "i") };
//     }

//     if (departureDate) {
//       const startOfDay = new Date(departureDate);
//       const endOfDay = new Date(departureDate);
//       endOfDay.setDate(endOfDay.getDate() + 1);
      
//       searchQuery.departureTime = {
//         $gte: startOfDay,
//         $lt: endOfDay
//       };
//     }

//     if (maxFare) {
//       searchQuery.fare = { $lte: parseFloat(maxFare) };
//     }

//     // const rides = await Ride.find({
//     //   currentLocation: { $regex: new RegExp(currentLocation, "i") },
//     //   destination: { $regex: new RegExp(destination, "i") },
//     //   seatsAvailable: { $gt: 0 }, // Only rides with available seats
//     // });

//     const rides = await Ride.find(searchQuery)
//       .populate('driver', 'name email')
//       .sort({ departureTime: 1 });

//       res.json({
//         count: rides.length,
//         rides: rides
//       });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Search available rides
export const searchRides = async (req, res) => {
  try {
    const { origin, destination, departureDate, seatsNeeded, preferences } = req.query;

    let query = {
      'route.origin': { $regex: origin, $options: 'i' },
      'route.destination': { $regex: destination, $options: 'i' },
      'vehicleDetails.seatsAvailable': { $gte: parseInt(seatsNeeded) || 1 },
      status: 'active'
    };

    // Add date filter if provided
    if (departureDate) {
      const date = new Date(departureDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query['route.departureTime'] = {
        $gte: date,
        $lt: nextDay
      };
    }

    let rides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'name profileImage rating gender',
      })
      .sort({ 'route.departureTime': 1 });

    // Filter by gender preference after population
    if (preferences) {
      const { femaleOnly } = JSON.parse(preferences);
      if (femaleOnly) {
        rides = rides.filter(ride => ride.driver.gender === 'female');
      }
    }

    res.json({ rides });
  } catch (error) {
    console.error('Search rides error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add this new function to your existing controller
// export const bookRide = async (req, res) => {
//   try {
//     const { rideId } = req.params;
//     const { seatsRequired } = req.body;

//     // Validate seats required
//     if (!seatsRequired || seatsRequired < 1) {
//       return res.status(400).json({ message: "Please specify number of seats to book" });
//     }

//     // Find the ride
//     const ride = await Ride.findById(rideId);
//     if (!ride) {
//       return res.status(404).json({ message: "Ride not found" });
//     }

//     // Check if ride is active
//     if (ride.status !== 'active') {
//       return res.status(400).json({ message: "This ride is no longer available" });
//     }

//     // Check if enough seats are available
//     if (ride.seatsAvailable < seatsRequired) {
//       return res.status(400).json({ 
//         message: "Not enough seats available",
//         availableSeats: ride.seatsAvailable
//       });
//     }

//     // Check if user is trying to book their own ride
//     if (ride.driver.toString() === req.user._id.toString()) {
//       return res.status(400).json({ message: "You cannot book your own ride" });
//     }

//     // Create booking
//     const booking = {
//       rider: req.user._id,
//       seatsBooked: seatsRequired,
//       bookingTime: new Date(),
//       status: 'confirmed'
//     };

//     // Update ride
//     ride.bookings.push(booking);
//     ride.seatsAvailable -= seatsRequired;

//     // If no more seats available, update status
//     if (ride.seatsAvailable === 0) {
//       ride.status = 'completed';
//     }

//     await ride.save();

//     // Populate rider and driver details
//     await ride.populate('driver', 'name email');
//     await ride.populate('bookings.rider', 'name email');

//     res.status(200).json({
//       message: "Ride booked successfully",
//       booking: booking,
//       ride: ride
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Book a ride
export const bookRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seatsRequired } = req.body;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.vehicleDetails.seatsAvailable < seatsRequired) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    // Check if user already booked this ride
    const existingBooking = ride.passengers.find(p => p.user.equals(userId));
    if (existingBooking) {
      return res.status(400).json({ message: "You have already booked this ride" });
    }

    // Add passenger and update seats
    ride.passengers.push({
      user: userId,
      seats: seatsRequired,
      status: 'pending'
    });
    ride.vehicleDetails.seatsAvailable -= seatsRequired;

    await ride.save();
    res.json({ message: "Ride booked successfully", ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this new function to your existing controller
export const cancelBooking = async (req, res) => {
  try {
    const { rideId } = req.params;

    // Validate rideId format
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ 
        message: "Invalid ride ID format"
      });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Find user's booking
    const booking = ride.bookings.find(
      booking => booking.rider.toString() === req.user._id.toString()
    );

    if (!booking) {
      return res.status(404).json({ message: "No booking found for this user" });
    }

    // Update ride's available seats
    ride.seatsAvailable += booking.seatsBooked;
    
    // Update booking status to cancelled
    booking.status = 'cancelled';

    // If ride was completed, set it back to active
    if (ride.status === 'completed') {
      ride.status = 'active';
    }

    await ride.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      updatedRide: await ride.populate('driver', 'name email')
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seatsNeeded, message } = req.body;

    // Basic validation
    if (!seatsNeeded || seatsNeeded < 1) {
      return res.status(400).json({ message: "Please specify number of seats needed" });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if ride is still active
    if (ride.status !== 'active') {
      return res.status(400).json({ message: "This ride is no longer accepting requests" });
    }

    // Check if enough seats are available
    if (ride.seatsAvailable < seatsNeeded) {
      return res.status(400).json({ 
        message: "Not enough seats available",
        availableSeats: ride.seatsAvailable
      });
    }

    // Check if user already has a pending request
    const existingRequest = ride.requests.find(
      req => req.rider.toString() === req.user._id.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending request for this ride" });
    }

    // Create new request
    const request = {
      rider: req.user._id,
      seatsNeeded,
      message: message || "Requesting to join the ride",
      status: 'pending',
      requestTime: new Date()
    };

    // Add request to ride
    ride.requests.push(request);
    await ride.save();

    // Populate rider details and return
    await ride.populate('requests.rider', 'name email');

    res.status(201).json({
      message: "Ride request sent successfully",
      request: request
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const handleRideRequest = async (req, res) => {
  try {
    const { rideId, requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Verify that the logged-in user is the driver
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the driver can handle ride requests" });
    }

    // Find the request
    const request = ride.requests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: "This request has already been handled" });
    }

    if (status === 'accepted') {
      // Check if enough seats are still available
      if (ride.seatsAvailable < request.seatsNeeded) {
        return res.status(400).json({ message: "Not enough seats available anymore" });
      }

      // Update seats and create booking
      ride.seatsAvailable -= request.seatsNeeded;
      ride.bookings.push({
        rider: request.rider,
        seatsBooked: request.seatsNeeded,
        status: 'confirmed'
      });
    }

    // Update request status
    request.status = status;
    await ride.save();

    // Populate rider details
    await ride.populate('requests.rider', 'name email');
    await ride.populate('bookings.rider', 'name email');

    res.json({
      message: `Request ${status} successfully`,
      ride: ride
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this new controller function
export const getChatHistory = async (req, res) => {
    try {
        const { rideId } = req.params;
        const ride = await Ride.findById(rideId)
            .populate('messages.sender', 'name')
            .select('messages');

        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        res.json(ride.messages);
    } catch (error) {
        console.error('Chat History Error:', error);
        res.status(500).json({ message: "Error fetching chat history" });
    }
};

export const getRideHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Ensure user can only access their own history
        if (userId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to view this history" });
        }

        // Find rides where user is either driver or passenger
        const rides = await Ride.find({
            $or: [
                { driver: userId },
                { 'passengers.user': userId }
            ]
        })
        .populate('driver', 'name profileImage')
        .populate('passengers.user', 'name')
        .sort({ 'route.departureTime': -1 });

        // Format rides for frontend
        const formattedRides = rides.map(ride => {
            const isDriver = ride.driver._id.toString() === userId;
            return {
                _id: ride._id,
                role: isDriver ? 'driver' : 'passenger',
                status: ride.status,
                date: ride.route.departureTime,
                pickup: ride.route.origin,
                destination: ride.route.destination,
                fare: ride.fare,
                passengers: ride.passengers.length,
                // Add any other needed fields
            };
        });

        res.json(formattedRides);
    } catch (error) {
        console.error('Get ride history error:', error);
        res.status(500).json({ message: error.message });
    }
};
