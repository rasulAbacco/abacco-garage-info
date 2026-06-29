import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import employeeDashboardRoutes from "./src/routes/employeeDashboardRoutes.js";
import garageRoutes from "./src/routes/garageRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import schoolRoutes from "./src/routes/schoolRoutes.js";
import vehicleroutes from "./src/routes/vehicleroutes.js";
import { startVehicleTrackingCron } from "./src/services/vehicleTracking.cron.js";
import fieldVisitRoutes from "./src/routes/fieldVisitRoutes.js";
import { reverseGeocode } from "./src/controller/geolocationController.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins =
  (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) =>
      origin.trim()
    )
    .filter(Boolean);

console.log(
  "Allowed Origins:",
  allowedOrigins
);

app.use(
  cors({
    origin: function (
      origin,
      callback
    ) {

      // mobile apps / postman
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(null, true);
      }

      console.log(
        "Blocked Origin:",
        origin
      );

      return callback(
        new Error(
          "CORS not allowed: " +
          origin
        )
      );
    },

    credentials: true,
  })
);

const PORT = process.env.PORT || 4001;

app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});

app.use("/api/auth", authRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use(
  "/api/employee-dashboard",
  employeeDashboardRoutes
);
app.use("/api/garage", garageRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use(
  "/api/location",
  locationRoutes
);
app.use("/api/field-visit", fieldVisitRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/vehicles", vehicleroutes);
app.use("/api/geolocation", reverseGeocode);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start GPS polling once the server is up
  startVehicleTrackingCron();
});