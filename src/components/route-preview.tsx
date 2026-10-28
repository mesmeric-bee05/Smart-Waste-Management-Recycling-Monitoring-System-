"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Route } from "lucide-react";
import { greedyPreview, type RoutePoint } from "@/domain/routing";

const RouteScene = dynamic(() => import("@/components/route-visualization-scene"), {
  ssr: false,
  loading: () => (
    <div className="empty-state" role="status">
      Loading optional 3D route…
    </div>
  ),
});

export function RoutePreview({ points }: { points: RoutePoint[] }) {
  const [startId, setStartId] = useState(points[0]?.id ?? "");
  const [show3d, setShow3d] = useState(false);
  const route = useMemo(() => greedyPreview(points, startId), [points, startId]);
  const total = route.reduce((sum, point) => sum + point.legKm, 0);
  if (!points.length)
    return (
      <section className="panel empty-state">
        <Route size={20} style={{ margin: "0 auto 8px" }} />
        <p>Schedule at least one collection to see a route-order preview.</p>
      </section>
    );
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Collection sequence preview</h2>
          <p className="panel-subtitle">
            A simple nearest-neighbor order from decimal coordinates—not road distance or travel time.
          </p>
        </div>
        <span className="badge badge-simulated">HUMAN REVIEW · NO DISPATCH</span>
      </div>
      <div className="panel-body">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="route-start">Suggested start point</label>
            <select id="route-start" value={startId} onChange={(event) => setStartId(event.target.value)}>
              {points.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.code} · {point.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Total straight-line distance</label>
            <div className="mono" style={{ padding: "9px 0", fontSize: 20, fontWeight: 700 }}>
              {total.toFixed(2)} km
            </div>
          </div>
        </div>
        <div className="toolbar" style={{ marginTop: 10 }}>
          <button
            className="button"
            type="button"
            aria-pressed={show3d}
            onClick={() => setShow3d((value) => !value)}
          >
            {show3d ? <EyeOff size={14} /> : <Eye size={14} />}
            {show3d ? "Disable 3D route" : "Optional 3D route"}
          </button>
          <span className="field-help">
            3D is off by default; the ordered list below is the accessible alternative.
          </span>
        </div>
        {show3d && route.length >= 2 && (
          <div
            style={{
              height: 190,
              margin: "12px 0",
              borderRadius: 10,
              overflow: "hidden",
              background: "#eaf3ef",
            }}
          >
            <RouteScene points={route.map(({ latitude, longitude }) => ({ latitude, longitude }))} />
          </div>
        )}
        <ol className="route-list" aria-label="Suggested collection visit order">
          {route.map((point, index) => (
            <li key={point.id}>
              <span className="route-number">{index + 1}</span>
              <span>
                <strong>
                  {point.code} · {point.name}
                </strong>
                <br />
                <small>
                  {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)} · {point.legKm.toFixed(2)} km
                  straight-line leg
                </small>
              </span>
            </li>
          ))}
        </ol>
        <div className="simulation-banner" style={{ marginTop: 12 }}>
          <span className="badge badge-simulated">NOT FOR NAVIGATION</span>
          <span>
            Distances are geodesic between stops; the order is a simple heuristic. It ignores road networks,
            traffic, vehicle capacity, restricted roads, collection windows and safety. A supervisor must
            validate any actual plan. Nothing is dispatched.
          </span>
        </div>
      </div>
    </section>
  );
}
