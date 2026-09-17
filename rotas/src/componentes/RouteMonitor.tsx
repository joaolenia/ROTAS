import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './RouteMonitor.css';

// Rota simulada (General Carneiro)
const routePath: [number, number][] = [
  [-26.4286, -51.3140], 
  [-26.4250, -51.3110], 
  [-26.4221, -51.3195]
];

const turfRouteLine = turf.lineString(routePath.map(c => [c[1], c[0]]));

// Ícone Customizado Animado para o Usuário
const createUserIcon = (isOffRoute: boolean) => new L.DivIcon({
  className: 'animated-user-marker',
  html: `<div class="user-pulse ${isOffRoute ? 'pulse-red' : 'pulse-green'}">
           <div class="user-core"></div>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const schoolIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Rastreador Suave de Câmera
const MapTracker: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.8 });
  }, [position, map]);
  return null;
};

// Simulador de cliques para teste no Desktop
const MapSimulator: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const RouteMonitor: React.FC = () => {
  const navigate = useNavigate();

  const [userPos, setUserPos] = useState<[number, number]>(routePath[0]);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const [distanceOff, setDistanceOff] = useState<number>(0);
  const [points, setPoints] = useState<number>(45);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(1.2);
  
  const lastValidPos = useRef<[number, number]>(routePath[0]);

  const handleLocationUpdate = (lat: number, lng: number) => {
    setUserPos([lat, lng]);

    const userPt = turf.point([lng, lat]);
    const distanceToRoute = turf.pointToLineDistance(userPt, turfRouteLine, { units: 'meters' });

    if (distanceToRoute > 15) {
      setIsOffRoute(true);
      setDistanceOff(Math.round(distanceToRoute));
      setPoints(prev => Math.max(0, prev - 1));
    } else {
      setIsOffRoute(false);
      
      const lastPt = turf.point([lastValidPos.current[1], lastValidPos.current[0]]);
      const distanceMoved = turf.distance(lastPt, userPt, { units: 'meters' });

      if (distanceMoved >= 30) {
        setPoints(prev => prev + 5);
        setDistanceTraveled(prev => Number((prev + 0.03).toFixed(2)));
        lastValidPos.current = [lat, lng];
      }
    }
  };

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        handleLocationUpdate(position.coords.latitude, position.coords.longitude);
      },
      (error) => console.error("Erro GPS:", error),
      { 
        enableHighAccuracy: true, 
        maximumAge: 0,
        timeout: 2000 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="app-container">
      <div className={`mobile-view ${isOffRoute ? 'off-route' : 'on-route'}`}>
        
        {/* Top Banner Elegante */}
        <header className="monitor-header">
          <button className="back-btn-white" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#fff" />
          </button>
          <div className="header-title">
            {isOffRoute ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
            <h1>{isOffRoute ? 'ATENÇÃO!' : 'Rota em andamento'}</h1>
          </div>
          <div style={{width: 24}}></div> {/* Spacer para centralizar */}
        </header>

        {/* Mapa */}
        <main className="map-section">
          <MapContainer 
            center={userPos} 
            zoom={17} 
            scrollWheelZoom={true} 
            zoomControl={false}
            className="leaflet-map-monitor"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <MapTracker position={userPos} />
            <MapSimulator onMapClick={handleLocationUpdate} />

            <Polyline positions={routePath} color="#00bcd4" weight={7} opacity={0.9} />

            {isOffRoute && (
              <Polyline 
                positions={[userPos, routePath[1]]} 
                color="#e63946" weight={3} dashArray="6, 8" 
              />
            )}

            <Marker position={userPos} icon={createUserIcon(isOffRoute)} />

            <Marker position={routePath[routePath.length - 1]} icon={schoolIcon}>
              <Popup>Escola</Popup>
            </Marker>
          </MapContainer>
        </main>

        {/* Painel Inferior Limpo */}
        <aside className="status-panel">
          {isOffRoute ? (
            <div className="status-card">
              <h2 className="error-title">Você saiu da área<br/>da Rota Segura</h2>
              <p className="status-desc">
                Você está aproximadamente <strong>{distanceOff} metros</strong> fora do trajeto recomendado.
              </p>
              <p className="status-desc">
                Retorne para a rota para continuar acumulando pontos.
              </p>
              <div className="action-buttons">
                <button className="btn-solid-red" onClick={() => navigate(-1)}>VOLTAR PARA A ROTA</button>
                <button className="btn-outline">VER OUTRAS ROTAS</button>
              </div>
            </div>
          ) : (
            <div className="status-card">
              <div className="success-header">
                <div className="shield-icon-container">
                  <ShieldCheck size={36} color="#fff" />
                </div>
                <div className="success-text">
                  <h2>Você está dentro<br/>da rota segura!</h2>
                  <span className="points-badge">+{points} pontos acumulados</span>
                </div>
              </div>

              <div className="stats-row">
                <div className="icon-circle">
                  <Clock size={20} color="#fff" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Distância percorrida</span>
                  <span className="stat-value">{distanceTraveled} km</span>
                </div>
              </div>

              <div className="safe-area-indicator">
                <div className="pulsing-dot-green-small"></div>
                <span>Dentro da área segura</span>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};

export default RouteMonitor;