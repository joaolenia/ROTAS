import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Route as RouteIcon, MapPin, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './RouteMonitor.css';

// Rota invertida com coordenadas reais passadas por você
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

// Ícones Customizados Leaflet
const createUserIcon = (isOffRoute: boolean) => new L.DivIcon({
  className: 'animated-user-marker',
  html: `<div class="user-pulse ${isOffRoute ? 'pulse-red' : 'pulse-green'}">
           <div class="user-core"></div>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const coinIcon = new L.DivIcon({
  className: 'coin-marker',
  html: `<div class="coin-emoji">🪙</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const schoolIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Rastreador de Câmera Suave
const MapTracker: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.5 });
  }, [position, map]);
  return null;
};

// Simulador de cliques no Desktop
const MapSimulator: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

// --- Tipagem de Moedas ---
type Coin = { id: number; lat: number; lng: number; collected: boolean };

const RouteMonitor: React.FC = () => {
  const navigate = useNavigate();

  // Estados do Usuário e Rota
  const [userPos, setUserPos] = useState<[number, number]>(routePath[0]);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const [distanceOff, setDistanceOff] = useState<number>(0);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(totalRouteDistance);
  
  // Gamificação (Moedas e Pontos)
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<Coin[]>([]);

  // Inicializa as 10 moedas espalhadas pela rota ao carregar a tela
  useEffect(() => {
    const generatedCoins: Coin[] = [];
    const interval = totalRouteDistance / 11; // Divide o trajeto para caber 10 moedas

    for (let i = 1; i <= 10; i++) {
      const pointAlong = turf.along(turfRouteLine, interval * i, { units: 'kilometers' });
      generatedCoins.push({
        id: i,
        lng: pointAlong.geometry.coordinates[0],
        lat: pointAlong.geometry.coordinates[1],
        collected: false
      });
    }
    setCoins(generatedCoins);
  }, []);

  // Lógica Matemática de Atualização
  const handleLocationUpdate = (lat: number, lng: number) => {
    setUserPos([lat, lng]);
    const userPt = turf.point([lng, lat]);

    // 1. Verifica se saiu da Rota (Precisão Rigorosa: 10 metros)
    const distToLineMeters = turf.pointToLineDistance(userPt, turfRouteLine, { units: 'meters' });
    
    if (distToLineMeters > 10) {
      setIsOffRoute(true);
      setDistanceOff(Math.round(distToLineMeters));
    } else {
      setIsOffRoute(false);
      setDistanceOff(0);
      
      // 2. Calcula Distância Percorrida e Faltante
      const snappedPt = turf.nearestPointOnLine(turfRouteLine, userPt);
      const startPt = turf.point([routePath[0][1], routePath[0][0]]);
      
      const traveledLine = turf.lineSlice(startPt, snappedPt, turfRouteLine);
      const traveledKm = turf.length(traveledLine, { units: 'kilometers' });
      
      setDistanceTraveled(Number(traveledKm.toFixed(2)));
      setDistanceRemaining(Math.max(0, Number((totalRouteDistance - traveledKm).toFixed(2))));

      // 3. Verifica Coleta de Moedas (Raio de 5 metros)
      setCoins(prevCoins => {
        let newlyCollected = 0;
        const nextCoins = prevCoins.map(coin => {
          if (!coin.collected) {
            const coinPt = turf.point([coin.lng, coin.lat]);
            const distToCoin = turf.distance(userPt, coinPt, { units: 'meters' });
            
            if (distToCoin <= 5) {
              newlyCollected += 1;
              return { ...coin, collected: true };
            }
          }
          return coin;
        });

        if (newlyCollected > 0) {
          setScore(prev => prev + (newlyCollected * 10)); // 10 Pontos por moeda
        }
        return nextCoins;
      });
    }
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
            <h1>Monitoramento R.O.T.A.S.</h1>
          </div>
          <div style={{width: 24}}></div>
        </header>

        {/* Área do Mapa */}
        <main className="map-section">
          {/* HUD Score Flutuante */}
          <div className="game-hud-score">
            <span className="hud-icon">🪙</span>
            <span className="hud-text">{score} / 100 pts</span>
          </div>

          <MapContainer 
            center={userPos} zoom={18} 
            scrollWheelZoom={true} zoomControl={false}
            className="leaflet-map-monitor"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTracker position={userPos} />
            <MapSimulator onMapClick={handleLocationUpdate} />

            {/* Linha da Rota */}
            <Polyline positions={routePath} color="#00bcd4" weight={7} opacity={0.9} />

            {/* Alerta de Desvio de Rota */}
            {isOffRoute && (
              <Polyline 
                positions={[userPos, routePath[routePath.length - 1]]} 
                color="#e63946" weight={3} dashArray="6, 8" 
              />
            )}

            {/* Renderiza as moedas que ainda não foram coletadas */}
            {coins.filter(c => !c.collected).map(coin => (
              <Marker key={coin.id} position={[coin.lat, coin.lng]} icon={coinIcon} />
            ))}

            <Marker position={userPos} icon={createUserIcon(isOffRoute)} />
            <Marker position={routePath[routePath.length - 1]} icon={schoolIcon} />
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

          {isOffRoute ? (
            <div className="status-card alert-state">
              <div className="alert-header">
                <AlertTriangle size={28} color="#e63946" />
                <h2 className="error-title">Fora da Rota!</h2>
              </div>
              <p className="status-desc">
                Você se afastou <strong>{distanceOff} metros</strong> da linha principal. Retorne para continuar coletando moedas.
              </p>
              <button className="btn-solid-red" onClick={() => navigate(-1)}>ENCERRAR ROTA</button>
            </div>
          ) : (
            <div className="status-card safe-state">
              <div className="safe-area-indicator">
                <div className="pulsing-dot-green-small"></div>
                <h2>Você está na rota segura</h2>
              </div>
              <p className="status-desc">Siga o trajeto azul no mapa para coletar as moedas e chegar ao seu destino.</p>
              <button className="btn-outline" onClick={() => navigate(-1)}>FINALIZAR</button>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};

export default RouteMonitor;