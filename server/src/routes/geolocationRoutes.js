// server/src/routes/geolocationRoutes.js
import express from "express";
import { reverseGeocode } from "../controller/Geolocationcontroller.js";

const router = express.Router();

/* ==========================================================
   GEOLOCATION UTILITY ENDPOINTS
   GET /api/geolocation/reverse?lat=..&lng=.. — used by
   FieldAgentAttendance.jsx to resolve a human-readable address from
   live GPS coordinates.
========================================================== */

router.get("/reverse", reverseGeocode);

export default router;