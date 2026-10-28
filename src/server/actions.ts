"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createPoint, deactivatePoint, updatePoint } from "@/server/services/points";
import {
  completeCollection,
  markCollectionException,
  scheduleCollection,
  startCollection,
} from "@/server/services/collections";
import { updateRequest } from "@/server/services/requests";
import { advanceSimulation } from "@/server/services/simulation";
import { inviteUser } from "@/server/services/users";
import { parseScheduleDateAtNoonUtc } from "@/domain/dates";

export type ActionState = { ok: boolean; message: string };
const initialActionState: ActionState = { ok: false, message: "" };

function errorText(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please review the submitted fields.";
  return "The operation could not be completed. Review the fields or contact an administrator.";
}
function get(form: FormData, name: string) {
  return String(form.get(name) ?? "");
}
function pointInput(form: FormData) {
  return {
    code: get(form, "code"),
    name: get(form, "name"),
    address: get(form, "address"),
    zone: get(form, "zone"),
    latitude: get(form, "latitude"),
    longitude: get(form, "longitude"),
    capacityLiters: get(form, "capacityLiters"),
    confirmCoordinatesReviewed: form.get("confirmCoordinatesReviewed") === "on",
    wasteCategories: form.getAll("wasteCategories").map(String),
  };
}

export async function createPointAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await createPoint(pointInput(form));
    revalidatePath("/collection-points");
    revalidatePath("/dashboard");
    return { ok: true, message: "Collection point created." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function updatePointAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await updatePoint(get(form, "pointId"), pointInput(form));
    revalidatePath("/collection-points");
    revalidatePath("/dashboard");
    revalidatePath("/collections");
    return { ok: true, message: "Collection point updated." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function deactivatePointAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await deactivatePoint(get(form, "pointId"));
    revalidatePath("/collection-points");
    revalidatePath("/dashboard");
    return { ok: true, message: "Collection point deactivated. Existing collection history is preserved." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function scheduleCollectionAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const scheduledAt = parseScheduleDateAtNoonUtc(get(form, "scheduledDate"));
    if (!scheduledAt) return { ok: false, message: "Choose a valid schedule date." };
    await scheduleCollection({
      pointId: get(form, "pointId"),
      assignedCollectorId: get(form, "assignedCollectorId"),
      scheduledAt: scheduledAt.toISOString(),
      notes: get(form, "notes"),
    });
    revalidatePath("/collections");
    revalidatePath("/dashboard");
    return { ok: true, message: "Collection scheduled." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function startCollectionAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await startCollection({ collectionId: get(form, "collectionId") });
    revalidatePath("/collections");
    revalidatePath("/dashboard");
    return { ok: true, message: "Collection started." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function markCollectionExceptionAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await markCollectionException({
      collectionId: get(form, "collectionId"),
      nextStatus: get(form, "nextStatus"),
    });
    revalidatePath("/collections");
    revalidatePath("/dashboard");
    return { ok: true, message: "Collection status updated." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function completeCollectionAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const categories = [
      "PLASTIC",
      "PAPER",
      "GLASS",
      "METAL",
      "ORGANIC",
      "HAZARDOUS",
      "RESIDUAL",
      "EWASTE",
    ] as const;
    const materials = categories
      .map((category) => ({ category, weightKg: Number(get(form, `weight_${category}`) || 0) }))
      .filter((item) => item.weightKg > 0);
    await completeCollection({
      collectionId: get(form, "collectionId"),
      materials,
      notes: get(form, "notes"),
    });
    revalidatePath("/collections");
    revalidatePath("/dashboard");
    revalidatePath("/recycling");
    revalidatePath("/reports");
    return { ok: true, message: "Collection completed and weights recorded." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function updateRequestAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await updateRequest({
      requestId: get(form, "requestId"),
      nextStatus: get(form, "nextStatus"),
      resolutionNote: get(form, "resolutionNote"),
    });
    revalidatePath("/requests");
    revalidatePath("/dashboard");
    return { ok: true, message: "Request updated." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function rejectRequestAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await updateRequest({
      requestId: get(form, "requestId"),
      nextStatus: "REJECTED",
      resolutionNote: get(form, "resolutionNote"),
    });
    revalidatePath("/requests");
    revalidatePath("/dashboard");
    return { ok: true, message: "Request rejected and recorded." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function advanceSimulationAction(
  _state: ActionState = initialActionState,
  _form: FormData,
): Promise<ActionState> {
  try {
    const result = await advanceSimulation();
    revalidatePath("/telemetry");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: `SIMULATED sample updated at ${new Date(result.recordedAt).toLocaleTimeString()}.`,
    };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
export async function inviteUserAction(
  _state: ActionState = initialActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await inviteUser({
      fullName: get(form, "fullName"),
      email: get(form, "email"),
      role: get(form, "role"),
      password: get(form, "password"),
    });
    revalidatePath("/settings");
    return { ok: true, message: "User invited. Share the initial password through a secure channel." };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
