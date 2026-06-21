import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { BannerProvider } from './context/BannerContext';
import { POSProvider } from './context/POSContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './hooks/useCart';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <BannerProvider>
        <POSProvider>
          <FavoritesProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </FavoritesProvider>
        </POSProvider>
      </BannerProvider>
    </AuthProvider>
  </React.StrictMode>
);
