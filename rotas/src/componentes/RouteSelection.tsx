import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Home, Trophy, Star, User, 
  CheckCircle2, Circle, Dot
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './RouteSelection.css';
import { useNavigate } from 'react-router-dom';

// Correção para o ícone padrão do Leaflet no React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones personalizados
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
  const navigate = useNavigate();

  // Estados para as rotas e utilizador
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B'>('A');
  const [mainRoute, setMainRoute] = useState<[number, number][]>([]);
  const [altRoute, setAltRoute] = useState<[number, number][]>([]);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    // 1. Busca os dados do utilizador salvo no Login
    const estudanteString = localStorage.getItem('estudante_logado');
    
    if (estudanteString) {
      const estudante = JSON.parse(estudanteString);
      setStudentName(estudante.name);
      
      // Carrega as rotas cadastradas
      if (estudante.main_route) setMainRoute(estudante.main_route);
      if (estudante.alt_route) setAltRoute(estudante.alt_route);
    } else {
      // Se não houver ninguém logado, volta para o login
      navigate('/login');
    }
  }, [navigate]);

  // Define os marcadores dinamicamente com base na rota principal (se existir)
  const startPoint: [number, number] = mainRoute.length > 0 ? mainRoute[0] : [-26.4204, -51.3185];
  const endPoint: [number, number] = mainRoute.length > 0 ? mainRoute[mainRoute.length - 1] : [-26.4288, -51.3163];

  // 2. Função que envia a rota escolhida para a tela de Detalhes
  const handleConfirmRoute = () => {
    const routeData = selectedRoute === 'A' ? mainRoute : altRoute;
    const routeType = selectedRoute === 'A' ? 'Principal' : 'Alternativa';

    navigate('/detalhes-rota', {
      state: {
        tipoRota: routeType,
        coordenadas: routeData
      }
    });
  };

  return (
    <div className="layout-wrapper">
      
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

      <aside className="sidebar-content">
        <header className="header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#123762" />
          </button>
          <div className="header-title">
            <span className="title-light">Olá, {studentName}</span>
            <span className="title-bold">Escolha sua Rota</span>
          </div>
        </header>

        <div className="routes-list">
          {/* Rota Principal */}
          {mainRoute.length > 0 && (
            <div 
              className={`route-item ${selectedRoute === 'A' ? 'selected' : ''}`}
              onClick={() => setSelectedRoute('A')}
            >
              <div className="route-icon-container blue">
                <CheckCircle2 size={24} fill="#00bcd4" color="#fff" />
              </div>
              <div className="route-info">
                <h4>Rota Principal</h4>
                <span className="badge-recommended">Caminho Habitual</span>
              </div>
              <div className="radio-btn">
                {selectedRoute === 'A' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
              </div>
            </div>
          )}

          {/* Rota Alternativa */}
          {altRoute.length > 0 && (
            <div 
              className={`route-item ${selectedRoute === 'B' ? 'selected' : ''}`}
              onClick={() => setSelectedRoute('B')}
            >
              <div className="route-icon-container yellow">
                <CheckCircle2 size={24} fill="#fbc02d" color="#fff" />
              </div>
              <div className="route-info">
                <h4>Rota Alternativa</h4>
                <p>Opção Secundária</p>
              </div>
              <div className="radio-btn">
                {selectedRoute === 'B' ? <Dot size={48} color="#123762" /> : <Circle size={24} color="#a0aab5" />}
              </div>
            </div>
          )}
        </div>

        <div className="action-container">
          <button 
            className="btn-select-route" 
            onClick={handleConfirmRoute}
            disabled={mainRoute.length === 0}
          >
            SELECIONAR ROTA
          </button>
        </div>
      </aside>

      <main className="map-area">
        <MapContainer 
          center={startPoint} 
          zoom={15} 
          scrollWheelZoom={true} 
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mainRoute.length > 0 && (
            <Polyline 
              positions={mainRoute} 
              pathOptions={{
                color: "#00bcd4",
                weight: selectedRoute === 'A' ? 8 : 4,
                opacity: selectedRoute === 'A' ? 1 : 0.3,
                className: selectedRoute === 'A' ? 'route-path-active' : 'route-path-inactive'
              }} 
            />
          )}

          {altRoute.length > 0 && (
            <Polyline 
              positions={altRoute} 
              pathOptions={{
                color: "#fbc02d",
                weight: selectedRoute === 'B' ? 8 : 4,
                opacity: selectedRoute === 'B' ? 1 : 0.3,
                className: selectedRoute === 'B' ? 'route-path-active' : 'route-path-inactive'
              }} 
            />
          )}
          
          {mainRoute.length > 0 && (
            <>
              <Marker position={startPoint} icon={startIcon}>
                <Popup>Início da Rota</Popup>
              </Marker>
              <Marker position={endPoint} icon={endIcon}>
                <Popup>Destino Final</Popup>
              </Marker>
            </>
          )}

        </MapContainer>
      </main>

    </div>
  );
};

export default RouteSelection;