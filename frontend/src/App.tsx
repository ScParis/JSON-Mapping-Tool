import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home/Home';

import CnpjApp from './pages/CnpjApp/CnpjApp';
import JsonApp from './pages/JsonApp/JsonApp';
import StudioApp from './pages/StudioApp/StudioApp';
import DiffApp from './pages/DiffApp/DiffApp';
import JwtApp from './pages/JwtApp/JwtApp';
import RegexApp from './pages/RegexApp/RegexApp';
import SqlApp from './pages/SqlApp/SqlApp';
import ApiApp from './pages/ApiApp/ApiApp';
import MockApp from './pages/MockApp/MockApp';
import GenerateDataApp from './pages/GenerateDataApp/GenerateDataApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="cnpj" element={<CnpjApp />} />
          <Route path="json" element={<JsonApp />} />
          <Route path="studio" element={<StudioApp />} />
          <Route path="diff" element={<DiffApp />} />
          <Route path="jwt" element={<JwtApp />} />
          <Route path="regex" element={<RegexApp />} />
          <Route path="sql" element={<SqlApp />} />
          <Route path="api" element={<ApiApp />} />
          <Route path="mock" element={<MockApp />} />
          <Route path="generate-data" element={<GenerateDataApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
