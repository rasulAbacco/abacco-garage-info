import prisma from "../config/prisma.js";
import { uploadToCloudflare } from "../utils/cloudflare.js";

/* ==========================================================
   SHARED HELPERS
========================================================== */

// Document-type keys accepted via multipart upload, mapped to the
// imageType value stored against FieldVisitImage, and to the flat
// response field the UI reads the saved URL back from
// (visit.businessCardFront, visit.gstCertificate, etc.)
const DOCUMENT_TYPE_MAP = {
    businessCardFront: "BUSINESS_CARD_FRONT",
    businessCardBack: "BUSINESS_CARD_BACK",
    gstCertificate: "GST_CERTIFICATE",
    quotationDoc: "QUOTATION",
    brochureDoc: "BROCHURE",
};

// Reverse lookup: imageType -> UI document key
const IMAGE_TYPE_TO_DOC_KEY = Object.fromEntries(
    Object.entries(DOCUMENT_TYPE_MAP).map(([key, type]) => [type, key])
);

/**
 * Safely parse a value that may already be an array/object (when sent as
 * JSON) or a JSON string (when sent as part of multipart/form-data).
 * Falls back to `fallback` if parsing fails or the value is missing.
 */
const parseJsonField = (value, fallback = []) => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

/**
 * Parses a numeric field that may arrive as a string, empty string,
 * undefined, or already-numeric value. Returns null when not parseable.
 */
const parseNullableFloat = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Parses a nullable date field, returning null for empty/invalid input.
 */
const parseNullableDate = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const VISIT_INCLUDE = {
    images: {
        orderBy: { createdAt: "desc" },
    },
    employee: {
        select: { id: true, name: true, email: true, marketingType: true },
    },
    followUps: {
        orderBy: { followUpDate: "desc" },
    },
};

/**
 * The UI's list/detail/edit screens render a flat shape on each visit
 * object:
 *   - visit.images            -> ONLY the onsite "FIELD_PHOTO" images
 *   - visit.businessCardFront -> direct URL string (or null)
 *   - visit.businessCardBack  -> direct URL string (or null)
 *   - visit.gstCertificate    -> direct URL string (or null)
 *   - visit.quotationDoc      -> direct URL string (or null)
 *   - visit.brochureDoc       -> direct URL string (or null)
 *   - visit.contactPerson / visit.phoneNumber / visit.email / visit.notes
 *     -> convenience fields derived from contacts/emails/discussionSummary
 *
 * This helper builds that exact shape from a raw Prisma FieldVisit record
 * (with `images` + `employee` included) without losing any of the
 * underlying structured data (contacts/emails/interestedProducts/images
 * are still included in full for any consumer that needs the detail).
 */
const presentFieldVisit = (visit) => {
    if (!visit) return visit;

    const contacts = Array.isArray(visit.contacts) ? visit.contacts : [];
    const emails = Array.isArray(visit.emails) ? visit.emails : [];
    const allImages = Array.isArray(visit.images) ? visit.images : [];
    const followUps = Array.isArray(visit.followUps) ? visit.followUps : [];
    // followUps is already ordered newest-first (by followUpDate desc); the
    // most recent entry drives the card summary (next follow-up date,
    // latest remark, priority badge).
    const latestFollowUp = followUps[0] || null;

    const primaryContact =
        contacts.find((c) => c?.isPrimary) || contacts[0] || null;

    // Split the flat image rows back into:
    //   - fieldPhotos -> rendered as the onsite gallery (visit.images)
    //   - documents   -> flattened onto individual named fields
    const fieldPhotos = [];
    const documentUrls = {
        businessCardFront: null,
        businessCardBack: null,
        gstCertificate: null,
        quotationDoc: null,
        brochureDoc: null,
    };

    for (const img of allImages) {
        const docKey = IMAGE_TYPE_TO_DOC_KEY[img.imageType];
        if (docKey) {
            // Keep the most recent of each document type (images are
            // already ordered by createdAt desc, so first wins).
            if (!documentUrls[docKey]) {
                documentUrls[docKey] = img.imageUrl;
            }
        } else {
            // FIELD_PHOTO (or any other/unknown type) -> onsite gallery
            fieldPhotos.push(img);
        }
    }

    return {
        ...visit,
        contacts,
        emails,
        interestedProducts: Array.isArray(visit.interestedProducts)
            ? visit.interestedProducts
            : [],
        images: fieldPhotos,
        ...documentUrls,
        // Flattened convenience fields expected by the UI list/dashboard views
        contactPerson: primaryContact?.name || null,
        contactDesignation: primaryContact?.designation || null,
        phoneNumber: primaryContact?.phoneNumber || null,
        email: emails[0] || null,
        notes: visit.discussionSummary || null,
        // ----- Follow-up CRM history (newest first) + card summary -----
        followUps,
        nextFollowUpDate: latestFollowUp?.followUpDate || visit.followUpDate || null,
        latestFollowUpRemark: latestFollowUp?.remark || null,
        latestFollowUpStatus: latestFollowUp?.status || null,
        latestFollowUpPriority: latestFollowUp?.priority || visit.priority || null,
    };
};

const presentFieldVisitList = (visits) => visits.map(presentFieldVisit);

/**
 * Shared image/document upload pipeline used by both create and update.
 * Uploads any files present on req.files to Cloudflare and returns an
 * array of FieldVisitImage row payloads ready for createMany().
 */
const buildImageUploadPayloads = async (req, visitId) => {
    const imagePayloads = [];

    if (!req.files) return imagePayloads;

    if (req.files["images"]) {
        for (const file of req.files["images"]) {
            const uploaded = await uploadToCloudflare(file, "field-visits", visitId);
            imagePayloads.push({
                imageUrl: uploaded.imageUrl,
                publicId: uploaded.publicId,
                imageType: "FIELD_PHOTO",
                visitId,
            });
        }
    }

    for (const key of Object.keys(DOCUMENT_TYPE_MAP)) {
        const file = req.files[key]?.[0];
        if (file) {
            const uploaded = await uploadToCloudflare(file, "field-visits-docs", visitId);
            imagePayloads.push({
                imageUrl: uploaded.imageUrl,
                publicId: uploaded.publicId,
                imageType: DOCUMENT_TYPE_MAP[key],
                visitId,
            });
        }
    }

    return imagePayloads;
};

/* ==========================================================
   CREATE FIELD VISIT
========================================================== */

export const createFieldVisit = async (req, res) => {
    try {
        const {
            title,
            address,
            city,
            district,
            state,
            latitude,
            longitude,
            marketingType,
            businessCategory,
            source,
            priority,
            status,
            nextFollowUpMode,
            meetingResult,
            leadValue,
            visitedDate,
            followUpDate,
            discussionSummary,
            referredByName,
            referredByPhone,
            contacts,
            emails,
            interestedProducts,
            employeeId,
        } = req.body;

        // Required-field validation matching the UI's own client-side checks
        if (!title || !String(title).trim()) {
            return res.status(400).json({
                success: false,
                message: "Business name (title) is required.",
            });
        }

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required.",
            });
        }

        const parsedContacts = parseJsonField(contacts, []);
        const parsedEmails = parseJsonField(emails, []);
        const parsedProducts = parseJsonField(interestedProducts, []);

        const validContacts = Array.isArray(parsedContacts)
            ? parsedContacts.filter((c) => c?.name?.trim() && c?.phoneNumber?.trim())
            : [];

        if (validContacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one contact with a name and phone number is required.",
            });
        }

        if (!validContacts.some((c) => c.isPrimary)) {
            return res.status(400).json({
                success: false,
                message: "Exactly one contact must be marked as primary.",
            });
        }

        const fieldVisit = await prisma.fieldVisit.create({
            data: {
                title: title.trim(),
                address: address?.trim() || null,
                city: city?.trim() || null,
                district: district?.trim() || null,
                state: state?.trim() || null,
                latitude: parseNullableFloat(latitude),
                longitude: parseNullableFloat(longitude),
                marketingType: marketingType?.trim() || "GENERAL",
                businessCategory: businessCategory?.trim() || "Car Garage",
                source: source?.trim() || "Cold Visit",
                priority: priority?.trim() || "Medium",
                status: status?.trim() || "PENDING",
                nextFollowUpMode: nextFollowUpMode?.trim() || "Call",
                meetingResult: meetingResult?.trim() || "Discussed",
                leadValue: parseNullableFloat(leadValue),
                visitedDate: parseNullableDate(visitedDate) || new Date(),
                followUpDate: parseNullableDate(followUpDate),
                discussionSummary: discussionSummary?.trim() || null,
                referredByName: referredByName?.trim() || null,
                referredByPhone: referredByPhone?.trim() || null,
                contacts: validContacts,
                emails: Array.isArray(parsedEmails)
                    ? parsedEmails.filter((e) => e && e.trim())
                    : [],
                interestedProducts: Array.isArray(parsedProducts) ? parsedProducts : [],
                employeeId,
            },
        });

        // ----- Image / document upload pipeline -----
        const imagePayloads = await buildImageUploadPayloads(req, fieldVisit.id);

        if (imagePayloads.length > 0) {
            await prisma.fieldVisitImage.createMany({ data: imagePayloads });
        }

        const finalVisit = await prisma.fieldVisit.findUnique({
            where: { id: fieldVisit.id },
            include: VISIT_INCLUDE,
        });

        // The UI's Add Visit screen does not read the response body on
        // success (only the error path is inspected), but we still return
        // the fully flattened visit for any consumer that does.
        return res.status(201).json(presentFieldVisit(finalVisit));
    } catch (error) {
        console.error("createFieldVisit:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create field visit.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   GET MY FIELD VISITS (supports optional search / filter
   query params, while still returning every record by default so the
   UI's own client-side filtering/pagination continues to work)
========================================================== */

export const getMyFieldVisits = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, marketingType, search } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required.",
            });
        }

        const where = { employeeId: userId };

        if (status) {
            where.status = status.toUpperCase();
        }

        if (marketingType) {
            where.marketingType = marketingType;
        }

        if (search && search.trim()) {
            const term = search.trim();
            where.OR = [
                { title: { contains: term, mode: "insensitive" } },
                { city: { contains: term, mode: "insensitive" } },
                { state: { contains: term, mode: "insensitive" } },
            ];
        }

        const visits = await prisma.fieldVisit.findMany({
            where,
            include: VISIT_INCLUDE,
            orderBy: { createdAt: "desc" },
        });

        const presented = presentFieldVisitList(visits);

        // FieldAgentMyVisits.jsx / FieldAgentDashboard.jsx accept either a
        // raw array or { visits: [...] } - we send the richer shape.
        return res.status(200).json({
            success: true,
            total: presented.length,
            visits: presented,
        });
    } catch (error) {
        console.error("getMyFieldVisits:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch field visits.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   GET SINGLE FIELD VISIT
   FieldAgentVisitDetails.jsx / FieldAgentEditVisit.jsx both read the
   response body directly as the visit object (`setVisit(response.data)`),
   not wrapped in { success, data } — so this endpoint returns the
   flattened visit object directly at the top level.
========================================================== */

export const getSingleFieldVisit = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Field visit ID is required.",
            });
        }

        const visit = await prisma.fieldVisit.findUnique({
            where: { id },
            include: VISIT_INCLUDE,
        });

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Field visit not found.",
            });
        }

        return res.status(200).json(presentFieldVisit(visit));
    } catch (error) {
        console.error("getSingleFieldVisit:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch field visit.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   UPDATE FIELD VISIT
   Supports two call shapes used by the UI:
     1. Full multipart/form-data edit (FieldAgentEditVisit.jsx) — all
        fields + optional new files + `deletedImageIds` (JSON array of
        FieldVisitImage ids to remove, covers both field photos and any
        re-uploaded KYC documents).
     2. Partial JSON body update used by the Follow-ups screen, e.g.
        { followUpDate: "2026-07-01" } to reschedule, or
        { status: "CUSTOMER" } to mark a lead converted.
   Only fields actually present on the request body are touched, so a
   partial JSON update never wipes out contacts/emails/products/images.
========================================================== */

export const updateFieldVisit = async (req, res) => {
    try {
        const { id } = req.params;

        const existingVisit = await prisma.fieldVisit.findUnique({ where: { id } });

        if (!existingVisit) {
            return res.status(404).json({
                success: false,
                message: "Field visit not found.",
            });
        }

        const body = req.body || {};
        const data = {};

        // ----- Simple scalar string fields: only set if provided -----
        const stringFields = [
            "title",
            "address",
            "city",
            "district",
            "state",
            "marketingType",
            "businessCategory",
            "source",
            "priority",
            "status",
            "nextFollowUpMode",
            "meetingResult",
            "discussionSummary",
            "referredByName",
            "referredByPhone",
        ];

        for (const field of stringFields) {
            if (body[field] !== undefined) {
                const value = body[field];
                data[field] = typeof value === "string" ? value.trim() || null : value;
            }
        }

        // Title should never be cleared out if explicitly sent empty
        if (data.title === null) {
            return res.status(400).json({
                success: false,
                message: "Business name (title) cannot be empty.",
            });
        }

        // ----- Numeric fields -----
        if (body.latitude !== undefined) data.latitude = parseNullableFloat(body.latitude);
        if (body.longitude !== undefined) data.longitude = parseNullableFloat(body.longitude);
        if (body.leadValue !== undefined) data.leadValue = parseNullableFloat(body.leadValue);

        // ----- Date fields -----
        if (body.visitedDate !== undefined) {
            data.visitedDate = parseNullableDate(body.visitedDate);
        }
        if (body.followUpDate !== undefined) {
            data.followUpDate = parseNullableDate(body.followUpDate);
        }

        // ----- JSON array fields -----
        if (body.contacts !== undefined) {
            const parsedContacts = parseJsonField(body.contacts, []);
            data.contacts = Array.isArray(parsedContacts) ? parsedContacts : [];
        }

        if (body.emails !== undefined) {
            const parsedEmails = parseJsonField(body.emails, []);
            data.emails = Array.isArray(parsedEmails)
                ? parsedEmails.filter((e) => e && e.trim())
                : [];
        }

        if (body.interestedProducts !== undefined) {
            const parsedProducts = parseJsonField(body.interestedProducts, []);
            data.interestedProducts = Array.isArray(parsedProducts) ? parsedProducts : [];
        }

        if (Object.keys(data).length > 0) {
            await prisma.fieldVisit.update({ where: { id }, data });
        }

        // ----- Deleted images (Edit screen's "Will Purge" flow) -----
        // FieldAgentEditVisit.jsx always sends deletedImageIds (possibly
        // an empty array) on every multipart submission; harmless no-op
        // when empty, removes the marked rows (and re-uploaded document
        // slots, since those are stored as FieldVisitImage rows too)
        // when populated.
        if (body.deletedImageIds !== undefined) {
            const parsedDeletedIds = parseJsonField(body.deletedImageIds, []);
            const deletedIds = Array.isArray(parsedDeletedIds)
                ? parsedDeletedIds.filter(Boolean)
                : [];

            if (deletedIds.length > 0) {
                await prisma.fieldVisitImage.deleteMany({
                    where: { id: { in: deletedIds }, visitId: id },
                });
            }
        }

        // ----- Newly attached images / documents (multipart edit only) -----
        // Re-uploading a KYC/document slot (e.g. a new GST certificate)
        // adds a new FieldVisitImage row of that type; presentFieldVisit
        // always surfaces the most recently created row per document
        // type, so the old one becomes orphaned data unless explicitly
        // deleted — replace it outright here so a re-upload behaves like
        // a real replace rather than leaving stale rows behind.
        if (req.files) {
            const replacingDocTypes = Object.keys(DOCUMENT_TYPE_MAP)
                .filter((key) => req.files[key]?.[0])
                .map((key) => DOCUMENT_TYPE_MAP[key]);

            if (replacingDocTypes.length > 0) {
                await prisma.fieldVisitImage.deleteMany({
                    where: { visitId: id, imageType: { in: replacingDocTypes } },
                });
            }
        }

        const uploadedFiles = await buildImageUploadPayloads(req, id);

        if (uploadedFiles.length > 0) {
            await prisma.fieldVisitImage.createMany({ data: uploadedFiles });
        }

        const updatedVisit = await prisma.fieldVisit.findUnique({
            where: { id },
            include: VISIT_INCLUDE,
        });

        return res.status(200).json(presentFieldVisit(updatedVisit));
    } catch (error) {
        console.error("updateFieldVisit:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update field visit.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   DELETE FIELD VISIT
========================================================== */

export const deleteFieldVisit = async (req, res) => {
    try {
        const { id } = req.params;

        const visit = await prisma.fieldVisit.findUnique({
            where: { id },
            include: { images: true },
        });

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Field visit not found.",
            });
        }

        // Images cascade automatically via the schema's onDelete: Cascade,
        // but we delete explicitly first to keep behaviour deterministic
        // regardless of DB-level cascade configuration.
        await prisma.fieldVisitImage.deleteMany({ where: { visitId: id } });
        await prisma.fieldVisit.delete({ where: { id } });

        return res.status(200).json({
            success: true,
            message: "Field visit deleted successfully.",
        });
    } catch (error) {
        console.error("deleteFieldVisit:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete field visit.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   GET TODAY'S FOLLOW UPS
========================================================== */

export const getTodayFollowUps = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required.",
            });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const followUps = await prisma.fieldVisit.findMany({
            where: {
                employeeId: userId,
                followUpDate: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
                status: {
                    not: "CLOSED",
                },
            },
            include: VISIT_INCLUDE,
            orderBy: { followUpDate: "asc" },
        });

        const presented = presentFieldVisitList(followUps);

        return res.status(200).json({
            success: true,
            total: presented.length,
            followUps: presented,
        });
    } catch (error) {
        console.error("getTodayFollowUps:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch today's follow-ups.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   GET DASHBOARD SUMMARY
   Field names below match exactly what FieldAgentDashboard.jsx and
   FieldAgentProfile.jsx read off `summaryData` (a flat top-level object,
   no { success, ... } wrapper needed around the counts since the UI
   reads e.g. `summaryData?.todayVisitsCount` straight off response.data).
========================================================== */

export const getDashboardSummary = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required.",
            });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
        const endOfMonth = new Date(
            startOfToday.getFullYear(),
            startOfToday.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );

        const [
            totalVisitsCount,
            todayVisitsCount,
            thisMonthVisitsCount,
            pendingFollowUpsCount,
            interestedLeadsCount,
            closedDealsCount,
            todayFollowUpsCount,
            upcomingFollowUpsCount,
            overdueFollowUpsCount,
            completedTodayCount,
        ] = await Promise.all([
            prisma.fieldVisit.count({ where: { employeeId: userId } }),
            prisma.fieldVisit.count({
                where: {
                    employeeId: userId,
                    createdAt: { gte: startOfToday, lte: endOfToday },
                },
            }),
            prisma.fieldVisit.count({
                where: {
                    employeeId: userId,
                    createdAt: { gte: startOfMonth, lte: endOfMonth },
                },
            }),
            prisma.fieldVisit.count({
                where: {
                    employeeId: userId,
                    followUpDate: { not: null },
                    status: { not: "CLOSED" },
                },
            }),
            prisma.fieldVisit.count({
                where: { employeeId: userId, status: "INTERESTED" },
            }),
            prisma.fieldVisit.count({
                where: { employeeId: userId, status: "CUSTOMER" },
            }),
            // Today's follow-ups: any visit (for this agent) whose latest
            // follow-up entry falls within today.
            prisma.visitFollowUp.count({
                where: {
                    visit: { employeeId: userId },
                    followUpDate: { gte: startOfToday, lte: endOfToday },
                },
            }),
            // Upcoming follow-ups: scheduled strictly after today.
            prisma.visitFollowUp.count({
                where: {
                    visit: { employeeId: userId },
                    followUpDate: { gt: endOfToday },
                },
            }),
            // Overdue follow-ups: scheduled before today and the visit is
            // still active (not converted/closed/dropped).
            prisma.visitFollowUp.count({
                where: {
                    visit: {
                        employeeId: userId,
                        status: { notIn: ["CUSTOMER", "CLOSED", "NOT_INTERESTED"] },
                    },
                    followUpDate: { lt: startOfToday },
                },
            }),
            // Completed today: follow-up entries logged today whose status
            // reflects a completed/converted outcome.
            prisma.visitFollowUp.count({
                where: {
                    visit: { employeeId: userId },
                    status: { in: ["Customer", "Not Interested"] },
                    updatedAt: { gte: startOfToday, lte: endOfToday },
                },
            }),
        ]);

        return res.status(200).json({
            success: true,
            todayVisitsCount,
            totalVisitsCount,
            thisMonthVisitsCount,
            pendingFollowUpsCount,
            interestedLeadsCount,
            closedDealsCount,
            todayFollowUpsCount,
            upcomingFollowUpsCount,
            overdueFollowUpsCount,
            completedTodayCount,
        });
    } catch (error) {
        console.error("getDashboardSummary:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};