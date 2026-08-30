import { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header/Header';
import { ProductGrid } from './components/ProductGrid/ProductGrid';
import { BasketGame } from './components/BasketGame/BasketGame';
import { Cart } from './components/Cart/Cart';
import { About } from './components/About/About';
import { useCart } from './hooks/useCart';
import { products } from './data/products';
import type { Product } from './types';
import './App.css';

interface Vec2 { x: number; y: number; }

function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [startPos, setStartPos] = useState<Vec2>({ x: 0, y: 0 });
  const [cartPos, setCartPos] = useState<Vec2>({ x: 0, y: 0 });
  const [isThrowOpen, setIsThrowOpen] = useState(false);
  const [cartCatching, setCartCatching] = useState(false);

  const cartButtonRef = useRef<HTMLButtonElement>(null);

  const {
    items,
    isOpen: isCartOpen,
    setIsOpen: setIsCartOpen,
    addItem,
    removeItem,
    totalItems,
    totalPrice,
  } = useCart();

  const handleBuy = useCallback((product: Product, cardStartPos: Vec2) => {
    // pega a pos do botão do carrinho bem na hora (ajuda se o cara deu scroll)
    const cartRect = cartButtonRef.current?.getBoundingClientRect();
    if (!cartRect) return;

    setSelectedProduct(product);
    setStartPos(cardStartPos);
    setCartPos({
      x: cartRect.left + cartRect.width / 2,
      y: cartRect.top + cartRect.height / 2,
    });
    setIsThrowOpen(true);
  }, []);

  const handleThrowSuccess = useCallback(() => {
    if (!selectedProduct) return;
    addItem(selectedProduct);

    // faz o carrinho dar aquele pulo maneiro
    setCartCatching(true);
    setTimeout(() => setCartCatching(false), 600);

    // fecha o minigame e abre a gaveta do carrinho
    setIsThrowOpen(false);
    setSelectedProduct(null);
    setIsCartOpen(true);
  }, [selectedProduct, addItem, setIsCartOpen]);

  const handleThrowClose = useCallback(() => {
    setIsThrowOpen(false);
    setSelectedProduct(null);
  }, []);

  return (
    <div className="app">
      <Header
        totalItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        cartButtonRef={cartButtonRef}
        cartCatching={cartCatching}
      />

      <main>
        <ProductGrid products={products} onBuy={handleBuy} />
        <About />
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>
            <strong>DUNK🏀SHOP</strong> — Protótipo Acadêmico de UX
          </span>
          <span className="app-footer-sep">·</span>
          <span>Disciplina de Experiência do Usuário</span>
        </div>
      </footer>

      {/* paradinha de jogar no carrinho */}
      {isThrowOpen && selectedProduct && (
        <BasketGame
          product={selectedProduct}
          startPos={startPos}
          cartPos={cartPos}
          onSuccess={handleThrowSuccess}
          onClose={handleThrowClose}
        />
      )}

      {/* gaveta lateral do carrinho */}
      <Cart
        items={items}
        totalPrice={totalPrice}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemove={removeItem}
      />
    </div>
  );
}

export default App;
