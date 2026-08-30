import { useState, useRef, useCallback } from 'react';
import type { GameState, GameStats, BallPosition, BallVelocity } from '../types';

const GRAVITY = 0.45;
const MAX_DRAG_DISTANCE = 150;

interface UseBasketGameProps {
  onSuccess: () => void;
}

export function useBasketGame({ onSuccess }: UseBasketGameProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [ballPos, setBallPos] = useState<BallPosition>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<BallPosition | null>(null);
  const [dragCurrent, setDragCurrent] = useState<BallPosition | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showRimShake, setShowRimShake] = useState(false);
  const [stats, setStats] = useState<GameStats>({ totalShots: 0, totalBaskets: 0 });

  const animFrameRef = useRef<number | null>(null);
  const ballRef = useRef<BallPosition>({ x: 0, y: 0 });
  const velocityRef = useRef<BallVelocity>({ vx: 0, vy: 0 });
  const basketPosRef = useRef<BallPosition>({ x: 0, y: 0 });
  const initialBallRef = useRef<BallPosition>({ x: 0, y: 0 });
  const dragStartRef = useRef<BallPosition | null>(null);

  const missMessages = [
    'Quase! 😬',
    'A tabela sentiu essa.',
    'Foi por pouco...',
    'Essa não caiu.',
    'Mira melhor 👀',
    'Continua tentando!',
    'O aro disse não.',
  ];

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const resetBall = useCallback(() => {
    setBallPos({ ...initialBallRef.current });
    ballRef.current = { ...initialBallRef.current };
    velocityRef.current = { vx: 0, vy: 0 };
  }, []);

  const initGame = useCallback((
    ballInitial: BallPosition,
    basketPosition: BallPosition
  ) => {
    initialBallRef.current = ballInitial;
    basketPosRef.current = basketPosition;
    ballRef.current = { ...ballInitial };
    setBallPos({ ...ballInitial });
    setGameState('idle');
    setDragStart(null);
    setDragCurrent(null);
    setFeedbackMessage('');
  }, []);

  const shoot = useCallback((vx: number, vy: number) => {
    stopAnimation();
    velocityRef.current = { vx, vy };
    setGameState('shooting');
    setStats((s) => ({ ...s, totalShots: s.totalShots + 1 }));

    const basketX = basketPosRef.current.x;
    const basketY = basketPosRef.current.y;
    const rimRadius = 28;
    const successZoneHeight = 40;

    let hitRim = false;
    let successRegistered = false;

    const step = () => {
      const pos = ballRef.current;
      const vel = velocityRef.current;

      const newX = pos.x + vel.vx;
      const newY = pos.y + vel.vy;
      const newVy = vel.vy + GRAVITY;

      ballRef.current = { x: newX, y: newY };
      velocityRef.current = { vx: vel.vx * 0.995, vy: newVy };
      setBallPos({ x: newX, y: newY });

      // Check rim proximity for shake effect
      const distToBasket = Math.sqrt(
        Math.pow(newX - basketX, 2) + Math.pow(newY - basketY, 2)
      );

      if (distToBasket < rimRadius + 15 && !hitRim && vel.vy > 0) {
        hitRim = true;
        setShowRimShake(true);
        setTimeout(() => setShowRimShake(false), 300);
      }

      // Check success: ball passes through hoop area going downward
      if (
        !successRegistered &&
        vel.vy > 1 &&
        Math.abs(newX - basketX) < rimRadius - 8 &&
        newY >= basketY - 10 &&
        newY <= basketY + successZoneHeight
      ) {
        successRegistered = true;
        stopAnimation();
        setGameState('success');
        setStats((s) => ({ ...s, totalBaskets: s.totalBaskets + 1 }));
        onSuccess();
        return;
      }

      // Out of bounds check (fixed container: 520w × 420h)
      if (newY > 450 || newX < -60 || newX > 580) {
        stopAnimation();
        const msg = missMessages[Math.floor(Math.random() * missMessages.length)];
        setFeedbackMessage(msg);
        setGameState('miss');
        return;
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, [stopAnimation, onSuccess]);

  const startDrag = useCallback((pos: BallPosition) => {
    dragStartRef.current = pos;
    setDragStart(pos);
    setDragCurrent(pos);
    setGameState('aiming');
  }, []);

  const updateDrag = useCallback((pos: BallPosition) => {
    setDragCurrent(pos);
  }, []);

  const endDrag = useCallback((pos: BallPosition) => {
    const ds = dragStartRef.current;
    if (!ds) return;

    const dx = ds.x - pos.x;
    const dy = ds.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    dragStartRef.current = null;
    setDragStart(null);
    setDragCurrent(null);

    if (distance < 10) {
      setGameState('idle');
      return;
    }

    const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
    const power = clampedDistance / MAX_DRAG_DISTANCE;
    const maxSpeed = 16;

    const vx = (dx / distance) * power * maxSpeed;
    const vy = (dy / distance) * power * maxSpeed;

    shoot(vx, vy);
  }, [shoot]);

  const retry = useCallback(() => {
    stopAnimation();
    resetBall();
    setGameState('idle');
    setFeedbackMessage('');
  }, [stopAnimation, resetBall]);

  const dragPower = dragStart && dragCurrent
    ? Math.min(
        Math.sqrt(
          Math.pow(dragCurrent.x - dragStart.x, 2) +
          Math.pow(dragCurrent.y - dragStart.y, 2)
        ) / MAX_DRAG_DISTANCE,
        1
      )
    : 0;

  return {
    gameState,
    ballPos,
    dragStart,
    dragCurrent,
    feedbackMessage,
    showRimShake,
    stats,
    dragPower,
    initGame,
    startDrag,
    updateDrag,
    endDrag,
    retry,
    stopAnimation,
  };
}
