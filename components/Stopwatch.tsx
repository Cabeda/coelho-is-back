'use client';

import React, { useState, useEffect, useRef } from 'react';
import { recordArrivalTime } from '@/app/actions';
import { ArrivalTime } from '@/lib/db';
import Dice3D from './Dice3D';

interface Rabbit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  targetNumber?: number;
}

interface FloatingMessage {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
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
  const [isDMMode, setIsDMMode] = useState(false);
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [hasSpellShield, setHasSpellShield] = useState(false);
  const [spellEffects, setSpellEffects] = useState<string[]>([]);
  const requestRef = useRef<number>(null);

  // Helper functions
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

  const parseTime = (timeStr: string) => {
    try {
      const [hms, cs] = timeStr.split('.');
      const [h, m, s] = hms.split(':').map(Number);
      return (h * 3600 + m * 60 + s) * 1000 + (Number(cs) || 0) * 10;
    } catch {
      return 0;
    }
  };

  // Timer logic
  useEffect(() => {
    if (!latestTime) {
      return;
    }

    if (latestTime.type === 'DEPARTURE') {
      setElapsed(prev => prev === 0 ? parseTime(latestTime.formatted_time) : prev);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - latestTime.timestamp);
    }, 10);
    return () => clearInterval(interval);
  }, [latestTime]);

  // Animation logic for bouncing rabbits
  useEffect(() => {
    const animate = () => {
      setRabbits((prevRabbits) =>
        prevRabbits.map((rabbit) => {
          let { x, y, vx, vy } = rabbit;
          const size = 50;
          
          x += vx;
          y += vy;

          // Get actual viewport dimensions
          const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
          const height = typeof window !== 'undefined' ? window.innerHeight : 1000;

          // Bounce off all walls - ensure full window coverage from top-left
          if (x < 0) {
            x = 0;
            vx = Math.abs(vx);
          }
          if (x > width - size) {
            x = width - size;
            vx = -Math.abs(vx);
          }
          if (y < 0) {
            y = 0;
            vy = Math.abs(vy);
          }
          if (y > height - size) {
            y = height - size;
            vy = -Math.abs(vy);
          }

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

  // Key sequence listener for "dnd"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newBuffer = (keyBuffer + e.key.toLowerCase()).slice(-10);
      setKeyBuffer(newBuffer);
      
      // DM Mode activation
      if (newBuffer.slice(-3) === "dnd") {
        setIsDMMode(prev => !prev);
        setKeyBuffer("");
      }
      
      // Konami code: ↑↑↓↓←→←→BA = spell shield
      if (newBuffer.slice(-10) === "uuddlrrlba") {
        setHasSpellShield(!hasSpellShield);
        setFloatingMessages(prev => [...prev, {
          id: Math.random(),
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          text: hasSpellShield ? "SHIELD DEACTIVATED!" : "SPELL SHIELD ACTIVATED!",
          color: hasSpellShield ? "text-arcade-pink" : "text-arcade-cyan"
        }]);
        setSpellEffects(prev => [...prev, hasSpellShield ? '🛡️✨' : '🛡️✨']);
        setKeyBuffer("");
      }
      
      // Healing potion: type "heal"
      if (newBuffer.slice(-4) === "heal") {
        setRabbits(prev => {
          const newRabbits = [...prev];
          if (newRabbits.length > 3) {
            newRabbits.pop(); // Remove last rabbit for "healing"
            setFloatingMessages(prev => [...prev, {
              id: Math.random(),
              x: window.innerWidth / 2,
              y: window.innerHeight / 4,
              text: "🔮 POTION USED! 💚",
              color: "text-green-400"
            }]);
            setSpellEffects(prev => [...prev, '💚✨']);
          }
          return newRabbits;
        });
        setKeyBuffer("");
      }
      
      // Curse: type "curse"
      if (newBuffer.slice(-5) === "curse") {
        const cursedEmoji = ['👿', '🧛', '🦇', '💀', '🕷️'];
        for (let i = 0; i < 5; i++) {
          const newRabbit: Rabbit = {
            id: Math.random(),
            x: Math.random() * (window.innerWidth - 40),
            y: Math.random() * (window.innerHeight - 40),
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            emoji: cursedEmoji[Math.floor(Math.random() * cursedEmoji.length)],
          };
          setRabbits(prev => [...prev, newRabbit]);
        }
        setFloatingMessages(prev => [...prev, {
          id: Math.random(),
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          text: "CURSED! 😱",
          color: "text-red-600"
        }]);
        setSpellEffects(prev => [...prev, '💀']);
        setKeyBuffer("");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyBuffer, hasSpellShield]);

  // Cleanup floating messages
  useEffect(() => {
    if (floatingMessages.length > 0) {
      const timer = setTimeout(() => {
        setFloatingMessages(prev => prev.slice(1));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [floatingMessages]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (rabbits.length >= 20) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    let emoji = isDMMode ? ['🐉', '👹', '💀', '🧙‍♂️', '⚔️', '🛡️'][Math.floor(Math.random() * 6)] : '🐇';
    let message = '';
    let messageColor = 'text-arcade-yellow';
    let targetNumber: number | undefined = undefined;
    
    // Get click coordinates - center the emoji on the click point
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Check if there's already a dice (limit to 1 for performance)
    const hasDice = rabbits.some(r => r.emoji === '🎲');
    
    // Increased frequency: 1 in 4 chance (roll >= 16), but only if no dice exists
    if (roll >= 16 && !hasDice) {
      emoji = '🎲';
      targetNumber = Math.floor(Math.random() * 6) + 1;
      message = roll === 20 ? `CRITICAL SUCCESS! (Rolled ${targetNumber})` : `DICE ROLL! (${targetNumber})`;
      messageColor = "text-arcade-yellow";
      // Add extra rabbits on crit success
      if (roll === 20) {
        for (let i = 0; i < 2; i++) {
          setRabbits(prev => {
            const newRabbit: Rabbit = {
              id: Math.random(),
              x: clickX - 20 + (Math.random() - 0.5) * 60,
              y: clickY - 20 + (Math.random() - 0.5) * 60,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              emoji: isDMMode ? '⭐' : '✨',
            };
            return [...prev, newRabbit];
          });
        }
      }
    } else if (roll === 1) {
      emoji = isDMMode ? '💀' : '👻';
      message = "CRITICAL FAIL!";
      messageColor = "text-arcade-pink";
      // Add a cursed entity on crit fail
      if (isDMMode) {
        const newRabbit: Rabbit = {
          id: Math.random(),
          x: clickX - 20,
          y: clickY - 20,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          emoji: '👺',
        };
        setRabbits(prev => [...prev, newRabbit]);
      }
    } else if (isDMMode && roll === 19) {
      emoji = '🐉';
      message = "DRAGON APPEARS!";
      messageColor = "text-red-500";
    } else if (isDMMode && roll === 18) {
      emoji = '🧙‍♂️';
      message = "WIZARD SUMMONED!";
      messageColor = "text-arcade-cyan";
    } else if (isDMMode && roll === 2) {
      emoji = '🕷️';
      message = "SPIDER WEB!";
      messageColor = "text-gray-400";
    }
    
    if (message) {
      setFloatingMessages(prev => [...prev, {
        id: Math.random(),
        x: clickX,
        y: clickY,
        text: message,
        color: messageColor
      }]);
    }

    // Only create the rabbit if we didn't add extra emojis
    const newRabbit: Rabbit = {
      id: Math.random(),
      x: clickX - 20,
      y: clickY - 20,
      vx: emoji === '🎲' ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 10,
      vy: emoji === '🎲' ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 10,
      emoji,
      targetNumber,
    };

    setRabbits((prev) => [...prev, newRabbit]);
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const formatted = formatTime(elapsed);
    const result = await recordArrivalTime(now, formatted, 'ARRIVAL');
    
    if (result.success && result.data) {
      setLatestTime(result.data);
      setHistory(prev => [result.data!, ...prev].slice(0, 10));
      setElapsed(0);
    } else {
      alert(`Error: ${result.error || 'Unknown error'}`);
    }
  };

  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const formatted = formatTime(elapsed);
    const result = await recordArrivalTime(now, formatted, 'DEPARTURE');
    
    if (result.success && result.data) {
      setLatestTime(result.data);
      setHistory(prev => [result.data!, ...prev].slice(0, 10));
    } else {
      alert(`Error: ${result.error || 'Unknown error'}`);
    }
  };

  return (
    <main 
      className={`relative w-full h-screen h-[100dvh] flex flex-col items-center justify-center overflow-hidden cursor-crosshair p-4 transition-colors duration-500 ${isDMMode ? 'bg-red-950' : 'bg-black'}`}
      onClick={handleBackgroundClick}
    >
      <div className={`absolute inset-0 z-0 ${isDMMode ? 'dungeon-grid' : 'pixel-grid'}`} />

      {/* Floating Messages */}
      {floatingMessages.map((msg) => (
        <div
          key={msg.id}
          className={`absolute pointer-events-none z-30 arcade-text text-sm md:text-lg animate-float-up ${msg.color}`}
          style={{ left: msg.x, top: msg.y }}
        >
          {msg.text}
        </div>
      ))}

      {/* Spell Effects */}
      {spellEffects.map((effect, idx) => (
        <div
          key={idx}
          className="absolute pointer-events-none z-20 text-2xl md:text-3xl animate-pulse"
          style={{ 
            left: `${30 + (idx * 10)}%`,
            top: `${20 + (idx * 5)}%`
          }}
        >
          {effect}
        </div>
      ))}

      {/* Bouncing Rabbits */}
      {rabbits.map((rabbit) => (
        <div
          key={rabbit.id}
          className={`absolute pointer-events-none ${rabbit.emoji === '🎲' ? 'z-40' : 'z-10 text-2xl md:text-4xl'}`}
          style={{
            left: 0,
            top: 0,
            transform: `translate3d(${rabbit.x}px, ${rabbit.y}px, 0)`,
            willChange: 'transform',
          }}
        >
          {rabbit.emoji === '🎲' && rabbit.targetNumber ? (
            <Dice3D targetNumber={rabbit.targetNumber} />
          ) : (
            rabbit.emoji
          )}
        </div>
      ))}

      {/* Main UI */}
      <div className={`z-20 flex flex-col items-center gap-10 md:gap-16 p-8 md:p-12 arcade-border bg-black/80 backdrop-blur-sm w-full max-w-md transition-all duration-500 ${isDMMode ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : ''} ${hasSpellShield ? 'border-arcade-cyan shadow-[0_0_30px_rgba(0,255,255,0.3)]' : ''}`}>
        <h1 className={`text-2xl md:text-4xl font-bold arcade-text text-center leading-tight mb-2 md:mb-4 ${isDMMode ? 'text-red-600' : ''}`}>
          {isDMMode ? 'DUNGEON MASTER' : 'COELHO IS BACK!'}
        </h1>

        {hasSpellShield && (
          <div className="text-xs md:text-sm arcade-text text-arcade-cyan animate-pulse">
            🛡️ SPELL SHIELD ACTIVE 🛡️
          </div>
        )}

        <div className="flex flex-col items-center w-full">
          <div className="text-4xl sm:text-5xl md:text-6xl font-mono text-arcade-yellow arcade-text tabular-nums tracking-tighter">
            {formatTime(elapsed)}
          </div>
          <div className="text-[12px] md:text-sm arcade-text mt-6 md:mt-10 mb-4 md:mb-6 h-4">
            {latestTime?.type === 'ARRIVAL' ? (
              <span className="text-arcade-cyan animate-pulse">• IN PORTO •</span>
            ) : latestTime?.type === 'DEPARTURE' ? (
              <span className="text-arcade-pink">• AWAY •</span>
            ) : (
              <span className="text-arcade-blue">• READY •</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:gap-6 w-full">
          <button
            onClick={handleReset}
            className="arcade-button w-full"
          >
            {latestTime ? 'ARRIVED IN PORTO! 🐇' : 'START JOURNEY! 🚀'}
          </button>

          {latestTime?.type === 'ARRIVAL' && (
            <button
              onClick={handleLeave}
              className="arcade-button-pink w-full"
            >
              LEFT PORTO! 👋
            </button>
          )}
        </div>

        {/* Scoreboard */}
        <div className="w-full mt-2 md:mt-4">
          <h2 className="text-lg md:text-xl font-bold arcade-text text-arcade-cyan mb-3 md:mb-4 border-b-2 border-arcade-cyan pb-2 text-center">
            RECENT TIMES
          </h2>
          <div className="space-y-2 md:space-y-3 font-mono text-xs md:text-sm max-h-[30vh] md:max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-gray-500 italic text-center">No records yet...</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center px-2 border-l-2 border-arcade-blue/30 pl-3 md:pl-4">
                  <div className="flex flex-col">
                    <span className={`text-[9px] md:text-[10px] font-bold ${entry.type === 'ARRIVAL' ? 'text-arcade-cyan' : 'text-arcade-pink'}`}>
                      {entry.type === 'ARRIVAL' ? 'ARRIVED' : 'LEFT'}
                    </span>
                    <span className="text-white/50 text-[8px] md:text-[9px]">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-arcade-yellow font-bold tabular-nums">
                    {entry.formatted_time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 md:bottom-4 w-full text-center text-[8px] md:text-xs text-arcade-blue arcade-text opacity-50 z-30">
        INSERT COIN TO CONTINUE
      </div>

      {/* Easter Egg Hints */}
      <div className="absolute top-2 md:top-4 right-2 md:right-4 text-[8px] md:text-[10px] text-arcade-blue arcade-text opacity-30 text-right leading-tight z-30">
        <div>type: dnd | heal | curse</div>
        <div>↑↑↓↓←→←→BA for shield</div>
      </div>
    </main>
  );
}
