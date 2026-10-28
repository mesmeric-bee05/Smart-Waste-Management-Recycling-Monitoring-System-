export type RoutePoint = { id: string; code: string; name: string; latitude: number; longitude: number };
const EARTH_RADIUS_KM = 6371.0088;

export function haversineKm(
  a: Pick<RoutePoint, "latitude" | "longitude">,
  b: Pick<RoutePoint, "latitude" | "longitude">,
): number {
  const radians = (degree: number) => (degree * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function greedyPreview(
  points: readonly RoutePoint[],
  startId?: string,
): Array<RoutePoint & { legKm: number }> {
  if (points.length === 0) return [];
  const unique = [...new Map(points.map((point) => [point.id, point])).values()];
  const start = unique.find((point) => point.id === startId) ?? unique[0]!;
  const remaining = unique.filter((point) => point.id !== start.id);
  const route: Array<RoutePoint & { legKm: number }> = [{ ...start, legKm: 0 }];
  let current: RoutePoint = start;
  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const distance = haversineKm(current, candidate);
      if (
        distance < bestDistance ||
        (distance === bestDistance && candidate.code < remaining[bestIndex]!.code)
      ) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    if (!next) break;
    route.push({ ...next, legKm: Number(bestDistance.toFixed(2)) });
    current = next;
  }
  return route;
}
