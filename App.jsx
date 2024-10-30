import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

//pages
import Home from './pages/Home/Home';
import Ferias from './pages/Ferias/Ferias';
import Abonos from './pages/Abonos/Abonos';
import LicencasPremio from './pages/LicencasPremio/LicencasPremio';
import LicencasMedicas from './pages/LicencasMedicas/LicencasMedicas';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ferias" element={<Ferias />} />
            <Route path="/abonos" element={<Abonos />} />
            <Route path="/licencaspremio" element={<LicencasPremio />} />
            <Route path="/licencasmedicas" element={<LicencasMedicas />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
