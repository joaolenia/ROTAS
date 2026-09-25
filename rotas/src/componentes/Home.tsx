import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, MapPin, ShieldCheck, Star, 
  Trophy, User, ChevronRight, Home as HomeIcon, Map 
} from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  const [studentName, setStudentName] = useState<string>('Estudante');
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    // Recupera os dados do utilizador salvo no Login ou Registo
    const estudanteString = localStorage.getItem('estudante_logado');
    
    if (estudanteString) {
      const estudante = JSON.parse(estudanteString);
      // Pega o primeiro nome para ficar mais amigável
      const primeiroNome = estudante.name ? estudante.name.split(' ')[0] : 'Estudante';
      setStudentName(primeiroNome);
      setScore(estudante.score || 0);
    } else {
      // Se não houver ninguém logado, volta para o login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('estudante_logado');
    navigate('/login');
  };

  return (
    <div className="home-wrapper">
      <div className="mobile-view home-container">
        
        {/* Cabeçalho */}
        <header className="home-header">
          <div className="header-info">
            <div className="avatar-placeholder">
              <User size={24} color="#123762" />
            </div>
            <div>
              <p className="greeting">Olá,</p>
              <h1 className="user-name">{studentName}</h1>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sair da conta">
            <LogOut size={22} color="#e63946" />
          </button>
        </header>

        {/* Cartão de Pontuação (Gamificação) */}
        <section className="score-section">
          <div className="score-card">
            <div className="score-icon-bg">
              <Trophy size={32} color="#fbc02d" />
            </div>
            <div className="score-details">
              <p>Pontuação de Segurança</p>
              <h2>{score} <span>pts</span></h2>
            </div>
          </div>
        </section>

        {/* Ação Principal: Iniciar Rota */}
        <section className="main-action-section">
          <h3 className="section-title">O que vamos fazer hoje?</h3>
          
          <div className="action-card primary-action" onClick={() => navigate('/selecionar-rota')}>
            <div className="action-icon blue-bg">
              <Map size={28} color="#fff" />
            </div>
            <div className="action-text">
              <h4>Ir para a Escola</h4>
              <p>Escolher rota segura e iniciar GPS</p>
            </div>
            <ChevronRight size={24} color="#123762" className="chevron" />
          </div>

          <div className="action-card secondary-action" onClick={() => navigate('/perfil')}>
            <div className="action-icon light-bg">
              <ShieldCheck size={28} color="#123762" />
            </div>
            <div className="action-text">
              <h4>Meu Perfil</h4>
              <p>Ver histórico e editar rotas</p>
            </div>
            <ChevronRight size={24} color="#a0aab5" className="chevron" />
          </div>
        </section>

        {/* Espaçador para a barra de navegação não sobrepor o conteúdo */}
        <div className="spacer"></div>

        {/* Barra de Navegação Inferior */}
        <nav className="bottom-nav">
          <div className="nav-item active">
            <HomeIcon size={24} />
            <span>Início</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/selecionar-rota')}>
            <MapPin size={24} />
            <span>Rotas</span>
          </div>
          <div className="nav-item">    
            <Trophy size={24} />
            <span>Desafios</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/perfil')}>
            <User size={24} />
            <span>Perfil</span>
          </div>
        </nav>

      </div>
    </div>
  );
};

export default Home;