import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PeriodsProvider } from './contexts/PeriodosContext'; // Supondo que você tenha um contexto de períodos
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute'; // Certifique-se de que a importação esteja correta

import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Ferias from './pages/Ferias/Ferias';
import Abonos from './pages/Abonos/Abonos';
import LicencasPremio from './pages/LicencasPremio/LicencasPremio';
import LicencasMedicas from './pages/LicencasMedicas/LicencasMedicas';
import BuscarPeriodos from './pages/BuscarPeriodos/BuscarPeriodos';

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <PeriodsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ferias"
              element={
                <ProtectedRoute>
                  <Ferias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonos"
              element={
                <ProtectedRoute>
                  <Abonos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/licencaspremio"
              element={
                <ProtectedRoute>
                  <LicencasPremio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/licencasmedicas"
              element={
                <ProtectedRoute>
                  <LicencasMedicas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buscarperiodos"
              element={
                <ProtectedRoute>
                  <BuscarPeriodos />
                </ProtectedRoute>
              }
            />
          </Routes>
        </PeriodsProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
