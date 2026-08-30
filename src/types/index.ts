export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  image: string;
  color: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BallPosition {
  x: number;
  y: number;
}

export interface BallVelocity {
  vx: number;
  vy: number;
}

export type GameState = 'idle' | 'aiming' | 'shooting' | 'success' | 'miss';

export interface GameStats {
  totalShots: number;
  totalBaskets: number;
}
