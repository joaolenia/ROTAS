import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Route as RouteIcon, MapPin, ArrowLeft, ShieldAlert, Star } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './RouteMonitor.css';

// Rota real mapeada (General Carneiro)
const routePath: [number, number][] = [
  [-26.428857159133283, -51.31636600069183],
  [-26.428732662628644, -51.31612498757762],
  [-26.42865133408878, -51.31595659816357],
  [-26.42853678020979, -51.31600158069254],
  [-26.42834475867309, -51.316072352646714],
  [-26.42780859655581, -51.31630147084793],
  [-26.427429086123396, -51.316469276682874],
  [-26.427565258017808, -51.31697217888468],
  [-26.427362332420707, -51.3170381075151]
];

// Transforma para o padrão Turf (Longitude, Latitude)
const turfRouteLine = turf.lineString(routePath.map(c => [c[1], c[0]]));
const totalRouteDistance = turf.length(turfRouteLine, { units: 'kilometers' });

// --- ÍCONES CUSTOMIZADOS ---
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

// --- RASTREADORES DO MAPA ---
const MapTracker: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.6 });
  }, [position, map]);
  return null;
};

const MapSimulator: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

const RouteMonitor: React.FC = () => {
  const navigate = useNavigate();

  // Estados Locais
  const [userPos, setUserPos] = useState<[number, number]>(routePath[0]);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const [distanceOff, setDistanceOff] = useState<number>(0);
  
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(totalRouteDistance);
  
  // Pontuação inicial
  const [score, setScore] = useState<number>(100);
  
  // Ref para controlar a perda de pontos apenas 1 vez a cada saída
  const isOffRouteRef = useRef<boolean>(false);

  // Cálculo Matemático (chamado toda vez que o GPS atualiza)
  const handleLocationUpdate = (lat: number, lng: number) => {
    setUserPos([lat, lng]);
    const userPt = turf.point([lng, lat]);

    // 1. Verifica se saiu da Rota (Precisão Rigorosa: 10 metros)
    const distToLineMeters = turf.pointToLineDistance(userPt, turfRouteLine, { units: 'meters' });
    
    if (distToLineMeters > 10) {
      setIsOffRoute(true);
      setDistanceOff(Math.round(distToLineMeters));
      
      // Desconta 10 pontos APENAS no momento exato que sair da rota
      if (!isOffRouteRef.current) {
        setScore(prev => Math.max(0, prev - 10)); // Impede que a nota fique negativa
        isOffRouteRef.current = true;
      }
    } else {
      setIsOffRoute(false);
      setDistanceOff(0);
      isOffRouteRef.current = false; // Resetou, voltou pra rota segura
    }

    // 2. Calcula Distância Percorrida e Faltante SEMPRE
    const snappedPt = turf.nearestPointOnLine(turfRouteLine, userPt);
    const startPt = turf.point(turfRouteLine.geometry.coordinates[0]);
    
    const traveledLine = turf.lineSlice(startPt, snappedPt, turfRouteLine);
    const traveledKm = turf.length(traveledLine, { units: 'kilometers' });
    
    setDistanceTraveled(Number(traveledKm.toFixed(3)));
    setDistanceRemaining(Math.max(0, Number((totalRouteDistance - traveledKm).toFixed(3))));
  };

  useEffect(() => {
    // Configuração Otimizada de GPS Real-Time
    const watchId = navigator.geolocation.watchPosition(
      (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 2000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="app-container">
      <div className={`mobile-view ${isOffRoute ? 'off-route' : 'on-route'}`}>
        
        {/* Header Superior */}
        <header className="monitor-header">
          <button className="back-btn-white" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#fff" />
          </button>
          <div className="header-title">
            {isOffRoute ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
            <h1>{isOffRoute ? 'VOCÊ SAIU DA ROTA!' : 'Rota em andamento'}</h1>
          </div>
          <div style={{width: 24}}></div>
        </header>

        {/* Área do Mapa */}
        <main className="map-section">
          {/* HUD Score Flutuante */}
          <div className={`game-hud-score ${score < 50 ? 'score-low' : ''}`}>
            <Star size={18} fill="#fbc02d" color="#fbc02d" />
            <span className="hud-text">
              {score} pts
            </span>
          </div>

          <MapContainer 
            center={userPos} 
            zoom={18} 
            scrollWheelZoom={true} 
            zoomControl={false}
            className="leaflet-map-monitor"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTracker position={userPos} />
            <MapSimulator onMapClick={handleLocationUpdate} />

            {/* Linha da Rota Oficial */}
            <Polyline positions={routePath} color="#00bcd4" weight={7} opacity={0.9} />

            {/* Linha de alerta até o destino final se estiver fora da rota */}
            {isOffRoute && (
              <Polyline 
                positions={[userPos, routePath[routePath.length - 1]]} 
                color="#e63946" weight={3} dashArray="6, 8" 
              />
            )}

            <Marker position={userPos} icon={createUserIcon(isOffRoute)} />
            <Marker position={routePath[routePath.length - 1]} icon={schoolIcon}>
              <Popup>Escola (Destino)</Popup>
            </Marker>
          </MapContainer>
        </main>

        {/* Painel Inferior Clean */}
        <aside className="status-panel">
          
          <div className="distances-row">
            <div className="distance-block">
              <RouteIcon size={20} color="#123762" />
              <div>
                <span className="dist-label">Percorrido</span>
                <span className="dist-value">{distanceTraveled} km</span>
              </div>
            </div>
            <div className="distance-divider"></div>
            <div className="distance-block">
              <MapPin size={20} color="#123762" />
              <div>
                <span className="dist-label">Faltam</span>
                <span className="dist-value">{distanceRemaining} km</span>
              </div>
            </div>
          </div>

          {/* Cards de Status */}
          {isOffRoute ? (
            <div className="status-card alert-state">
              <div className="alert-header">
                <AlertTriangle size={28} color="#e63946" />
                <h2 className="error-title">Fora da Rota!</h2>
              </div>
              <p className="status-desc">
                Você se afastou <strong>{distanceOff} metros</strong> da linha principal. Retorne para parar de perder pontos!
              </p>
              <button className="btn-solid-red" onClick={() => navigate(-1)}>ENCERRAR ROTA</button>
            </div>
          ) : (
            <div className="status-card safe-state">
              <div className="safe-area-indicator">
                <div className="pulsing-dot-green-small"></div>
                <h2>Você está na rota segura</h2>
              </div>
              <p className="status-desc">Siga o trajeto azul no mapa até chegar ao seu destino.</p>
              <button className="btn-outline" onClick={() => navigate(-1)}>FINALIZAR</button>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};

export default RouteMonitor;