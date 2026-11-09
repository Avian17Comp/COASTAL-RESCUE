'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, GeoJSON, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const TILES = {
  sat: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles &copy; Esri' },
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap contributors' },
};

const userIcon = L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
const shelterIcon = L.divIcon({
  className: '',
  html: '<div class="shelter-pin"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></div>',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -30],
});

const ZONE = { high: '#EF4444', moderate: '#F59E0B' };

// Fly to the user + nearest shelter on mount and whenever `trigger` changes
function Fit({ points, trigger }) {
  const map = useMap();
  useEffect(() => {
    const mobile = window.innerWidth < 1024;
    map.flyToBounds(L.latLngBounds(points), { paddingTopLeft: [50, mobile ? 140 : 50], paddingBottomRight: [50, mobile ? 260 : 50], duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

export default function MapView({ pos, base, hazard, shelters, route, showHazard, showRoute, focus }) {
  return (
    <MapContainer center={[pos.lat, pos.lon]} zoom={14} zoomControl={false} className="h-full w-full bg-navy-900">
      <TileLayer key={base} url={TILES[base].url} attribution={TILES[base].attr} maxZoom={19} />
      <ZoomControl position="topright" />
      {showHazard && (
        <GeoJSON data={hazard} style={(f) => ({ color: ZONE[f.properties.risk], fillColor: ZONE[f.properties.risk], weight: 1.5, fillOpacity: 0.35 })} />
      )}
      {shelters.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lon]} icon={shelterIcon}>
          <Popup>
            <b>{s.name}</b><br />Elevasi: {s.elev} m<br />Kapasitas: {s.capacity} orang<br />Kontak: <a href={`tel:${s.contact}`}>{s.contact}</a>
          </Popup>
        </Marker>
      ))}
      {showRoute && <Polyline positions={route.path} pathOptions={{ color: '#22C55E', weight: 5, opacity: 0.95 }} />}
      <Marker position={[pos.lat, pos.lon]} icon={userIcon}><Popup>Posisi Anda Saat Ini</Popup></Marker>
      <Fit points={[[pos.lat, pos.lon], [route.shelter.lat, route.shelter.lon]]} trigger={focus} />
    </MapContainer>
  );
}
