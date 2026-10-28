"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

const pointIcon = (tone: string) =>
  L.divIcon({
    className: "",
    html: `<span class="map-pin map-pin-${tone}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
const vehicleIcon = L.divIcon({
  className: "",
  html: '<span class="map-vehicle-pin">V</span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});
type MapPoint = {
  id: string;
  code: string;
  name: string;
  zone: string;
  latitude: number;
  longitude: number;
  locationSource: string;
  fillPct: number | null;
  isSimulated: boolean;
  source: string | null;
  qualityStatus: string | null;
  recordedAt: Date | null;
};
type MapVehicle = {
  id: string;
  code: string;
  label: string;
  latitude: number;
  longitude: number;
  isSimulated: boolean;
  source: string;
  qualityStatus: string;
  recordedAt: Date;
};
function FitBounds({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) map.setView(positions[0]!, 13);
    else if (positions.length > 1)
      map.fitBounds(L.latLngBounds(positions), { padding: [28, 28], maxZoom: 14 });
  }, [map, positions]);
  return null;
}

export default function PointMapLeaflet({
  points,
  vehicles = [],
}: {
  points: MapPoint[];
  vehicles?: MapVehicle[];
}) {
  const positions = useMemo(
    () => [
      ...points.map((point) => [point.latitude, point.longitude] as [number, number]),
      ...vehicles.map((vehicle) => [vehicle.latitude, vehicle.longitude] as [number, number]),
    ],
    [points, vehicles],
  );
  const center: [number, number] = positions[0] ?? [0, 0];
  return (
    <div
      className="map-frame"
      role="img"
      aria-label="Map of registered collection points and simulated vehicle sample locations"
    >
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} preferCanvas>
        <FitBounds positions={positions} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => {
          const tone =
            point.qualityStatus === "STALE"
              ? "stale"
              : (point.fillPct ?? 0) >= 95
                ? "critical"
                : (point.fillPct ?? 0) >= 80
                  ? "warning"
                  : "normal";
          return (
            <Marker key={point.id} position={[point.latitude, point.longitude]} icon={pointIcon(tone)}>
              <Popup>
                <strong>
                  {point.code} · {point.name}
                </strong>
                <br />
                {point.zone}
                <br />
                {point.locationSource === "SIMULATED"
                  ? "SIMULATED DEMO COORDINATES"
                  : `${point.locationSource} COORDINATES`}
                <br />
                {point.fillPct === null ? "No reading" : `Fill: ${point.fillPct}%`}
                {point.isSimulated ? " · SIMULATED" : ""}
                <br />
                {point.qualityStatus === "STALE" ? "STALE SAMPLE" : (point.qualityStatus ?? "No sample")}
                {point.recordedAt ? ` · ${point.recordedAt.toLocaleString()}` : ""}
              </Popup>
            </Marker>
          );
        })}
        {vehicles.map((vehicle) => (
          <Marker
            key={`vehicle-${vehicle.id}`}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={vehicleIcon}
          >
            <Popup>
              <strong>
                {vehicle.code} · {vehicle.label}
              </strong>
              <br />
              SIMULATED VEHICLE LOCATION
              <br />
              {vehicle.qualityStatus === "STALE" ? "STALE SAMPLE" : vehicle.source}
              <br />
              {vehicle.recordedAt.toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
