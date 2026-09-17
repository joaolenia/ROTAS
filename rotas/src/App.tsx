import React from 'react';
import RouteSelection from './componentes/RouteSelection'; // Certifique-se de que o caminho do import está correto
import './App.css'; // Mantenha se tiver estilos globais aqui, ou remova se não for usar

const App: React.FC = () => {
  return (
    <>
      {/* Aqui estamos renderizando o componente de Login */}
      <RouteSelection />
    </>
  );
};

export default App;