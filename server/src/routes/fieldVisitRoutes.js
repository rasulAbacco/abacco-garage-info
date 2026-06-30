// server/src/routes/fieldVisitRoutes.js
import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
   createFieldVisit,
   getMyFieldVisits,
   getSingleFieldVisit,
   updateFieldVisit,
   deleteFieldVisit,
   getTodayFollowUps,
   getDashboardSummary,
} from "../controller/fieldVisitController.js";
import {
   createFollowUp,
   getFollowUpsForVisit,
} from "../controller/followUpController.js";

const router = express.Router();

// Multer fields map matching the UI's multi-stream uploader parameters
// (onsite field photos + the five single KYC/document slots).
const fieldVisitUploadFields = upload.fields([
   { name: "images", maxCount: 10 },
   { name: "businessCardFront", maxCount: 1 },
   { name: "businessCardBack", maxCount: 1 },
   { name: "gstCertificate", maxCount: 1 },
   { name: "quotationDoc", maxCount: 1 },
   { name: "brochureDoc", maxCount: 1 },
]);

/* ==========================================================
   CORE FIELD VISIT ENDPOINTS

   Note on PUT /:id — it is used by the UI in two ways:
     1. Full edit form submission (multipart/form-data, may include
        new images/documents) — handled by fieldVisitUploadFields below.
     2. Lightweight JSON updates from the Follow-ups screen
        (reschedule: { followUpDate } / mark complete: { status }).
   Multer's `.fields()` middleware safely passes through requests that
   are not multipart, so both call shapes are supported by this single
   route without any UI changes required.
========================================================== */

router.post("/create", fieldVisitUploadFields, createFieldVisit);
router.put("/:id", fieldVisitUploadFields, updateFieldVisit);

/* ----- CRM Follow-up History (nested under a visit) ----- */
router.post("/:visitId/follow-up", createFollowUp);
router.get("/:visitId/follow-ups", getFollowUpsForVisit);

router.get("/dashboard/:userId", getDashboardSummary);
router.get("/employee/:userId/today-followups", getTodayFollowUps);
router.get("/employee/:userId", getMyFieldVisits);
router.get("/:id", getSingleFieldVisit);
router.delete("/:id", deleteFieldVisit);

export default router;