import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapApi } from "../../api/mapApi";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const safeZoneIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  className: "safe-zone-marker",
});

const destIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  className: "destination-marker",
});

const liveIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  className: "live-position-marker",
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CampusMap({
  currentPosition = null,
  selectedDestination = null,
  onSelectDestination,
  selectable = false,
  liveMarker = null,
}) {
  const [mapConfig, setMapConfig] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    Promise.all([MapApi.getMapConfig(), MapApi.getSafeZones()])
      .then(([config, zones]) => {
        setMapConfig(config);
        setSafeZones(zones || []);
      })
      .catch(() => {
        setMapConfig({ centerLat: 30.2675, centerLng: 77.9959, boundsRadiusKm: 2.0 });
        setLoadError("Showing base GEHU campus map (offline safe-zone fallback).");
      });
  }, []);

  if (!mapConfig) {
    return (
      <div className="h-96 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-sm text-slate-400">
        Loading GEHU Campus Map...
      </div>
    );
  }

  const center = [mapConfig.centerLat, mapConfig.centerLng];
  const deg = mapConfig.boundsRadiusKm / 111;
  const bounds = [
    [center[0] - deg * 1.4, center[1] - deg * 1.4],
    [center[0] + deg * 1.4, center[1] + deg * 1.4],
  ];

  const routeStart = liveMarker || currentPosition;
  const routeLine =
    routeStart && selectedDestination
      ? [
          [routeStart.lat, routeStart.lng],
          [selectedDestination.lat, selectedDestination.lng],
        ]
      : null;

  return (
    <div className="space-y-2">
      {loadError && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
          {loadError}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
        <MapContainer
          center={center}
          zoom={16}
          minZoom={14}
          maxBounds={bounds}
          maxBoundsViscosity={0.9}
          style={{ height: "410px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Circle
            center={center}
            radius={mapConfig.boundsRadiusKm * 1000}
            pathOptions={{
              color: "#7c3aed",
              fillColor: "#7c3aed",
              fillOpacity: 0.04,
              weight: 1.5,
              dashArray: "6 4",
            }}
          />

          {routeLine && (
            <Polyline
              positions={routeLine}
              pathOptions={{ color: "#0d9488", weight: 4, dashArray: "8 6" }}
            />
          )}

          {safeZones.map((zone) => (
            <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={safeZoneIcon}>
              <Popup>
                <div className="text-xs">
                  <strong className="text-slate-900 block">{zone.name}</strong>
                  <span className="text-violet-700 font-semibold">
                    {zone.type.replace(/_/g, " ")}
                  </span>
                  {zone.description && (
                    <p className="text-slate-600 mt-1">{zone.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {currentPosition && (
            <Marker position={[currentPosition.lat, currentPosition.lng]}>
              <Popup>
                <strong className="text-xs">Start / Current Position</strong>
              </Popup>
            </Marker>
          )}

          {selectedDestination && (
            <Marker
              position={[selectedDestination.lat, selectedDestination.lng]}
              icon={destIcon}
            >
              <Popup>
                <strong className="text-xs">Selected Destination</strong>
              </Popup>
            </Marker>
          )}

          {liveMarker && (
            <Marker position={[liveMarker.lat, liveMarker.lng]} icon={liveIcon}>
              <Popup>
                <strong className="text-xs">Last Known Live Position</strong>
              </Popup>
            </Marker>
          )}

          {selectable && (
            <ClickHandler onMapClick={(lat, lng) => onSelectDestination?.(lat, lng)} />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" /> Safe Zones (
            {safeZones.length})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" /> Start Point
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Destination
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-violet-600 inline-block" />{" "}
            {mapConfig.boundsRadiusKm} km Campus Geofence
          </span>
        </div>
        {selectable && (
          <span className="font-medium text-violet-700">
            Tip: Click anywhere on the map or pick a campus landmark below
          </span>
        )}
      </div>
    </div>
  );
}
