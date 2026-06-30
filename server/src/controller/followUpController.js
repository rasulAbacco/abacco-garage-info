// server/src/controller/followUpController.js
import prisma from "../config/prisma.js";

/* ==========================================================
   SHARED HELPERS
========================================================== */

const VALID_STATUSES = ["Pending", "Follow Up", "Interested", "Customer", "Not Interested"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Keeps the parent FieldVisit's flat `followUpDate` (and, when relevant,
 * `status`) column in sync with the latest follow-up entry so existing
 * features (dashboard summary, today's-followups screen, visit cards
 * elsewhere) keep working without any change to their own queries.
 */
const syncParentVisitFromLatestFollowUp = async (visitId) => {
    const latest = await prisma.visitFollowUp.findFirst({
        where: { visitId },
        orderBy: { followUpDate: "desc" },
    });

    if (latest) {
        await prisma.fieldVisit.update({
            where: { id: visitId },
            data: { followUpDate: latest.followUpDate },
        });
    }
};

/* ==========================================================
   CREATE FOLLOW-UP
   POST /api/field-visit/:visitId/follow-up
========================================================== */

export const createFollowUp = async (req, res) => {
    try {
        const { visitId } = req.params;
        const { remark, status, priority, followUpDate, createdBy } = req.body || {};

        const visit = await prisma.fieldVisit.findUnique({ where: { id: visitId } });
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Field visit not found.",
            });
        }

        // ----- Validation -----
        if (!remark || !String(remark).trim()) {
            return res.status(400).json({
                success: false,
                message: "Remark is required.",
            });
        }

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status is required and must be one of: ${VALID_STATUSES.join(", ")}.`,
            });
        }

        const parsedFollowUpDate = parseDate(followUpDate);
        if (!parsedFollowUpDate) {
            return res.status(400).json({
                success: false,
                message: "A valid next follow-up date is required.",
            });
        }

        const safePriority = VALID_PRIORITIES.includes(priority) ? priority : "Medium";

        const followUp = await prisma.visitFollowUp.create({
            data: {
                visitId,
                remark: String(remark).trim(),
                status,
                priority: safePriority,
                followUpDate: parsedFollowUpDate,
                createdBy: createdBy || visit.employeeId || null,
            },
        });

        // Keep the parent visit's followUpDate (and status, when the
        // follow-up status maps to a visit lifecycle stage) in sync.
        await prisma.fieldVisit.update({
            where: { id: visitId },
            data: {
                followUpDate: parsedFollowUpDate,
                ...(["Interested", "Customer", "Not Interested"].includes(status)
                    ? { status: status === "Not Interested" ? "NOT_INTERESTED" : status.toUpperCase().replace(" ", "_") }
                    : {}),
            },
        });

        const updatedVisit = await prisma.fieldVisit.findUnique({
            where: { id: visitId },
            include: { followUps: { orderBy: { followUpDate: "desc" } } },
        });

        return res.status(201).json({
            success: true,
            message: "Follow-up added successfully.",
            followUp,
            followUps: updatedVisit?.followUps || [],
        });
    } catch (error) {
        console.error("createFollowUp:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create follow-up.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   GET FOLLOW-UPS FOR A VISIT (newest first)
   GET /api/field-visit/:visitId/follow-ups
========================================================== */

export const getFollowUpsForVisit = async (req, res) => {
    try {
        const { visitId } = req.params;

        const visit = await prisma.fieldVisit.findUnique({ where: { id: visitId } });
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Field visit not found.",
            });
        }

        const followUps = await prisma.visitFollowUp.findMany({
            where: { visitId },
            orderBy: { followUpDate: "desc" },
        });

        return res.status(200).json({
            success: true,
            total: followUps.length,
            followUps,
        });
    } catch (error) {
        console.error("getFollowUpsForVisit:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch follow-up history.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   UPDATE FOLLOW-UP
   PUT /api/follow-up/:id
========================================================== */

export const updateFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const { remark, status, priority, followUpDate } = req.body || {};

        const existing = await prisma.visitFollowUp.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Follow-up record not found.",
            });
        }

        const data = {};

        if (remark !== undefined) {
            if (!String(remark).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Remark cannot be empty.",
                });
            }
            data.remark = String(remark).trim();
        }

        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
                });
            }
            data.status = status;
        }

        if (priority !== undefined) {
            data.priority = VALID_PRIORITIES.includes(priority) ? priority : "Medium";
        }

        if (followUpDate !== undefined) {
            const parsed = parseDate(followUpDate);
            if (!parsed) {
                return res.status(400).json({
                    success: false,
                    message: "A valid next follow-up date is required.",
                });
            }
            data.followUpDate = parsed;
        }

        const updated = await prisma.visitFollowUp.update({ where: { id }, data });

        await syncParentVisitFromLatestFollowUp(existing.visitId);

        return res.status(200).json({
            success: true,
            message: "Follow-up updated successfully.",
            followUp: updated,
        });
    } catch (error) {
        console.error("updateFollowUp:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update follow-up.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/* ==========================================================
   DELETE FOLLOW-UP
   DELETE /api/follow-up/:id
========================================================== */

export const deleteFollowUp = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.visitFollowUp.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Follow-up record not found.",
            });
        }

        await prisma.visitFollowUp.delete({ where: { id } });
        await syncParentVisitFromLatestFollowUp(existing.visitId);

        return res.status(200).json({
            success: true,
            message: "Follow-up deleted successfully.",
        });
    } catch (error) {
        console.error("deleteFollowUp:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete follow-up.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};