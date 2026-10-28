"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { CollectionPoint, DataQuality, DataSource } from "@/generated/prisma/client";
import { MapPin } from "lucide-react";

const LeafletMap = dynamic(() => import("@/components/point-map-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="map-frame" role="status">
      Loading map…
    </div>
  ),
});

type Reading = {
  fillPct: number;
  isSimulated: boolean;
  source: DataSource;
  qualityStatus: DataQuality;
  recordedAt: Date;
};
type PointRow = Pick<
  CollectionPoint,
  "id" | "code" | "name" | "zone" | "latitude" | "longitude" | "locationSource"
> & {
  readings: Reading[];
};
type VehicleRow = {
  id: string;
  code: string;
  label: string;
  pings: Array<{
    latitude: number;
    longitude: number;
    isSimulated: boolean;
    source: DataSource;
    qualityStatus: DataQuality;
    recordedAt: Date;
  }>;
};

export function PointMap({ points, vehicles = [] }: { points: PointRow[]; vehicles?: VehicleRow[] }) {
  const normalized = useMemo(
    () =>
      points.map((point) => ({
        id: point.id,
        code: point.code,
        name: point.name,
        zone: point.zone,
        latitude: point.latitude,
        longitude: point.longitude,
        locationSource: point.locationSource,
        fillPct: point.readings[0]?.fillPct ?? null,
        isSimulated: point.readings[0]?.isSimulated ?? false,
        source: point.readings[0]?.source ?? null,
        qualityStatus: point.readings[0]?.qualityStatus ?? null,
        recordedAt: point.readings[0]?.recordedAt ?? null,
      })),
    [points],
  );
  const vehiclePositions = useMemo(
    () =>
      vehicles.flatMap((vehicle) =>
        vehicle.pings[0]
          ? [
              {
                id: vehicle.id,
                code: vehicle.code,
                label: vehicle.label,
                latitude: vehicle.pings[0].latitude,
                longitude: vehicle.pings[0].longitude,
                isSimulated: vehicle.pings[0].isSimulated,
                source: vehicle.pings[0].source,
                qualityStatus: vehicle.pings[0].qualityStatus,
                recordedAt: vehicle.pings[0].recordedAt,
              },
            ]
          : [],
      ),
    [vehicles],
  );
  if (!points.length && !vehiclePositions.length)
    return (
      <div className="panel empty-state">
        <MapPin size={22} style={{ margin: "0 auto 8px" }} />
        <p>Add geolocated collection points to preview them on the map.</p>
      </div>
    );
  return (
    <div>
      <LeafletMap points={normalized} vehicles={vehiclePositions} />
      <div className="map-legend">
        <span className="legend-item">
          <i className="legend-dot" />
          Normal / no recent sample
        </span>
        <span className="legend-item">
          <i className="legend-dot high" />
          80–94% sample fill
        </span>
        <span className="legend-item">
          <i className="legend-dot critical" />
          95%+ sample fill
        </span>
        <span className="legend-item">
          <i className="map-vehicle-key">V</i>Simulated vehicle sample
        </span>
        <span className="badge badge-simulated">All telemetry is SIMULATED; stale samples are labeled</span>
      </div>
    </div>
  );
}
