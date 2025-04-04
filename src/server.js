import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import { WebSocketServer } from 'ws';
import http from 'http';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'register':
                    // Register client with userId
                    clients.set(data.userId, ws);
                    break;

                case 'ride_request':
                    // Forward ride request to driver
                    const driverWs = clients.get(data.driverId);
                    if (driverWs) {
                        driverWs.send(JSON.stringify({
                            type: 'ride_request',
                            requestId: Date.now(),
                            riderId: data.riderId,
                            pickup: data.pickup,
                            destination: data.destination,
                            seats: data.seats
                        }));
                    }
                    break;

                case 'request_response':
                    // Forward driver's response to rider
                    const riderWs = clients.get(data.riderId);
                    if (riderWs) {
                        riderWs.send(JSON.stringify({
                            type: 'request_response',
                            requestId: data.requestId,
                            response: data.response,
                            driverId: data.driverId
                        }));
                    }
                    break;

                case 'location_update':
                    // Broadcast driver location to relevant riders
                    if (data.connectedRiders) {
                        data.connectedRiders.forEach(riderId => {
                            const riderSocket = clients.get(riderId);
                            if (riderSocket) {
                                riderSocket.send(JSON.stringify({
                                    type: 'location_update',
                                    driverId: data.driverId,
                                    location: data.location
                                }));
                            }
                        });
                    }
                    break;

                case 'chat_message':
                    // Forward chat message to recipient
                    const recipientWs = clients.get(data.receiverId);
                    if (recipientWs) {
                        recipientWs.send(JSON.stringify({
                            type: 'chat_message',
                            senderId: data.senderId,
                            message: data.message,
                            timestamp: Date.now()
                        }));
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        // Remove client from connected clients
        for (const [userId, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(userId);
                break;
            }
        }
        console.log('Client disconnected');
    });
});

// Existing middleware
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
