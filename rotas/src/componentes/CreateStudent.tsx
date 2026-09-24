import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Lock, Mail, Phone, Map, ShieldCheck, ArrowRight } from 'lucide-react';
import './CreateStudent.css';

const CreateStudent: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    mainRoute: '[\n  [-26.4288, -51.3163],\n  [-26.4273, -51.3170]\n]',
    altRoute: '[\n  [-26.4290, -51.3150],\n  [-26.4270, -51.3180]\n]'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Validar se as rotas são JSON válidos
      const parsedMainRoute = JSON.parse(formData.mainRoute);
      const parsedAltRoute = JSON.parse(formData.altRoute);

      // 2. Criar utilizador na Autenticação do Supabase (auth.users)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw new Error(authError.message);

      // 3. Inserir o perfil do estudante na tabela 'students'
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('students')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              name: formData.name,
              phone_responsible: formData.phone,
              score: 100, // Pontuação inicial
              main_route: parsedMainRoute,
              alt_route: parsedAltRoute
            }
          ]);

        if (dbError) throw new Error(dbError.message);

        // Sucesso! Redireciona para o mapa ou para o ecrã de seleção
        navigate('/monitoramento');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar a conta. Verifique os dados JSON das rotas.');
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
          <h1>Criar Conta Segura</h1>
          <p>Configure o perfil do estudante e as rotas</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMsg && <div className="error-message">{errorMsg}</div>}

          {/* Dados Pessoais */}
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input type="text" name="name" placeholder="Nome do Estudante" required value={formData.name} onChange={handleChange} />
          </div>

          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input type="email" name="email" placeholder="E-mail (Login)" required value={formData.email} onChange={handleChange} />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input type="password" name="password" placeholder="Palavra-passe (Mínimo 6 caracteres)" required minLength={6} value={formData.password} onChange={handleChange} />
          </div>

          <div className="input-group">
            <Phone size={20} className="input-icon" />
            <input type="tel" name="phone" placeholder="Telemóvel do Responsável" required value={formData.phone} onChange={handleChange} />
          </div>

          <hr className="divider" />
          <h3 className="section-subtitle">Configuração de Rotas</h3>

          {/* Rota Principal */}
          <div className="textarea-group">
            <label><Map size={16} /> Coordenadas Rota Principal</label>
            <textarea name="mainRoute" rows={4} required value={formData.mainRoute} onChange={handleChange}></textarea>
            <span className="help-text">Formato: [[lat, lng], [lat, lng]]</span>
          </div>

          {/* Rota Alternativa */}
          <div className="textarea-group">
            <label><Map size={16} /> Coordenadas Rota Alternativa</label>
            <textarea name="altRoute" rows={4} value={formData.altRoute} onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'A CRIAR CONTA...' : 'FINALIZAR REGISTO'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreateStudent;