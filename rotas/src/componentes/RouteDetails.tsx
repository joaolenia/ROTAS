import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Route as RouteIcon } from 'lucide-react';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import './RouteDetails.css';

const RouteDetails: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Recupera os dados enviados da tela RouteSelection
    const coordenadas = location.state?.coordenadas || [];
    const tipoRota = location.state?.tipoRota || 'Principal';

    // Calcula a distância e o tempo sempre que as coordenadas mudarem
    const { distanciaKm, tempoMinutos } = useMemo(() => {
        if (coordenadas.length < 2) return { distanciaKm: '0.00', tempoMinutos: 0 };

        // Turf.js precisa das coordenadas no formato [Longitude, Latitude]
        const turfLine = turf.lineString(coordenadas.map((c: [number, number]) => [c[1], c[0]]));
        const distancia = turf.length(turfLine, { units: 'kilometers' });

        // Cálculo de tempo: Velocidade média a pé = ~5 km/h
        const tempo = Math.round((distancia / 5) * 60);

        return {
            distanciaKm: distancia.toFixed(2), // Ex: 1.45
            tempoMinutos: tempo
        };
    }, [coordenadas]);

    // Quando o utilizador clica em Iniciar, passamos a rota escolhida para a tela do GPS
    const handleStartMonitor = () => {
        if (coordenadas.length === 0) {
            alert('Erro: Nenhuma rota selecionada.');
            return;
        }
        navigate('/monitoramento', { state: { routePath: coordenadas } });
    };

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

                {/* Título e Badge Dinâmicos */}
                <div className="title-row">
                    <h2>Rota {tipoRota}</h2>
                    <span className={tipoRota === 'Principal' ? 'badge-cyan' : 'badge-yellow'}>
                        {tipoRota === 'Principal' ? 'Recomendada' : 'Alternativa'}
                    </span>
                </div>

                {/* Lista de Informações (Sem o Destino) */}
                <div className="info-list">
                    <div className="info-item">
                        <RouteIcon size={24} className="info-icon" />
                        <div className="info-text">
                            <span className="label">Distância</span>
                            <span className="value">{distanciaKm} km</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <Clock size={24} className="info-icon" />
                        <div className="info-text">
                            <span className="label">Tempo Estimado (a pé)</span>
                            <span className="value">{tempoMinutos} min</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <Star size={24} className="info-icon" />
                        <div className="info-text">
                            <span className="label">Pontos Possíveis</span>
                            <span className="value">+100</span>
                        </div>
                    </div>
                </div>

                {/* Card de Instruções */}
                <div className="instructions-card">
                    <h3>Como funciona?</h3>
                    <ol className="instructions-list">
                        <li>
                            <span className="step-number">1</span>
                            <p>Permaneça dentro da rota segura (10 metros de tolerância);</p>
                        </li>
                        <li>
                            <span className="step-number">2</span>
                            <p>Sair da rota desconta 10 pontos da sua pontuação final;</p>
                        </li>
                        <li>
                            <span className="step-number">3</span>
                            <p>Atravesse nas faixas cadastradas para sua segurança.</p>
                        </li>
                    </ol>
                </div>

                <div className="bottom-action">
                    <button className="btn-monitor" onClick={handleStartMonitor}>
                        INICIAR MONITORAMENTO
                    </button>
                </div>

            </main>
        </div>
    );
};

export default RouteDetails;