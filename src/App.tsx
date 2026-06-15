import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/page';
import ProdutosPage from './pages/produtos/page';
import ProdutoDetailsPage from './pages/produtos/[id]/page';
import LoginPage from './pages/login/page';
import ContaPage from './pages/conta/page';
import PoliticasPage from './pages/politicas/page';
import CarrinhoPage from './pages/carrinho/page';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/produtos/:id" element={<ProdutoDetailsPage />} />
            <Route path="/carrinho" element={<CarrinhoPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/conta" element={<ContaPage />} />
            <Route path="/politicas" element={<PoliticasPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
