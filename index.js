import express from "express";
import clientRoutes from "./routes/clients.js";
import roomRoutes from "./routes/rooms.js";
import bookingRoutes from "./routes/bookings.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
app.use("/clients", clientRoutes);
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
