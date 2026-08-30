import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Product } from '../../types';
import './BasketGame.css';

interface Vec2 { x: number; y: number; }

interface ThrowLayerProps {
  product: Product;
  startPos: Vec2;   // meio do card do produto (coords da tela)
  cartPos: Vec2;    // meio do botão do carrinho (coords da tela)
  onSuccess: () => void;
  onClose: () => void;
}

type Phase = 'aiming' | 'flying' | 'success' | 'miss';

// ── constantes da física, saca só ──────────────────────────────────────────
// gravidade baixa pra caramba deixa o arco de boa pra item longe chegar lá
const GRAVITY = 0.18;
const MAX_DRAG = 200;
const CART_HIT_RADIUS = 68;
const TRAJ_STEPS = 40;

function dist(a: Vec2, b: Vec2) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getTrajectory(sx: number, sy: number, vx: number, vy: number): Vec2[] {
  const pts: Vec2[] = [];
  let x = sx, y = sy, curVy = vy;
  for (let i = 0; i < TRAJ_STEPS; i++) {
    x += vx;
    curVy += GRAVITY;
    y += curVy;
    pts.push({ x, y });
    if (y > window.innerHeight + 200) break;
  }
  return pts;
}

/**
 * transforma aquela puxada monstra num lançamento.
 * a vel maxima (maxspeed) escala de acordo com a distancia,
 * então QUALQUER produto chega no carrinho no 100% de power.
 *
 * matz: bola mirando reto pro cart cai pela gravidade:
 *   Δy = 0.5 * G * (cartDist / speed)²
 * a gente quer Δy < CART_HIT_RADIUS com power no talo (1).
 * continha = maxspeed_min = cartDist * sqrt(G / (2 * CART_HIT_RADIUS))
 * dá mais ou menos cartDist * 0.036
 * nóis joga um 0.09 pra dar margem de erro kkkkk.
 */
function velFromDrag(startPos: Vec2, dragEnd: Vec2, cartPos: Vec2) {
  const dx = dragEnd.x - startPos.x;
  const dy = dragEnd.y - startPos.y;
  const raw = Math.sqrt(dx * dx + dy * dy);
  const clamped = Math.min(raw, MAX_DRAG);
  const power = clamped / MAX_DRAG;

  // bota força nessa max speed pro card lá na pqp alcançar o carrinho

  const cartDist = dist(startPos, cartPos);
  const maxSpeed = Math.max(24, cartDist * 0.092);

  const nx = raw > 0 ? dx / raw : 0;
  const ny = raw > 0 ? dy / raw : 0;
  return { vx: nx * power * maxSpeed, vy: ny * power * maxSpeed, power };
}


const MISS_MSGS = [
  'Errou! 😬',
  'Quase... 😅',
  'A mira tá estranha 👀',
  'Não foi dessa vez.',
  'Tenta aí de novo!',
  'O carrinho fugiu.',
];

export const BasketGame: React.FC<ThrowLayerProps> = ({
  product,
  startPos,
  cartPos,
  onSuccess,
  onClose,
}) => {
  const [phase, setPhase] = useState<Phase>('aiming');
  const [ballPos, setBallPos] = useState<Vec2>(startPos);
  const [dragPos, setDragPos] = useState<Vec2 | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [shots, setShots] = useState(0);
  const [baskets, setBaskets] = useState(0);
  const [cartBounce, setCartBounce] = useState(false);

  const isDragging = useRef(false);
  const ballRef = useRef<Vec2>(startPos);
  const velRef = useRef<Vec2>({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const shoot = useCallback((vx: number, vy: number) => {
    stopAnim();
    ballRef.current = { ...startPos };
    setBallPos({ ...startPos });
    velRef.current = { x: vx, y: vy };
    setPhase('flying');
    setShots(s => s + 1);

    const fly = () => {
      const pos = ballRef.current;
      const vel = velRef.current;
      const nx = pos.x + vel.x;
      const ny = pos.y + vel.y;
      const nvy = vel.y + GRAVITY;

      ballRef.current = { x: nx, y: ny };
      velRef.current = { x: vel.x * 0.997, y: nvy };
      setBallPos({ x: nx, y: ny });

      // sucesso papai: bola entrou na área do carrinho
      if (dist({ x: nx, y: ny }, cartPos) < CART_HIT_RADIUS) {
        stopAnim();
        setPhase('success');
        setBaskets(b => b + 1);
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 600);
        setTimeout(() => onSuccess(), 1800);
        return;
      }

      // foi de arrasta (fora da tela) - limite em cima bem alto pras bola rápida não morrer cedo
      if (ny > window.innerHeight + 150 || nx < -150 || nx > window.innerWidth + 150
        || ny < -500) {
        stopAnim();
        setFeedbackMsg(MISS_MSGS[Math.floor(Math.random() * MISS_MSGS.length)]);
        setPhase('miss');
        return;
      }

      animRef.current = requestAnimationFrame(fly);
    };
    animRef.current = requestAnimationFrame(fly);
  }, [startPos, cartPos, stopAnim, onSuccess]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent): Vec2 => {
    if ('touches' in e) {
      const t = (e as React.TouchEvent).touches[0] || (e as React.TouchEvent).changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'aiming') return;
    e.preventDefault();
    isDragging.current = true;
    setDragPos(getEventPos(e));
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    setDragPos(getEventPos(e));
  };

  const handleUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    isDragging.current = false;
    if (!dragPos) return;
    const pos = getEventPos(e);
    const { vx, vy, power } = velFromDrag(startPos, pos, cartPos);
    setDragPos(null);
    if (power < 0.05) return; // puxada fraca demais, ignora essa fita
    shoot(vx, vy);
  };

  const retry = () => {
    stopAnim();
    setBallPos(startPos);
    ballRef.current = startPos;
    setPhase('aiming');
    setFeedbackMsg('');
    setDragPos(null);
    isDragging.current = false;
  };

  // preview do trajeto
  const trajPoints: Vec2[] = (() => {
    if (!dragPos || phase !== 'aiming') return [];
    const { vx, vy } = velFromDrag(startPos, dragPos, cartPos);
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.5) return [];
    return getTrajectory(startPos.x, startPos.y, vx, vy);
  })();

  const { power: currentPower } = dragPos
    ? velFromDrag(startPos, dragPos, cartPos)
    : { power: 0 };

  const aimingAtCart = trajPoints.some(p => dist(p, cartPos) < CART_HIT_RADIUS * 1.4);

  // joga o pulinho do carrinho pro pai (via dom msm, mais suave)
  return (
    <>
      {/* overlay escurinho de fundo — pra pegar os evento de drag na tela toda */}
      <div
        className="throw-overlay"
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
        style={{ cursor: phase === 'aiming' ? (dragPos ? 'grabbing' : 'crosshair') : 'default' }}
        aria-label="Área de arremesso — arraste para o carrinho"
      />

      {/* faixa de dica na tela */}
      {phase === 'aiming' && (
        <div className="throw-hint-banner">
          <span className="throw-product-badge" style={{ background: `${product.color}20`, borderColor: `${product.color}50`, color: product.color }}>
            {product.emoji} {product.name}
          </span>
          <p>
            {dragPos ? 'Solte para arremessar! 🎯' : 'Clique e arraste para mirar no carrinho 🛒'}
          </p>
        </div>
      )}

      {/* pílula de stats do jogador */}
      {shots > 0 && (phase === 'aiming' || phase === 'miss') && (
        <div className="throw-stats-pill">
          🎯 {baskets}/{shots} {shots > 0 ? `(${Math.round(baskets/shots*100)}%)` : ''}
        </div>
      )}

      {/* botãozinho pra meter o pé */}
      {(phase === 'aiming' || phase === 'miss') && (
        <button className="throw-cancel-btn" onClick={onClose} aria-label="Cancelar">
          ✕ Cancelar
        </button>
      )}

      {/* bagulho de svg: linha de arrastar e os pontinhos do trajeto */}
      {phase === 'aiming' && (dragPos || trajPoints.length > 0) && (
        <svg className="throw-svg" aria-hidden="true">
          {/* linha de guia do arrasto */}
          {dragPos && (
            <line
              x1={startPos.x} y1={startPos.y}
              x2={dragPos.x} y2={dragPos.y}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
              strokeDasharray="8 5"
            />
          )}
          {/* pontinhos do trajeto da bolinha */}
          {trajPoints.map((p, i) => {
            const fade = Math.max(0, 1 - i / TRAJ_STEPS * 1.8);
            const r = i < 3 ? 5 : i < 8 ? 4 : 3;
            return (
              <circle
                key={i}
                cx={p.x} cy={p.y}
                r={r}
                fill={aimingAtCart ? '#2ecc71' : '#FF6B35'}
                opacity={fade}
              />
            );
          })}
          {/* zona alvo do carrinho */}
          <circle
            cx={cartPos.x} cy={cartPos.y}
            r={CART_HIT_RADIUS}
            fill="none"
            stroke={aimingAtCart ? 'rgba(46,204,113,0.6)' : 'rgba(255,107,53,0.3)'}
            strokeWidth="2"
            strokeDasharray="8 5"
          />
        </svg>
      )}

      {/* medidor de força pura */}
      {phase === 'aiming' && dragPos && currentPower > 0.05 && (
        <div
          className="throw-power-indicator"
          style={{
            left: Math.min(Math.max(startPos.x - 70, 12), window.innerWidth - 152),
            top: Math.min(startPos.y + 36, window.innerHeight - 60),
          }}
        >
          <span>Força</span>
          <div className="power-track">
            <div
              className="power-fill"
              style={{
                width: `${currentPower * 100}%`,
                background: currentPower < 0.4 ? '#2ecc71' : currentPower < 0.75 ? '#f39c12' : '#e74c3c',
              }}
            />
          </div>
        </div>
      )}

      {/* a bola voando (ou imagem né) */}
      {(phase === 'aiming' || phase === 'flying') && (
        <div
          className={`throw-ball ${phase === 'flying' ? 'flying' : ''} ${dragPos ? 'grabbed' : ''}`}
          style={{ left: ballPos.x, top: ballPos.y }}
          aria-hidden="true"
        >
          <img src={product.image} alt="" className="throw-ball-img" />
        </div>
      )}

      {/* aro brilhante em volta do carrinho */}
      <div
        className={`cart-glow-ring ${aimingAtCart && phase === 'aiming' ? 'on-target' : ''} ${cartBounce ? 'cart-bounce' : ''} ${phase === 'success' ? 'success' : ''}`}
        style={{ left: cartPos.x, top: cartPos.y }}
        aria-hidden="true"
      />

      {/* GANHAMO */}
      {phase === 'success' && (
        <div className="throw-result-overlay success-result" role="alert" aria-live="assertive">
          <div className="throw-result-box">
            <div className="result-big-emoji">🛒</div>
            <h3>No carrinho!</h3>
            <p><strong>{product.name}</strong> foi adicionado com sucesso! 🎉</p>
            <div className="confetti-row">🎊 🏀 🎉 ✅ 🎊</div>
          </div>
        </div>
      )}

      {/* DEU RUIM */}
      {phase === 'miss' && (
        <div className="throw-result-overlay miss-result" role="alert" aria-live="assertive">
          <div className="throw-result-box">
            <div className="result-big-emoji">😬</div>
            <h3>{feedbackMsg}</h3>
            <p>Mire no ícone do carrinho no canto superior direito.</p>
            <button className="retry-btn" onClick={retry}>Tentar novamente</button>
          </div>
        </div>
      )}
    </>
  );
};
