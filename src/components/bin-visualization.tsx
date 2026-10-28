"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Box, Eye, EyeOff } from "lucide-react";

const Scene = dynamic(() => import("@/components/bin-visualization-scene"), {
  ssr: false,
  loading: () => (
    <div className="panel empty-state" role="status">
      Loading optional 3D view…
    </div>
  ),
});

export function BinVisualization({ fillPct }: { fillPct: number }) {
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  useEffect(() => {
    const target = container.current;
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => setInView(Boolean(entries[0]?.isIntersecting)), {
      rootMargin: "120px",
      threshold: 0.01,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const safeFill = Math.max(0, Math.min(100, fillPct));
  const renderScene = enabled && (inView || typeof IntersectionObserver === "undefined");
  return (
    <section ref={container} className="panel" aria-labelledby="visualization-title">
      <div className="panel-head">
        <div>
          <h2 className="panel-title" id="visualization-title">
            Bin fill · optional 3D view
          </h2>
          <p className="panel-subtitle">
            Illustrative visualization of the latest sample, not a physical sensor reading.
          </p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => setEnabled((current) => !current)}
          aria-pressed={enabled}
        >
          {enabled ? <EyeOff size={14} /> : <Eye size={14} />}
          {enabled ? "Disable 3D" : "Enable 3D"}
        </button>
      </div>
      <div className="panel-body">
        <p className="badge badge-simulated">
          <Box size={12} /> SIMULATED · {safeFill}% fill
        </p>
        {renderScene ? (
          <div
            style={{
              height: 230,
              borderRadius: 10,
              overflow: "hidden",
              background: "linear-gradient(180deg,#e9f3ef,#dceae5)",
            }}
          >
            <Scene fillPct={safeFill} reduceMotion={prefersReducedMotion} />
          </div>
        ) : (
          <div
            className="panel"
            role="img"
            aria-label={`Illustrative simulated bin fill: ${safeFill} percent`}
            style={{ padding: 18, background: "#f8fbf9" }}
          >
            <div className="fill-meter">
              <strong>{safeFill}%</strong>
              <div className="fill-track">
                <div
                  className={`fill-level${safeFill >= 95 ? " critical" : safeFill >= 80 ? " warning" : ""}`}
                  style={{ width: `${safeFill}%` }}
                />
              </div>
            </div>
            <p className="field-help">
              2D view active. Enable the optional 3D scene if useful; it renders only while near the viewport.
            </p>
          </div>
        )}
        <p className="field-help" style={{ marginBottom: 0 }}>
          Text and 2D equivalents remain available to assistive technology. Reduced-motion preference disables
          camera rotation.
        </p>
      </div>
    </section>
  );
}
