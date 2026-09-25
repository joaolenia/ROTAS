import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import './CreateStudent.css'; // Reutilizando o mesmo CSS

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Busca direta na tabela verificando email e senha
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single(); // Espera apenas 1 utilizador

      if (error || !data) {
        throw new Error('E-mail ou palavra-passe incorretos.');
      }

      // Sucesso: Guarda o perfil no localStorage para uso em /detalhes-rota
      localStorage.setItem('estudante_logado', JSON.stringify(data));
      navigate('/home');
      
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="mobile-view auth-card">
        
        <div className="auth-header">
          <div className="shield-icon-wrapper">
            <ShieldCheck size={48} color="#fff" />
          </div>
          <h1>Bem-vindo</h1>
          <p>Inicie sessão para aceder às rotas</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input 
              type="email" 
              placeholder="E-mail" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input 
              type="password" 
              placeholder="Palavra-passe" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'A ENTRAR...' : 'INICIAR SESSÃO'}
            {!loading && <LogIn size={20} />}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;