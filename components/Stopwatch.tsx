'use client';

import React, { useState, useEffect, useRef } from 'react';
import { recordArrivalTime } from '@/app/actions';
import { ArrivalTime } from '@/lib/db';

interface Rabbit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
}

interface StopwatchProps {
  initialLatestTime: ArrivalTime | null;
  initialHistory: ArrivalTime[];
}

export default function Stopwatch({ initialLatestTime, initialHistory }: StopwatchProps) {
  const [latestTime, setLatestTime] = useState<ArrivalTime | null>(initialLatestTime);
  const [history, setHistory] = useState<ArrivalTime[]>(initialHistory);
  const [elapsed, setElapsed] = useState<number>(0);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const requestRef = useRef<number>(null);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (latestTime) {
        setElapsed(Date.now() - latestTime.timestamp);
      } else {
        setElapsed(0);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [latestTime]);

  // Animation logic for bouncing rabbits
  useEffect(() => {
    const animate = () => {
      setRabbits((prevRabbits) =>
        prevRabbits.map((rabbit) => {
          let { x, y, vx, vy } = rabbit;
          const size = 40;

          x += vx;
          y += vy;

          if (x <= 0 || x >= window.innerWidth - size) vx *= -1;
          if (y <= 0 || y >= window.innerHeight - size) vy *= -1;

          x = Math.max(0, Math.min(x, window.innerWidth - size));
          y = Math.max(0, Math.min(y, window.innerHeight - size));

          return { ...rabbit, x, y, vx, vy };
        })
      );
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (rabbits.length >= 20) return;

    const newRabbit: Rabbit = {
      id: Math.random(),
      x: e.clientX - 20,
      y: e.clientY - 20,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      emoji: '🐇',
    };

    setRabbits((prev) => [...prev, newRabbit]);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const formatted = formatTime(0);
    const result = await recordArrivalTime(now, formatted);
    
    if (result.success && result.data) {
      setLatestTime(result.data);
      setHistory(prev => [result.data!, ...prev].slice(0, 10));
    }
  };

  return (
    <main 
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black cursor-crosshair"
      onClick={handleBackgroundClick}
    >
      <div className="pixel-grid absolute inset-0 z-0" />

      {/* Bouncing Rabbits */}
      {rabbits.map((rabbit) => (
        <div
          key={rabbit.id}
          className="absolute text-4xl pointer-events-none z-10"
          style={{
            transform: `translate3d(${rabbit.x}px, ${rabbit.y}px, 0)`,
            willChange: 'transform',
          }}
        >
          {rabbit.emoji}
        </div>
      ))}

      {/* Main UI */}
      <div className="z-20 flex flex-col items-center gap-8 p-8 arcade-border bg-black/80 backdrop-blur-sm max-w-md w-full">
        <h1 className="text-4xl font-bold arcade-text text-center">
          COELHO IS BACK!
        </h1>

        <div className="text-6xl font-mono text-arcade-yellow arcade-text tabular-nums">
          {formatTime(elapsed)}
        </div>

        <button
          onClick={handleReset}
          className="arcade-button px-8 py-4 text-2xl font-bold hover:scale-105 active:scale-95"
        >
          ARRIVED IN PORTO! 🐇
        </button>

        {/* Scoreboard */}
        <div className="w-full mt-4">
          <h2 className="text-xl font-bold arcade-text text-arcade-cyan mb-4 border-b-2 border-arcade-cyan pb-2 text-center">
            RECENT ARRIVALS
          </h2>
          <div className="space-y-2 font-mono text-sm">
            {history.length === 0 ? (
              <p className="text-gray-500 italic text-center">No records yet...</p>
            ) : (
              history.map((entry, i) => (
                <div key={entry.id} className="flex justify-between items-center px-2">
                  <span className="text-arcade-pink">{i + 1}. {new Date(entry.timestamp).toLocaleDateString()}</span>
                  <span className="text-arcade-cyan">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-xs text-arcade-blue arcade-text opacity-50">
        INSERT COIN TO CONTINUE
      </div>
    </main>
  );
}
