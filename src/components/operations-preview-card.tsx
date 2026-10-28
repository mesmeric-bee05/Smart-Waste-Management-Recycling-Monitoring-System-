import { BarChart3, MapPin, Recycle, ShieldCheck } from "lucide-react";

export function OperationsPreviewCard() {
  return (
    <div className="operations-illustration">
      <article className="operations-card" aria-labelledby="operations-preview-title">
        <header className="operations-card__header">
          <div className="operations-card__brand">
            <span className="operations-card__mark" aria-hidden="true">
              <Recycle size={17} />
            </span>
            <span>
              <strong>WasteOps</strong>
              <small>Illustrative workspace</small>
            </span>
          </div>
          <span className="operations-card__simulated">
            <span aria-hidden="true" /> SIMULATED
          </span>
        </header>

        <div className="operations-card__title-row">
          <div>
            <p className="operations-card__eyebrow">Example overview</p>
            <h2 id="operations-preview-title">Collection activity</h2>
          </div>
          <span className="operations-card__sample">SAMPLE ONLY</span>
        </div>

        <div className="operations-card__metrics" aria-label="Fictional sample values">
          <div className="operations-card__metric">
            <span>Planned stops</span>
            <strong>08</strong>
            <small>example schedule</small>
          </div>
          <div className="operations-card__metric">
            <span>Recorded material</span>
            <strong>
              1,240 <small>kg</small>
            </strong>
            <small>illustrative entry</small>
          </div>
          <div className="operations-card__metric">
            <span>Areas</span>
            <strong>04</strong>
            <small>sample zones</small>
          </div>
        </div>

        <div className="operations-card__lower">
          <div className="operations-card__route">
            <div className="operations-card__route-head">
              <span>
                <MapPin size={14} aria-hidden="true" /> Example route preview
              </span>
              <span>ZONE 02</span>
            </div>
            <div className="operations-card__map" aria-hidden="true">
              <svg viewBox="0 0 320 112" preserveAspectRatio="none">
                <path
                  className="operations-card__route-shadow"
                  d="M22 78 C64 75 48 34 102 39 S151 85 201 63 S259 22 299 35"
                />
                <path
                  className="operations-card__route-line"
                  d="M22 78 C64 75 48 34 102 39 S151 85 201 63 S259 22 299 35"
                />
                <circle cx="22" cy="78" r="6" />
                <circle cx="102" cy="39" r="6" />
                <circle cx="201" cy="63" r="6" />
                <circle cx="299" cy="35" r="6" />
              </svg>
              <span className="operations-card__map-label operations-card__map-label--one">A</span>
              <span className="operations-card__map-label operations-card__map-label--two">B</span>
              <span className="operations-card__map-label operations-card__map-label--three">C</span>
            </div>
          </div>
          <div className="operations-card__review">
            <span className="operations-card__review-icon" aria-hidden="true">
              <ShieldCheck size={17} />
            </span>
            <span>
              <strong>Human review</strong>
              <small>Route order is a preview</small>
            </span>
            <BarChart3 size={16} aria-hidden="true" />
          </div>
        </div>

        <p className="operations-card__note">
          Fictional example values only. No live sensors, vehicle GPS, or dispatch are connected.
        </p>
      </article>
      <span className="operations-illustration__orbit" aria-hidden="true" />
      <span className="operations-illustration__glow" aria-hidden="true" />
    </div>
  );
}
