import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Outlet } from 'react-router-dom';

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
import CheckoutPage from './pages/checkout/page';
import FavoritesPage from './pages/favorites/page';

// New Pages
import { ModuleSelection } from './pages/ModuleSelection';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { Cashier } from './pages/pos/Cashier';

function ShopLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ShopLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/produtos/:id" element={<ProdutoDetailsPage />} />
          <Route path="/carrinho" element={<CarrinhoPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/conta" element={<ContaPage />} />
          <Route path="/politicas" element={<PoliticasPage />} />
          <Route path="/favoritos" element={<FavoritesPage />} />
        </Route>
        
        <Route path="/selecionar-modulo" element={<ModuleSelection />} />
        <Route path="/painel/*" element={<ManagerDashboard />} />
        <Route path="/caixa" element={<Cashier />} />
      </Routes>
    </BrowserRouter>
  );
}
