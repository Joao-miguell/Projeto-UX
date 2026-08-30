import React from 'react';
import type { Product } from '../../types';
import { ProductCard } from '../ProductCard/ProductCard';
import './ProductGrid.css';

interface Vec2 { x: number; y: number; }

interface ProductGridProps {
  products: Product[];
  onBuy: (product: Product, startPos: Vec2) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onBuy }) => {
  return (
    <section id="products" className="product-grid-section" aria-label="Produtos">
      <div className="product-grid-inner">
        <div className="product-grid-header">
          <h2 className="product-grid-title">Produtos</h2>
          <p className="product-grid-subtitle">
            Escolha o que quiser — mas vai ter que acertar o carrinho. 🛒
          </p>
        </div>

        <div className="product-grid" role="list">
          {products.map((product) => (
            <div key={product.id} role="listitem">
              <ProductCard product={product} onBuy={onBuy} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
