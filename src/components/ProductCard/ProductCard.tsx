import React from 'react';
import type { Product } from '../../types';
import './ProductCard.css';

interface Vec2 { x: number; y: number; }

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product, startPos: Vec2) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // cata o card pra pegar o meio exato dele
    const card = (e.currentTarget as HTMLElement).closest('.product-card') as HTMLElement;
    const rect = (card ?? e.currentTarget).getBoundingClientRect();
    onBuy(product, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <article
      className="product-card"
      aria-label={`${product.name} — ${product.category}`}
    >
      <div
        className="product-card-image"
        style={{ background: `${product.color}18` }}
        aria-hidden="true"
      >
        <img 
          src={product.image} 
          alt={product.name}
          className="product-card-img-element"
        />
        <div
          className="product-card-glow"
          style={{ background: product.color }}
        />
      </div>

      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="product-card-category">{product.category}</span>
        </div>

        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>

        <div className="product-card-footer">
          <span className="product-card-price">
            {product.price.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>

          <button
            className="product-card-btn"
            onClick={handleBuyClick}
            aria-label={`Comprar ${product.name} por ${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            style={{ '--accent': product.color } as React.CSSProperties}
          >
            <span>🏀</span> Comprar
          </button>
        </div>
      </div>
    </article>
  );
};
