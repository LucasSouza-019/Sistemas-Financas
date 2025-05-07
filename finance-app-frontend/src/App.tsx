import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import CadastroRendas from './pages/CadastroRendas';
import CadastroContasFixas from './pages/CadastroContasFixas';

// Componente para proteger rotas que requerem autenticação
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route 
            path="/cadastro-rendas" 
            element={
              <ProtectedRoute>
                <CadastroRendas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cadastro-contas-fixas" 
            element={
              <ProtectedRoute>
                <CadastroContasFixas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;