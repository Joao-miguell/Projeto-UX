import React from 'react';
import type { CartItem } from '../../types';
import './Cart.css';

interface CartProps {
  items: CartItem[];
  totalPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  totalPrice,
  isOpen,
  onClose,
  onRemove,
}) => {
  const handleCheckout = () => {
    alert('🏀 Compra demonstrativa — este é um protótipo acadêmico.');
  };

  return (
    <>
      {/* aquele fundo escurinho tlg */}
      <div
        className={`cart-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* a gavetona puxando de lado */}
      <aside
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
      >
        <div className="cart-header">
          <h2>Seu carrinho 🛒</h2>
          <button
            className="cart-close"
            onClick={onClose}
            aria-label="Fechar carrinho"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🏀</span>
            <p>Seu carrinho está vazio.</p>
            <small>Faça uma cesta para adicionar produtos!</small>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="cart-item">
                  <img src={product.image} alt={product.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <strong>{product.name}</strong>
                    <span className="cart-item-category">{product.category}</span>
                  </div>
                  <div className="cart-item-right">
                    {quantity > 1 && (
                      <span className="cart-item-qty">x{quantity}</span>
                    )}
                    <span className="cart-item-price">
                      {(product.price * quantity).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                    <button
                      className="cart-item-remove"
                      onClick={() => onRemove(product.id)}
                      aria-label={`Remover ${product.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <strong>
                  {totalPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
              <button className="cart-checkout-btn" onClick={handleCheckout}>
                Finalizar compra
              </button>
              <p className="cart-disclaimer">
                🎓 Protótipo acadêmico — sem checkout real.
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
