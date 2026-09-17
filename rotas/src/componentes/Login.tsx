import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';
import logo from '../logo.png'

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
    // Lógica de autenticação aqui
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Placeholder para a Logo */}
        <div className="logo-container">
          <img 
            src={logo} 
            alt="R.O.T.A.S. Logo" 
            className="logo-image" 
          />
          <h2 className="logo-title">R.O.T.A.S.</h2>
          <p className="logo-subtitle">
            Rede de Orientação e Trafegabilidade<br/>
            Ativa para Segurança Escolar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="btn-entrar">
            ENTRAR
          </button>
        </form>

        <div className="login-links">
          <a href="/esqueci-senha" className="link-text">
            Esqueci minha senha
          </a>
          <a href="/cadastro" className="link-text">
            Ainda não possuo uma conta
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;