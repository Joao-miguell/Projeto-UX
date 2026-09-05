import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
const CART_HIT_RADIUS = 36;  // hitbox pequena igual bom senso de designer
const TRAJ_STEPS = 40;

// vento: desvio lateral por frame — muda a cada arremesso
let windDrift = 0;

// no celular não dá pra arrastar 200px sem sair da tela, então ajusta aí
const getMaxDrag = () => Math.min(200, window.innerWidth * 0.35);

function dist(a: Vec2, b: Vec2) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getTrajectory(sx: number, sy: number, vx: number, vy: number): Vec2[] {
  const pts: Vec2[] = [];
  let x = sx, y = sy, curVy = vy, curVx = vx;
  for (let i = 0; i < TRAJ_STEPS; i++) {
    curVx += windDrift; // a mira ja mostra o vento que vai rolar
    curVy += GRAVITY;
    x += curVx;
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
 */
function velFromDrag(startPos: Vec2, dragEnd: Vec2, cartPos: Vec2) {
  // agora é estilo estilingue (slingshot) invertendo as coordenadas
  const dx = startPos.x - dragEnd.x;
  const dy = startPos.y - dragEnd.y;
  const raw = Math.sqrt(dx * dx + dy * dy);
  const maxD = getMaxDrag();
  const clamped = Math.min(raw, maxD);
  const power = clamped / maxD;

  // bota força nessa max speed pro card lá na pqp alcançar o carrinho
  const cartDist = dist(startPos, cartPos);
  const maxSpeed = Math.max(24, cartDist * 0.092);

  const nx = raw > 0 ? dx / raw : 0;
  const ny = raw > 0 ? dy / raw : 0;
  return { vx: nx * power * maxSpeed, vy: ny * power * maxSpeed, power };
}


const MISS_MSGS = [
  'Errou feio! 😬',
  'Quase... tenta mais 😅',
  'Você é péssimo nisso 👀',
  'Nem chegou perto irmão.',
  'Talvez o carrinho não seja pra você.',
  'O carrinho saiu de fininho.',
  'Skill issue 💀',
  'Minha vó acertaria.',
];

// quanto tempo até a previa do trajeto sumir (ms)
const TRAJ_HIDE_DELAY = 800;

// amplitude do balanço do carrinho (px)
const CART_SWING_AMPLITUDE = 60;
const CART_SWING_SPEED = 0.04; // radianos por frame

export const BasketGame: React.FC<ThrowLayerProps> = ({
  product,
  startPos,
  cartPos: cartPosInitial,
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

  // posição atual do carrinho (se move!)
  const [cartPos, setCartPos] = useState<Vec2>(cartPosInitial);
  const cartAngleRef = useRef(0);
  const cartAnimRef = useRef<number | null>(null);
  // ref pra collision no loop de animação (state tem closure stale)
  const cartPosRef = useRef<Vec2>(cartPosInitial);

  // controle da prévia da mira some
  const [showTraj, setShowTraj] = useState(true);
  const trajHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // carrinho bagunçado que fica se mexendo
  useEffect(() => {
    if (phase !== 'aiming' && phase !== 'flying') {
      if (cartAnimRef.current) cancelAnimationFrame(cartAnimRef.current);
      return;
    }
    const swing = () => {
      cartAngleRef.current += CART_SWING_SPEED;
      const newPos = {
        x: cartPosInitial.x + Math.sin(cartAngleRef.current) * CART_SWING_AMPLITUDE,
        y: cartPosInitial.y + Math.sin(cartAngleRef.current * 0.7) * 20,
      };
      cartPosRef.current = newPos; // atualiza a ref (usada no fly loop)
      setCartPos(newPos);          // atualiza o state (usado no render)
      cartAnimRef.current = requestAnimationFrame(swing);
    };
    cartAnimRef.current = requestAnimationFrame(swing);
    return () => {
      if (cartAnimRef.current) cancelAnimationFrame(cartAnimRef.current);
    };
  }, [phase, cartPosInitial]);

  // quando começa a arrastar, sorteia o vento e marca pra mira sumir
  const startDragSession = () => {
    // vento aleatório entre -0.15 e +0.15 por frame (desvio sutil mas fudido)
    windDrift = (Math.random() - 0.5) * 0.3;
    setShowTraj(true);
    if (trajHideTimer.current) clearTimeout(trajHideTimer.current);
    trajHideTimer.current = setTimeout(() => setShowTraj(false), TRAJ_HIDE_DELAY);
  };

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
      const nvx = vel.x * 0.997 + windDrift; // vento desvia pra um lado kkkk
      const nx = pos.x + nvx;
      const ny = pos.y + vel.y;
      const nvy = vel.y + GRAVITY;

      ballRef.current = { x: nx, y: ny };
      velRef.current = { x: nvx, y: nvy };
      setBallPos({ x: nx, y: ny });

      // sucesso! usa a ref do carrinho (posição atual enquanto ele se mexe)
      if (dist({ x: nx, y: ny }, cartPosRef.current) < CART_HIT_RADIUS) {
        stopAnim();
        setPhase('success');
        setBaskets(b => b + 1);
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 600);

        // faz a festa de verdade
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#2ecc71', '#f1c40f', '#e74c3c', '#3498db']
        });
        // segundo salvo de confete um tempinho depois pra ser dramático
        setTimeout(() => confetti({
          particleCount: 100,
          spread: 120,
          startVelocity: 20,
          origin: { x: 0.2, y: 0.5 },
          colors: ['#FF6B35', '#fff', '#f1c40f'],
        }), 400);
        setTimeout(() => confetti({
          particleCount: 100,
          spread: 120,
          startVelocity: 20,
          origin: { x: 0.8, y: 0.5 },
          colors: ['#FF6B35', '#fff', '#f1c40f'],
        }), 600);

        setTimeout(() => onSuccess(), 2200);
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
  }, [startPos, stopAnim, onSuccess]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent): Vec2 => {
    if ('touches' in e) {
      const t = (e as React.TouchEvent).touches[0] || (e as React.TouchEvent).changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'aiming') return;
    // prevent default mata o scroll no mobile pra podermos arrastar em paz
    if (e.cancelable) e.preventDefault();
    isDragging.current = true;
    startDragSession(); // sorteia vento e começa contagem pra mira sumir
    setDragPos(getEventPos(e));
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'aiming') return;
    if (e.cancelable) e.preventDefault();
    if (!isDragging.current) return;
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
            {dragPos
              ? (showTraj ? 'Mira vai sumir... ⚠️' : 'Solte agora! 🎯')
              : 'Puxe para trás feito estilingue 🎯 — mira some rápido!'}
          </p>
          {dragPos && windDrift !== 0 && (
            <p className="wind-indicator">
              {windDrift > 0.08 ? '💨💨 Vento forte ←' : windDrift < -0.08 ? '💨💨 Vento forte →' : windDrift > 0 ? '💨 Vento ←' : '💨 Vento →'}
            </p>
          )}
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
          {/* pontinhos do trajeto — somem depois de TRAJ_HIDE_DELAY ms */}
          {showTraj && trajPoints.map((p, i) => {
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
          {/* zona alvo do carrinho — se move com o carrinho */}
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
