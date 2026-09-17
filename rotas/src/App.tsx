import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RouteSelection from './componentes/RouteSelection';
import RouteDetails from './componentes/RouteDetails';

const App: React.FC = () => {
  return (
    // O BrowserRouter é OBRIGATÓRIO por fora de tudo que usa rotas
    <BrowserRouter> 
      <Routes>
        <Route path="/" element={<RouteSelection />} />
        <Route path="/detalhes-rota" element={<RouteDetails />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;