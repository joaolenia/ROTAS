import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Home, Trophy, Star, User, 
  CheckCircle2, Bike, Circle, Dot
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './RouteSelection.css';

// Correção para o ícone padrão do Leaflet no React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteSelection: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('A');
  const [pathA, setPathA] = useState<[number, number][]>([]);
  const [pathB, setPathB] = useState<[number, number][]>([]);
  const [pathC, setPathC] = useState<[number, number][]>([]);

  // Coordenadas em General Carneiro - PR
  const mapCenter: [number, number] = [-26.4265, -51.3165]; // Destino (Escola)
  const startA: [number, number] = [-26.4170, -51.3220]; // Início Rota A
  const startB: [number, number] = [-26.4300, -51.3100]; // Início Rota B
  const startC: [number, number] = [-26.4220, -51.3300]; // Início Rota C

  useEffect(() => {
    const fetchRealRoute = async (start: [number, number], end: [number, number], profile: string) => {
      try {
        const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        }
      } catch (error) {
        console.error("Erro ao buscar rota:", error);
      }
      return [];
    };

    const loadAllRoutes = async () => {
      const routeA = await fetchRealRoute(startA, mapCenter, 'foot');
      const routeB = await fetchRealRoute(startB, mapCenter, 'foot');
      const routeC = await fetchRealRoute(startC, mapCenter, 'bike');

      setPathA(routeA);
      setPathB(routeB);
      setPathC(routeC);
    };

    loadAllRoutes();
  }, []);

  return (
    <div className="layout-wrapper">
      
      {/* Barra de Navegação */}
      <nav className="navigation-bar">
        <div className="nav-item">
          <Home size={24} />
          <span>Início</span>
        </div>
        <div className="nav-item active">
          <MapPin size={24} />
          <span>Rotas</span>
        </div>
        <div className="nav-item">
          <Trophy size={24} />
          <span>Desafios</span>
        </div>
        <div className="nav-item">
          <Star size={24} />
          <span>Pontos</span>
        </div>
        <div className="nav-item">
          <User size={24} />
          <span>Perfil</span>
        </div>
      </nav>

      {/* Área da Lista de Rotas e Controles */}
      <aside className="sidebar-content">
        <header className="header">
          <button className="back-btn">
            <ArrowLeft size={24} color="#123762" />
          </button>
          <div className="header-title">
            <span className="title-light">Escolha uma</span>
            <span className="title-bold">Rota Segura</span>
          </div>
        </header>

        <div className="routes-list">
          {/* Rota A */}
          <div 
            className={`route-item ${selectedRoute === 'A' ? 'selected' : ''}`}
            onClick={() => setSelectedRoute('A')}
          >
            <div className="route-icon-container blue">
              <CheckCircle2 size={24} fill="#00bcd4" color="#fff" />
            </div>
            <div className="route-info">
              <h4>Rota A - Mais Segura</h4>
              <p>2,4 km - 30 min</p>
              <span className="badge-recommended">Recomendada pela escola</span>
            </div>
            <div className="radio-btn">
              {selectedRoute === 'A' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
            </div>
          </div>

          {/* Rota B */}
          <div 
            className={`route-item ${selectedRoute === 'B' ? 'selected' : ''}`}
            onClick={() => setSelectedRoute('B')}
          >
            <div className="route-icon-container yellow">
              <CheckCircle2 size={24} fill="#fbc02d" color="#fff" />
            </div>
            <div className="route-info">
              <h4>Rota B - Alternativa</h4>
              <p>2,1 km - 27 min</p>
            </div>
            <div className="radio-btn">
              {selectedRoute === 'B' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
            </div>
          </div>

          {/* Rota C */}
          <div 
            className={`route-item ${selectedRoute === 'C' ? 'selected' : ''}`}
            onClick={() => setSelectedRoute('C')}
          >
            <div className="route-icon-container green">
              <Bike size={24} color="#4caf50" />
            </div>
            <div className="route-info">
              <h4>Rota C - Ciclovia</h4>
              <p>3,0 km - 15 min</p>
            </div>
            <div className="radio-btn">
              {selectedRoute === 'C' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
            </div>
          </div>
        </div>

        <div className="action-container">
          <button className="btn-select-route">SELECIONAR ROTA</button>
        </div>
      </aside>

      {/* Área do Mapa */}
      <main className="map-area">
        <MapContainer 
          center={mapCenter} 
          zoom={14} 
          scrollWheelZoom={true} 
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Renderização condicional para alterar a opacidade com base na seleção */}
          {pathA.length > 0 && (
            <Polyline positions={pathA} color="#00bcd4" weight={selectedRoute === 'A' ? 8 : 4} opacity={selectedRoute === 'A' ? 1 : 0.3} />
          )}
          {pathB.length > 0 && (
            <Polyline positions={pathB} color="#fbc02d" weight={selectedRoute === 'B' ? 8 : 4} opacity={selectedRoute === 'B' ? 1 : 0.3} />
          )}
          {pathC.length > 0 && (
            <Polyline positions={pathC} color="#4caf50" weight={selectedRoute === 'C' ? 8 : 4} opacity={selectedRoute === 'C' ? 1 : 0.3} />
          )}
          
          <Marker position={mapCenter}>
            <Popup>Escola Municipal (Destino)</Popup>
          </Marker>
        </MapContainer>
      </main>

    </div>
  );
};

export default RouteSelection;