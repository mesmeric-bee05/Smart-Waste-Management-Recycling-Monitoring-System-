import { z } from "zod";

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(12).max(128),
  })
  .strict();

export const pointSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(24)
      .regex(/^[A-Za-z0-9_-]+$/),
    name: z.string().trim().min(2).max(80),
    address: z.string().trim().min(3).max(180),
    zone: z.string().trim().min(2).max(60),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    capacityLiters: z.coerce.number().int().min(60).max(1100),
    confirmCoordinatesReviewed: z.boolean().default(false),
    wasteCategories: z
      .array(z.enum(["PLASTIC", "PAPER", "GLASS", "METAL", "ORGANIC", "HAZARDOUS", "RESIDUAL", "EWASTE"]))
      .min(1)
      .max(8),
  })
  .strict();

export const scheduleSchema = z
  .object({
    pointId: z.string().uuid(),
    assignedCollectorId: z.string().uuid().optional().or(z.literal("")),
    scheduledAt: z.string().datetime({ offset: true }),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export const collectionCompletionSchema = z
  .object({
    collectionId: z.string().uuid(),
    materials: z
      .array(
        z
          .object({
            category: z.enum([
              "PLASTIC",
              "PAPER",
              "GLASS",
              "METAL",
              "ORGANIC",
              "HAZARDOUS",
              "RESIDUAL",
              "EWASTE",
            ]),
            weightKg: z.coerce.number().min(0).max(100000),
          })
          .strict(),
      )
      .max(8),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export const statusSchema = z
  .object({
    collectionId: z.string().uuid(),
    nextStatus: z.enum(["IN_PROGRESS", "MISSED", "CANCELLED"]),
  })
  .strict();

export const publicRequestSchema = z
  .object({
    pointId: z.string().uuid().optional().or(z.literal("")),
    requesterName: z.string().trim().max(80).optional(),
    contactEmail: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
    message: z.string().trim().min(12).max(1000),
  })
  .strict();

export const requestResolutionSchema = z
  .object({
    requestId: z.string().uuid(),
    nextStatus: z.enum(["ACKNOWLEDGED", "RESOLVED", "REJECTED"]),
    resolutionNote: z.string().trim().max(500).optional(),
  })
  .strict();

export const userInviteSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    role: z.enum(["SUPERVISOR", "COLLECTOR"]),
    password: z.string().min(12).max(128),
  })
  .strict();

export type PointInput = z.infer<typeof pointSchema>;
