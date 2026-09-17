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

// Ícones personalizados para Origem e Destino
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RouteSelection: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('A');
  const [pathA, setPathA] = useState<[number, number][]>([]);
  const [pathB, setPathB] = useState<[number, number][]>([]);
  const [pathC, setPathC] = useState<[number, number][]>([]);

  // Ponto de Saída e Chegada fixos em General Carneiro - PR
  const startPoint: [number, number] = [-26.4286, -51.3140]; // Casa (Saída)
  const endPoint: [number, number] = [-26.4221, -51.3195];   // Escola (Chegada)

  // Waypoints intermediários para forçar o OSRM a traçar rotas diferentes (Alternativas)
  const waypointB: [number, number] = [-26.4250, -51.3110];
  const waypointC: [number, number] = [-26.4290, -51.3200];

  useEffect(() => {
    // Função para buscar rota real no OSRM
    const fetchRealRoute = async (
      start: [number, number], 
      end: [number, number], 
      profile: string,
      waypoint?: [number, number]
    ) => {
      try {
        // OSRM usa o formato [Longitude, Latitude]
        let coords = `${start[1]},${start[0]}`;
        if (waypoint) coords += `;${waypoint[1]},${waypoint[0]}`;
        coords += `;${end[1]},${end[0]}`;

        const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?geometries=geojson&overview=full`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          // Converte de [Lon, Lat] (GeoJSON) para [Lat, Lon] (Leaflet)
          return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        }
      } catch (error) {
        console.error("Erro ao buscar rota:", error);
      }
      return [];
    };

    const loadAllRoutes = async () => {
      // Rota A: Direta a pé
      const routeA = await fetchRealRoute(startPoint, endPoint, 'foot');
      // Rota B: Caminho alternativo passando por um waypoint
      const routeB = await fetchRealRoute(startPoint, endPoint, 'foot', waypointB);
      // Rota C: Ciclovia/Bicicleta passando por outro waypoint
      const routeC = await fetchRealRoute(startPoint, endPoint, 'bike', waypointC);

      setPathA(routeA);
      setPathB(routeB);
      setPathC(routeC);
    };

    loadAllRoutes();
  }, []);

  return (
    <div className="layout-wrapper">
      
      {/* Menu Lateral Desktop / Rodapé Mobile */}
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

      {/* Painel de Seleção de Rotas */}
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
          <div 
            className={`route-item ${selectedRoute === 'A' ? 'selected' : ''}`}
            onClick={() => setSelectedRoute('A')}
          >
            <div className="route-icon-container blue">
              <CheckCircle2 size={24} fill="#00bcd4" color="#fff" />
            </div>
            <div className="route-info">
              <h4>Rota A - Mais Segura</h4>
              <p>1,2 km - 15 min</p>
              <span className="badge-recommended">Recomendada pela escola</span>
            </div>
            <div className="radio-btn">
              {selectedRoute === 'A' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
            </div>
          </div>

          <div 
            className={`route-item ${selectedRoute === 'B' ? 'selected' : ''}`}
            onClick={() => setSelectedRoute('B')}
          >
            <div className="route-icon-container yellow">
              <CheckCircle2 size={24} fill="#fbc02d" color="#fff" />
            </div>
            <div className="route-info">
              <h4>Rota B - Alternativa</h4>
              <p>1,5 km - 19 min</p>
            </div>
            <div className="radio-btn">
              {selectedRoute === 'B' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
            </div>
          </div>

          <div 
            className={`route-item ${selectedRoute === 'C' ? 'selected' : ''}`}
            onClick={() => setSelectedRoute('C')}
          >
            <div className="route-icon-container green">
              <Bike size={24} color="#4caf50" />
            </div>
            <div className="route-info">
              <h4>Rota C - Ciclovia</h4>
              <p>1,8 km - 8 min</p>
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

      {/* Mapa Central */}
      <main className="map-area">
        <MapContainer 
          center={[-26.4250, -51.3160]} 
          zoom={15} 
          scrollWheelZoom={true} 
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* As rotas desenhadas com classes CSS para animação */}
          {pathA.length > 0 && (
            <Polyline 
              positions={pathA} 
              pathOptions={{
                color: "#00bcd4",
                weight: selectedRoute === 'A' ? 8 : 4,
                opacity: selectedRoute === 'A' ? 1 : 0.2,
                className: selectedRoute === 'A' ? 'route-path-active' : 'route-path-inactive'
              }} 
            />
          )}
          {pathB.length > 0 && (
            <Polyline 
              positions={pathB} 
              pathOptions={{
                color: "#fbc02d",
                weight: selectedRoute === 'B' ? 8 : 4,
                opacity: selectedRoute === 'B' ? 1 : 0.2,
                className: selectedRoute === 'B' ? 'route-path-active' : 'route-path-inactive'
              }} 
            />
          )}
          {pathC.length > 0 && (
            <Polyline 
              positions={pathC} 
              pathOptions={{
                color: "#4caf50",
                weight: selectedRoute === 'C' ? 8 : 4,
                opacity: selectedRoute === 'C' ? 1 : 0.2,
                className: selectedRoute === 'C' ? 'route-path-active' : 'route-path-inactive'
              }} 
            />
          )}
          
          {/* Marcadores de Saída e Chegada */}
          <Marker position={startPoint} icon={startIcon}>
            <Popup>Sua Casa (Saída)</Popup>
          </Marker>
          <Marker position={endPoint} icon={endIcon}>
            <Popup>Escola Municipal (Chegada)</Popup>
          </Marker>

        </MapContainer>
      </main>

    </div>
  );
};

export default RouteSelection;