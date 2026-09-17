import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Star, Route as RouteIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './RouteDetails.css';


const RouteDetails: React.FC = () => {
  const navigate = useNavigate();


  return (
    <div className="details-wrapper">
      
      {/* Container Mobile/Desktop */}
      <main className="details-container">
        
        {/* Cabeçalho de Voltar */}
        <header className="details-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#123762" />
          </button>
        </header>


        {/* Título e Badge */}
        <div className="title-row">
          <h2>Rota Segura A</h2>
          <span className="badge-cyan">Recomendada</span>
        </div>

        {/* Lista de Informações */}
        <div className="info-list">
          <div className="info-item">
            <MapPin size={24} className="info-icon" />
            <div className="info-text">
              <span className="label">Destino</span>
              <span className="value">Colégio Estadual</span>
            </div>
          </div>

          <div className="info-item">
            <RouteIcon size={24} className="info-icon" />
            <div className="info-text">
              <span className="label">Distância</span>
              <span className="value">2,4 km</span>
            </div>
          </div>

          <div className="info-item">
            <Clock size={24} className="info-icon" />
            <div className="info-text">
              <span className="label">Tempo Estimado</span>
              <span className="value">30 min</span>
            </div>
          </div>

          <div className="info-item">
            <Star size={24} className="info-icon" />
            <div className="info-text">
              <span className="label">Pontos Possíveis</span>
              <span className="value">+150</span>
            </div>
          </div>
        </div>

        {/* Card de Instruções */}
        <div className="instructions-card">
          <h3>Como funciona?</h3>
          <ol className="instructions-list">
            <li>
              <span className="step-number">1</span>
              <p>Permaneça dentro da rota segura;</p>
            </li>
            <li>
              <span className="step-number">2</span>
              <p>Passe pelos pontos de checagem;</p>
            </li>
            <li>
              <span className="step-number">3</span>
              <p>Atravesse nas faixas cadastradas.</p>
            </li>
          </ol>
        </div>

        {/* Botão Inferior */}
        <div className="bottom-action">
          <button className="btn-monitor">INICIAR MONITORAMENTO</button>
        </div>

      </main>
    </div>
  );
};

export default RouteDetails;