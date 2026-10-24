"""Build a small SVG county map from the State of Utah SGID service.

Run: python3 scripts/generate-counties.py
The output is checked into this demo so phones work without GIS network access.
"""

from __future__ import annotations

import json
import math
import urllib.request
from pathlib import Path

SOURCE = (
    "https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services/"
    "UtahCountyBoundaries/FeatureServer/0/query"
    "?where=1%3D1&outFields=NAME%2CFIPS&outSR=4326&f=geojson"
)
OUTPUT = Path(__file__).resolve().parents[1] / "county-map.json"
WIDTH, HEIGHT, MARGIN = 380, 510, 20


def distance_to_segment(point, start, end):
    dx, dy = end[0] - start[0], end[1] - start[1]
    length = dx * dx + dy * dy
    if not length:
        return math.dist(point, start)
    position = max(0, min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length))
    return math.dist(point, (start[0] + position * dx, start[1] + position * dy))


def simplify_open(points, tolerance=0.45):
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        if last - first < 2:
            continue
        index = max(range(first + 1, last), key=lambda i: distance_to_segment(points[i], points[first], points[last]))
        if distance_to_segment(points[index], points[first], points[last]) > tolerance:
            keep.add(index)
            stack.extend(((first, index), (index, last)))
    return [points[i] for i in sorted(keep)]


def simplify_ring(ring):
    points = ring[:-1] if ring[0] == ring[-1] else ring
    first = min(range(len(points)), key=lambda i: points[i][0] + points[i][1])
    rotated = points[first:] + points[:first]
    split = max(range(1, len(rotated)), key=lambda i: math.dist(rotated[0], rotated[i]))
    return simplify_open(rotated[: split + 1])[:-1] + simplify_open(rotated[split:] + rotated[:1])[:-1]


def main():
    with urllib.request.urlopen(SOURCE, timeout=30) as response:
        data = json.load(response)
    features = data.get("features", [])
    if len(features) != 29:
        raise ValueError(f"Expected 29 Utah counties, received {len(features)}")
    all_coords = []
    for feature in features:
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        all_coords.extend(point for polygon in polygons for ring in polygon for point in ring)
    min_lon, max_lon = min(p[0] for p in all_coords), max(p[0] for p in all_coords)
    min_lat, max_lat = min(p[1] for p in all_coords), max(p[1] for p in all_coords)

    def project(point):
        return ((point[0] - min_lon) * (WIDTH - 2 * MARGIN) / (max_lon - min_lon) + MARGIN,
                (max_lat - point[1]) * (HEIGHT - 2 * MARGIN) / (max_lat - min_lat) + MARGIN)

    counties = []
    for feature in features:
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        rings = [ring for polygon in polygons for ring in polygon]
        paths = []
        for ring in rings:
            simplified = simplify_ring([project(point) for point in ring])
            if len(simplified) < 3:
                continue
            paths.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in simplified) + "Z")
        if not paths:
            raise ValueError(f"No path for {feature['properties']['NAME']}")
        counties.append({"name": feature["properties"]["NAME"].title(), "fips": str(feature["properties"]["FIPS"]).zfill(3), "path": "".join(paths)})
    counties.sort(key=lambda county: county["name"])
    OUTPUT.write_text(json.dumps({
        "source": "State of Utah SGID — Utah County Boundaries",
        "sourceUrl": "https://gis.utah.gov/products/sgid/boundaries/county/",
        "geometrySource": SOURCE,
        "viewBox": "0 0 380 510",
        "simplification": "Projected to SVG and simplified at 0.45 viewport pixels; for interactive display only.",
        "counties": counties,
    }, separators=(",", ":")))
    print(f"Wrote {len(counties)} counties to {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
