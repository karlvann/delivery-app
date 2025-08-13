import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DeliveryCalculator from './components/DeliveryCalculator';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeliveryCalculator />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
