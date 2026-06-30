// server/src/routes/followUpRoutes.js
// Mount this router at "/api/follow-up" in your main app/server file, e.g.:
//   import followUpRoutes from "./routes/followUpRoutes.js";
//   app.use("/api/follow-up", followUpRoutes);
import express from "express";
import { updateFollowUp, deleteFollowUp } from "../controller/followUpController.js";

const router = express.Router();

router.put("/:id", updateFollowUp);
router.delete("/:id", deleteFollowUp);

export default router;