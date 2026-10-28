"use client";

import { useActionState } from "react";
import { Activity, Archive, Check, Edit3, Plus, UserPlus } from "lucide-react";
import type { CollectionPoint, CollectionStatus, Role, User } from "@/generated/prisma/client";
import {
  advanceSimulationAction,
  completeCollectionAction,
  createPointAction,
  deactivatePointAction,
  inviteUserAction,
  markCollectionExceptionAction,
  rejectRequestAction,
  scheduleCollectionAction,
  startCollectionAction,
  updatePointAction,
  updateRequestAction,
  type ActionState,
} from "@/server/actions";

const blank: ActionState = { ok: false, message: "" };
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
function Feedback({ state }: { state: ActionState }) {
  return state.message ? (
    <p className={`feedback${state.ok ? "" : " feedback-error"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  ) : null;
}

function PointFields({ point }: { point?: CollectionPoint }) {
  const prefix = point ? `edit-${point.id}` : "new";
  return (
    <>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${prefix}-code`}>Point code</label>
          <input
            id={`${prefix}-code`}
            name="code"
            defaultValue={point?.code}
            required
            minLength={2}
            maxLength={24}
            pattern="[A-Za-z0-9_-]+"
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-name`}>Name</label>
          <input
            id={`${prefix}-name`}
            name="name"
            defaultValue={point?.name}
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-zone`}>Zone / service area</label>
          <input id={`${prefix}-zone`} name="zone" defaultValue={point?.zone} required maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-address`}>Address / description</label>
          <input
            id={`${prefix}-address`}
            name="address"
            defaultValue={point?.address}
            required
            maxLength={180}
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-lat`}>Latitude (−90 to 90)</label>
          <input
            id={`${prefix}-lat`}
            name="latitude"
            type="number"
            min="-90"
            max="90"
            step="any"
            defaultValue={point?.latitude}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-lon`}>Longitude (−180 to 180)</label>
          <input
            id={`${prefix}-lon`}
            name="longitude"
            type="number"
            min="-180"
            max="180"
            step="any"
            defaultValue={point?.longitude}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-capacity`}>Capacity (litres)</label>
          <input
            id={`${prefix}-capacity`}
            name="capacityLiters"
            type="number"
            min="60"
            max="1100"
            step="1"
            defaultValue={point?.capacityLiters ?? 240}
            required
          />
        </div>
        <fieldset className="field field-wide" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ color: "#435650", fontSize: 11, fontWeight: 650, marginBottom: 7 }}>
            Accepted waste categories
          </legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {categories.map((category) => (
              <label
                key={category}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11 }}
              >
                <input
                  type="checkbox"
                  name="wasteCategories"
                  value={category}
                  defaultChecked={
                    point
                      ? point.wasteCategories.includes(category)
                      : ["PLASTIC", "PAPER", "GLASS"].includes(category)
                  }
                />
                {category}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </>
  );
}

export function PointForm() {
  const [state, action, pending] = useActionState(createPointAction, blank);
  return (
    <details className="panel">
      <summary className="panel-head" style={{ cursor: "pointer", listStyle: "none" }}>
        <strong className="panel-title">
          <Plus size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />
          Add collection point
        </strong>
        <span className="muted" style={{ fontSize: 11 }}>
          Admin / supervisor
        </span>
      </summary>
      <div className="panel-body">
        <form action={action}>
          <PointFields />
          <div className="form-actions">
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? "Saving…" : "Create point"}
            </button>
          </div>
          <Feedback state={state} />
        </form>
      </div>
    </details>
  );
}

export function EditPointForm({ point }: { point: CollectionPoint }) {
  const [state, action, pending] = useActionState(updatePointAction, blank);
  return (
    <details>
      <summary className="button button-quiet" style={{ display: "inline-flex" }}>
        <Edit3 size={13} />
        Edit
      </summary>
      <form action={action} className="panel" style={{ padding: 12, marginTop: 8, minWidth: 280 }}>
        <input type="hidden" name="pointId" value={point.id} />
        <PointFields point={point} />
        {point.locationSource === "SIMULATED" && (
          <div className="field" style={{ marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <input type="checkbox" name="confirmCoordinatesReviewed" />
              <span>
                I independently checked these coordinates; they are manually entered site coordinates.
              </span>
            </label>
            <span className="field-help">Without confirmation, coordinates remain labeled SIMULATED.</span>
          </div>
        )}
        <div className="form-actions">
          <button className="button button-primary" disabled={pending} type="submit">
            {pending ? "Saving…" : "Save point"}
          </button>
        </div>
        <Feedback state={state} />
      </form>
    </details>
  );
}

export function DeactivatePointForm({ pointId }: { pointId: string }) {
  const [state, action, pending] = useActionState(deactivatePointAction, blank);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Deactivate this collection point? Historical collections will remain intact."))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="pointId" value={pointId} />
      <button className="button button-danger" type="submit" disabled={pending}>
        <Archive size={13} />
        {pending ? "Archiving…" : "Deactivate"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ScheduleForm({
  points,
  collectors,
}: {
  points: Array<Pick<CollectionPoint, "id" | "code" | "name" | "zone">>;
  collectors: Array<Pick<User, "id" | "fullName">>;
}) {
  const [state, action, pending] = useActionState(scheduleCollectionAction, blank);
  return (
    <details className="panel">
      <summary className="panel-head" style={{ cursor: "pointer", listStyle: "none" }}>
        <strong className="panel-title">
          <Plus size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />
          Schedule collection
        </strong>
        <span className="muted" style={{ fontSize: 11 }}>
          Admin / supervisor
        </span>
      </summary>
      <div className="panel-body">
        <form action={action}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="schedule-point">Collection point</label>
              <select id="schedule-point" name="pointId" required defaultValue="">
                <option value="" disabled>
                  Select an active point
                </option>
                {points.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.code} · {point.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="schedule-collector">Assigned collector</label>
              <select id="schedule-collector" name="assignedCollectorId" defaultValue="">
                <option value="">Unassigned</option>
                {collectors.map((collector) => (
                  <option key={collector.id} value={collector.id}>
                    {collector.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="schedule-date">Scheduled day</label>
              <input
                id="schedule-date"
                name="scheduledDate"
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
              />
              <span className="field-help">Stored at 12:00 UTC; this MVP does not model time zones.</span>
            </div>
            <div className="field">
              <label htmlFor="schedule-notes">Operational note (optional)</label>
              <input id="schedule-notes" name="notes" maxLength={500} />
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-primary" disabled={pending || points.length === 0} type="submit">
              {pending ? "Scheduling…" : "Create schedule"}
            </button>
          </div>
          <Feedback state={state} />
        </form>
      </div>
    </details>
  );
}

export function CollectionControls({
  id,
  status,
  role,
}: {
  id: string;
  status: CollectionStatus;
  role: Role;
}) {
  const [startState, startAction, startPending] = useActionState(startCollectionAction, blank);
  const [exceptionState, exceptionAction, exceptionPending] = useActionState(
    markCollectionExceptionAction,
    blank,
  );
  const [completeState, completeAction, completePending] = useActionState(completeCollectionAction, blank);
  if (status === "SCHEDULED")
    return (
      <div className="toolbar">
        <form action={startAction}>
          <input type="hidden" name="collectionId" value={id} />
          <button type="submit" className="button" disabled={startPending}>
            Start
          </button>
          <Feedback state={startState} />
        </form>
        {role !== "COLLECTOR" && (
          <form action={exceptionAction}>
            <input type="hidden" name="collectionId" value={id} />
            <input type="hidden" name="nextStatus" value="CANCELLED" />
            <button type="submit" className="button button-danger" disabled={exceptionPending}>
              Cancel
            </button>
            <Feedback state={exceptionState} />
          </form>
        )}
      </div>
    );
  if (status === "IN_PROGRESS")
    return (
      <details>
        <summary className="button" style={{ display: "inline-flex" }}>
          Record completion
        </summary>
        <form action={completeAction} className="panel" style={{ padding: 12, marginTop: 8, minWidth: 250 }}>
          <input type="hidden" name="collectionId" value={id} />
          <p className="muted" style={{ marginTop: 0, fontSize: 10 }}>
            Weights are in kilograms. Enter all materials recorded.
          </p>
          {categories.map((category) => (
            <div className="field" key={category} style={{ marginBottom: 7 }}>
              <label htmlFor={`${id}-${category}`}>{category} (kg)</label>
              <input
                id={`${id}-${category}`}
                name={`weight_${category}`}
                type="number"
                min="0"
                step="0.1"
                max="100000"
                defaultValue="0"
              />
            </div>
          ))}
          <div className="field">
            <label htmlFor={`${id}-notes`}>Completion note</label>
            <input id={`${id}-notes`} name="notes" maxLength={500} />
          </div>
          <button
            className="button button-primary"
            type="submit"
            style={{ marginTop: 10 }}
            disabled={completePending}
          >
            <Check size={14} />
            {completePending ? "Saving…" : "Complete collection"}
          </button>
          <Feedback state={completeState} />
        </form>
        <form action={exceptionAction} style={{ marginTop: 7 }}>
          <input type="hidden" name="collectionId" value={id} />
          <input type="hidden" name="nextStatus" value="MISSED" />
          <button type="submit" className="button button-quiet" disabled={exceptionPending}>
            Mark missed
          </button>
          <Feedback state={exceptionState} />
        </form>
      </details>
    );
  return <span className="muted">No further action</span>;
}

export function RequestControls({ requestId, status }: { requestId: string; status: string }) {
  const [state, action, pending] = useActionState(updateRequestAction, blank);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectRequestAction, blank);
  if (status === "OPEN")
    return (
      <div className="toolbar">
        <form action={action}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="nextStatus" value="ACKNOWLEDGED" />
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Acknowledge"}
          </button>
          <Feedback state={state} />
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input
            className="search-input"
            name="resolutionNote"
            aria-label="Rejection note"
            maxLength={500}
            placeholder="Rejection note (optional)"
          />
          <button className="button button-danger" type="submit" disabled={rejectPending}>
            Reject
          </button>
          <Feedback state={rejectState} />
        </form>
      </div>
    );
  if (status === "ACKNOWLEDGED")
    return (
      <div className="toolbar">
        <form action={action}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="nextStatus" value="RESOLVED" />
          <input
            className="search-input"
            name="resolutionNote"
            aria-label="Resolution note"
            maxLength={500}
            placeholder="Resolution note (optional)"
          />
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Resolve"}
          </button>
          <Feedback state={state} />
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input
            className="search-input"
            name="resolutionNote"
            aria-label="Rejection note"
            maxLength={500}
            placeholder="Rejection note (optional)"
          />
          <button className="button button-danger" type="submit" disabled={rejectPending}>
            Reject
          </button>
          <Feedback state={rejectState} />
        </form>
      </div>
    );
  return <span className="muted">Closed</span>;
}

export function SimulationControl() {
  const [state, action, pending] = useActionState(advanceSimulationAction, blank);
  return (
    <form action={action}>
      <button className="button button-primary" type="submit" disabled={pending}>
        <Activity size={15} />
        {pending ? "Generating sample…" : "Advance simulation"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function InviteUserForm() {
  const [state, action, pending] = useActionState(inviteUserAction, blank);
  return (
    <details className="panel">
      <summary className="panel-head" style={{ cursor: "pointer", listStyle: "none" }}>
        <strong className="panel-title">
          <UserPlus size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />
          Invite team member
        </strong>
      </summary>
      <div className="panel-body">
        <form action={action}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="invite-name">Full name</label>
              <input id="invite-name" name="fullName" required minLength={2} maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="invite-email">Work email</label>
              <input id="invite-email" name="email" type="email" required maxLength={254} />
            </div>
            <div className="field">
              <label htmlFor="invite-role">Role</label>
              <select id="invite-role" name="role">
                <option value="SUPERVISOR">Supervisor</option>
                <option value="COLLECTOR">Collector</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="invite-password">Temporary password</label>
              <input
                id="invite-password"
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
              <span className="field-help">
                Share through a separate secure channel; require rotation outside this MVP.
              </span>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              {pending ? "Inviting…" : "Invite account"}
            </button>
          </div>
          <Feedback state={state} />
        </form>
      </div>
    </details>
  );
}
