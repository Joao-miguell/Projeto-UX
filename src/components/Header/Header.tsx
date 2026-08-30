import React from 'react';
import './Header.css';

interface HeaderProps {
  totalItems: number;
  onCartClick: () => void;
  onLogoClick: () => void;
  cartButtonRef?: React.RefObject<HTMLButtonElement | null>;
  cartCatching?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalItems,
  onCartClick,
  onLogoClick,
  cartButtonRef,
  cartCatching = false,
}) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <button className="header-logo" onClick={onLogoClick} aria-label="Ir para o início">
          <span className="logo-dunk">DUNK</span>
          <span className="logo-ball">🏀</span>
          <span className="logo-shop">SHOP</span>
        </button>

        <nav className="header-nav" aria-label="Navegação principal">
          <a href="#products" onClick={(e) => handleNavClick(e, 'products')}>
            Loja
          </a>
          <a href="#about" onClick={(e) => handleNavClick(e, 'about')}>
            Sobre
          </a>
          <button
            ref={cartButtonRef}
            className={`header-cart-btn ${cartCatching ? 'cart-catching' : ''}`}
            onClick={onCartClick}
            aria-label={`Carrinho com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-label">Carrinho</span>
            {totalItems > 0 && (
              <span className="cart-badge" aria-live="polite">
                {totalItems}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
