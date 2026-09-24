import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Route as RouteIcon, MapPin, ArrowLeft, ShieldAlert, Star, Trophy } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabaseClient'; // Certifique-se que o caminho está correto
import './RouteMonitor.css';

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
  const location = useLocation();

  const routePath: [number, number][] = location.state?.routePath || [];

  const turfData = useMemo(() => {
    if (routePath.length < 2) return null;
    const line = turf.lineString(routePath.map(c => [c[1], c[0]])); 
    const dist = turf.length(line, { units: 'kilometers' });
    const end = turf.point([routePath[routePath.length - 1][1], routePath[routePath.length - 1][0]]);
    return { turfRouteLine: line, totalRouteDistance: dist, endPoint: end };
  }, [routePath]);

  // Estados Locais
  const [userPos, setUserPos] = useState<[number, number]>(routePath.length > 0 ? routePath[0] : [-26.42, -51.31]);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const [distanceOff, setDistanceOff] = useState<number>(0);
  
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(turfData ? turfData.totalRouteDistance : 0);
  
  // Gamificação e Finalização
  const [score, setScore] = useState<number>(100);
  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [isUpdatingDB, setIsUpdatingDB] = useState<boolean>(false);
  
  // Refs para controlo seguro
  const isOffRouteRef = useRef<boolean>(false);
  const hasArrivedRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (routePath.length === 0) navigate(-1);
  }, [routePath, navigate]);

  const pararRastreamento = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const processarChegada = async (pontosFinais: number) => {
    setIsUpdatingDB(true);
    pararRastreamento();

    try {
      const estudanteString = localStorage.getItem('estudante_logado');
      if (!estudanteString) return;
      
      const estudante = JSON.parse(estudanteString);
      const novoScore = (estudante.score || 0) + pontosFinais;

      // Atualiza os pontos no Supabase
      const { error } = await supabase
        .from('students')
        .update({ score: novoScore })
        .eq('id', estudante.id);

      if (error) throw error;

      // Mantém o LocalStorage sincronizado com a base de dados
      estudante.score = novoScore;
      localStorage.setItem('estudante_logado', JSON.stringify(estudante));

    } catch (err) {
      console.error("Erro ao salvar a pontuação:", err);
    } finally {
      setIsUpdatingDB(false);
    }
  };

  const handleLocationUpdate = (lat: number, lng: number) => {
    if (!turfData || hasArrivedRef.current) return;

    setUserPos([lat, lng]);
    const userPt = turf.point([lng, lat]);

    // 1. Verifica se CHEGOU ao destino (Raio de 5 metros)
    const distToEndMeters = turf.distance(userPt, turfData.endPoint, { units: 'meters' });
    
    if (distToEndMeters <= 5) {
      hasArrivedRef.current = true;
      setHasArrived(true);
      processarChegada(score);
      return; // Interrompe o resto dos cálculos pois já chegou
    }

    // 2. Verifica se saiu da Rota (Tolerância: 10 metros)
    const distToLineMeters = turf.pointToLineDistance(userPt, turfData.turfRouteLine, { units: 'meters' });
    
    if (distToLineMeters > 10) {
      setIsOffRoute(true);
      setDistanceOff(Math.round(distToLineMeters));
      
      if (!isOffRouteRef.current) {
        setScore(prev => Math.max(0, prev - 10));
        isOffRouteRef.current = true;
      }
    } else {
      setIsOffRoute(false);
      setDistanceOff(0);
      isOffRouteRef.current = false;
    }

    // 3. Calcula Progresso
    const snappedPt = turf.nearestPointOnLine(turfData.turfRouteLine, userPt);
    const startPt = turf.point(turfData.turfRouteLine.geometry.coordinates[0]);
    const traveledLine = turf.lineSlice(startPt, snappedPt, turfData.turfRouteLine);
    const traveledKm = turf.length(traveledLine, { units: 'kilometers' });
    
    setDistanceTraveled(Number(traveledKm.toFixed(3)));
    setDistanceRemaining(Math.max(0, Number((turfData.totalRouteDistance - traveledKm).toFixed(3))));
  };

  useEffect(() => {
    if (routePath.length === 0 || hasArrived) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 2000 }
    );

    return () => pararRastreamento();
  }, [routePath, hasArrived]);

  if (routePath.length === 0) return null;

  return (
    <div className="app-container">
      <div className={`mobile-view ${isOffRoute && !hasArrived ? 'off-route' : 'on-route'}`}>
        
        <header className="monitor-header">
          <button className="back-btn-white" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#fff" />
          </button>
          <div className="header-title">
            {hasArrived ? <Trophy size={20} /> : isOffRoute ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
            <h1>{hasArrived ? 'DESTINO ALCANÇADO!' : isOffRoute ? 'VOCÊ SAIU DA ROTA!' : 'Rota em andamento'}</h1>
          </div>
          <div style={{width: 24}}></div>
        </header>

        <main className="map-section">
          {!hasArrived && (
            <div className={`game-hud-score ${score < 50 ? 'score-low' : ''}`}>
              <Star size={18} fill="#fbc02d" color="#fbc02d" />
              <span className="hud-text">{score} pts</span>
            </div>
          )}

          <MapContainer 
            center={userPos} zoom={18} scrollWheelZoom={true} zoomControl={false}
            className="leaflet-map-monitor"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapTracker position={userPos} />
            
            {/* O simulador continua ativo para testar a chegada clicando no mapa no desktop */}
            {!hasArrived && <MapSimulator onMapClick={handleLocationUpdate} />}

            <Polyline positions={routePath} color="#00bcd4" weight={7} opacity={0.9} />

            {isOffRoute && !hasArrived && (
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

        <aside className="status-panel">
          {hasArrived ? (
            <div className="status-card arrival-state">
              <div className="arrival-icon-wrapper">
                <Trophy size={48} color="#fbc02d" />
              </div>
              <h2 className="arrival-title">Parabéns!</h2>
              <p className="status-desc">Você chegou à escola com segurança.</p>
              
              <div className="score-reveal">
                <span className="score-label">Pontos Ganhos Hoje</span>
                <span className="score-value">+{score}</span>
              </div>

              <button 
                className="btn-solid-blue" 
                disabled={isUpdatingDB}
                onClick={() => navigate('/detalhes-rota')}
              >
                {isUpdatingDB ? 'A SALVAR PONTOS...' : 'VER MEU PERFIL'}
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </aside>

      </div>
    </div>
  );
};

export default RouteMonitor;