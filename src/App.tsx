import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Trophy, AlertTriangle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SONGS = [
  { id: 1, title: "Neon Grid (AI Synth)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Cyber Drift (AI Synth)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Synthwave Protocol (AI Synth)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

export default function App() {
  // --- Audio State ---
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  const directionRef = useRef(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef(INITIAL_DIRECTION);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Focus ref for the game board so keyboard controls work properly
  const gameBoardRef = useRef<HTMLDivElement>(null);

  // --- Audio Effects ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSongIndex]);

  useEffect(() => {
    // Auto-advance song when ended
    const audioEl = audioRef.current;
    const handleEnded = () => {
      setCurrentSongIndex(p => (p + 1) % SONGS.length);
    };
    if (audioEl) {
      audioEl.addEventListener('ended', handleEnded);
    }
    return () => {
      if (audioEl) audioEl.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = () => {
    setCurrentSongIndex((p) => (p + 1) % SONGS.length);
    setIsPlaying(true);
  };
  
  const prevSong = () => {
    setCurrentSongIndex((p) => (p - 1 + SONGS.length) % SONGS.length);
    setIsPlaying(true);
  };

  // --- Game Logic ---
  const getGameSpeed = useCallback(() => {
    return Math.max(50, INITIAL_SPEED - score * 1.5);
  }, [score]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
    // Optional: Auto-start music if not playing when game runs
    // if (!isPlaying) setIsPlaying(true);
    if (gameBoardRef.current) {
      gameBoardRef.current.focus();
    }
  };

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const dir = directionRef.current;
        lastProcessedDirectionRef.current = dir;
        
        const newHead = {
          x: prevSnake[0].x + dir.x,
          y: prevSnake[0].y + dir.y
        };

        // Check Wall Collision
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          setHighScore(h => Math.max(h, score));
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          setHighScore(h => Math.max(h, score));
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          // Generate new food avoiding snake
          let nextFood;
          while (true) {
            nextFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE)
            };
            if (!newSnake.some(s => s.x === nextFood.x && s.y === nextFood.y)) {
              break;
            }
          }
          setFood(nextFood);
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const timeoutId = setTimeout(moveSnake, getGameSpeed());
    return () => clearTimeout(timeoutId);
  }, [snake, isGameRunning, gameOver, food, getGameSpeed, score]);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const { x: prevX, y: prevY } = lastProcessedDirectionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (prevY !== 1) directionRef.current = { x: 0, y: -1 };
          if (!isGameRunning && !gameOver) setIsGameRunning(true);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (prevY !== -1) directionRef.current = { x: 0, y: 1 };
          if (!isGameRunning && !gameOver) setIsGameRunning(true);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (prevX !== 1) directionRef.current = { x: -1, y: 0 };
          if (!isGameRunning && !gameOver) setIsGameRunning(true);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (prevX !== -1) directionRef.current = { x: 1, y: 0 };
          if (!isGameRunning && !gameOver) setIsGameRunning(true);
          break;
        case ' ':
          if (gameOver) {
            resetGame();
          } else {
            setIsGameRunning(p => !p); // Pause/Resume toggle
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);
  
  const handleDirectionClick = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (!isGameRunning && !gameOver) setIsGameRunning(true);
    
    const { x: prevX, y: prevY } = lastProcessedDirectionRef.current;

    switch (dir) {
      case 'UP':
        if (prevY !== 1) directionRef.current = { x: 0, y: -1 };
        break;
      case 'DOWN':
        if (prevY !== -1) directionRef.current = { x: 0, y: 1 };
        break;
      case 'LEFT':
        if (prevX !== 1) directionRef.current = { x: -1, y: 0 };
        break;
      case 'RIGHT':
        if (prevX !== -1) directionRef.current = { x: 1, y: 0 };
        break;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only register touch if it's a single touch
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current.x && !touchStartRef.current.y) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;

    touchStartRef.current = { x: 0, y: 0 }; // reset

    // Ignore very small swipes to prevent accidental turns when tapping
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) handleDirectionClick('RIGHT');
      else handleDirectionClick('LEFT');
    } else {
      if (deltaY > 0) handleDirectionClick('DOWN');
      else handleDirectionClick('UP');
    }
  };

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnake = snake.some(s => s.x === x && s.y === y);
        const isHead = snake[0].x === x && snake[0].y === y;
        const isFood = food.x === x && food.y === y;

        let cellClass = "w-full h-full border border-white/5 rounded-[2px] ";
        
        if (isHead) {
          cellClass += "bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-10 relative";
        } else if (isSnake) {
          cellClass += "bg-cyan-500/60 border-cyan-400/40 relative";
        } else if (isFood) {
          cellClass += "bg-fuchsia-500 shadow-[0_0_15px_#f0abfc] rounded-full scale-75 border-none relative";
        } else {
           cellClass += "bg-transparent border-transparent";
        }

        cells.push(
          <div key={`${x}-${y}`} className={cellClass}>
             {isHead && (
               <div className="absolute inset-0 flex gap-0.5 justify-center items-center">
                 <div className="w-1 h-1 bg-black rounded-full"></div>
                 <div className="w-1 h-1 bg-black rounded-full"></div>
               </div>
             )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="min-h-[100dvh] bg-[#020205] text-[#e0e0ff] font-sans relative overflow-x-hidden flex flex-col">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <audio ref={audioRef} src={SONGS[currentSongIndex].url} preload="auto" />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 lg:px-10 py-6 z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic text-white">SynthStrike</h1>
            <p className="text-[10px] text-cyan-400/70 tracking-[0.2em] font-mono uppercase hidden sm:block">Neural Entertainment System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 lg:gap-12">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">High Score</p>
            <p className="text-xl lg:text-2xl font-mono font-bold text-fuchsia-400">{highScore.toString().padStart(5, '0')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Current Session</p>
            <p className="text-2xl lg:text-4xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">{score.toString().padStart(5, '0')}</p>
          </div>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="flex-1 flex flex-col lg:flex-row px-4 lg:px-10 py-4 lg:py-8 gap-4 lg:gap-8 items-center lg:items-stretch z-10 w-full max-w-7xl mx-auto">
        
        {/* Left Side: Music Info */}
        <aside className="w-full lg:w-64 flex flex-col justify-between hidden lg:flex">
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="aspect-square rounded-lg bg-gradient-to-tr from-cyan-950 to-fuchsia-950 flex items-center justify-center mb-4 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                 <svg className="w-16 h-16 text-cyan-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              </div>
              <h3 className="text-lg font-bold truncate text-white">{SONGS[currentSongIndex].title.split(' (')[0]}</h3>
              <p className="text-sm text-white/50">A.I. Genesis Node</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Queue</p>
              {SONGS.map((song, i) => (
                <div key={song.id} className={`flex items-center gap-3 p-2 rounded-lg ${i === currentSongIndex ? 'bg-white/10 opacity-100' : 'hover:bg-white/5 opacity-60'}`}>
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                    {i === currentSongIndex && isPlaying ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-cyan-400 rounded-full" /> : <div className="w-2 h-2 bg-white/30 rounded-full" />}
                  </div>
                  <div className="text-xs">
                    <p className="font-medium text-white truncate w-32">{song.title.split(' (')[0]}</p>
                    <p className="text-white/40 italic">TRACK 0{i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <p className="text-[9px] text-fuchsia-400 uppercase tracking-widest mb-2">System Status</p>
            <div className="flex gap-1 h-8 items-end">
              <div className="flex-1 bg-cyan-400/60 h-[40%]"></div>
              <div className="flex-1 bg-cyan-400/60 h-[80%]"></div>
              <div className="flex-1 bg-cyan-400/60 h-[60%]"></div>
              <div className="flex-1 bg-fuchsia-400/60 h-[90%]"></div>
              <div className="flex-1 bg-cyan-400/60 h-[50%]"></div>
              <div className="flex-1 bg-cyan-400/60 h-[30%]"></div>
            </div>
          </div>
        </aside>

        {/* Center: Snake Game Window */}
        <section className="flex-1 w-full relative flex flex-col items-center justify-center min-h-[300px] lg:min-h-[400px]">
          <div className="absolute inset-0 bg-cyan-400/5 rounded-3xl border-2 border-cyan-400/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] pointer-events-none hidden lg:block"></div>
          
          <div 
             className="relative aspect-square w-full max-w-[480px] bg-black/40 border border-white/5 shadow-inner overflow-hidden focus:outline-none focus:border-cyan-400/50 transition-colors touch-none"
             tabIndex={0}
             ref={gameBoardRef}
             onTouchStart={handleTouchStart}
             onTouchEnd={handleTouchEnd}
          >
            {/* Grid background simulation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '10% 10%' }}></div>
            
            <div 
               className="w-full h-full grid relative z-10 p-[1px]" 
               style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
            >
              {renderGrid()}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {!isGameRunning && !gameOver && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
                >
                  <h2 className="text-4xl lg:text-5xl font-sans font-bold text-fuchsia-500 drop-shadow-[0_0_15px_#f0abfc] mb-2 tracking-widest italic uppercase">Neural Run</h2>
                  <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-[0.3em] mb-6">Press SPACE to initialize</p>
                  <button onClick={() => { setIsGameRunning(true); if(gameBoardRef.current) gameBoardRef.current.focus(); }} className="px-6 py-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 uppercase text-xs tracking-widest transition-colors font-bold rounded-sm">
                    Start Session
                  </button>
                </motion.div>
              )}

              {gameOver && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-2 border-red-500/50 shadow-[inset_0_0_50px_rgba(255,0,0,0.3)] z-20"
                >
                  <AlertTriangle className="w-10 h-10 text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <h2 className="text-3xl lg:text-4xl font-sans font-bold text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] tracking-widest mb-2 italic uppercase">Signal Lost</h2>
                  <p className="text-lg font-mono text-white mb-6">Score <span className="text-fuchsia-400">{score.toString().padStart(5, '0')}</span></p>
                  
                  <button 
                    onClick={resetGame}
                    className="px-6 py-2 rounded-sm font-mono font-bold text-black uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  >
                    Reboot Protocol
                  </button>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-4 hidden lg:block">Press SPACE</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isGameRunning && !gameOver && (
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] lg:block hidden">Use Arrow Keys or WASD</p>
                <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] block lg:hidden">Swipe or use D-Pad</p>
              </div>
            )}
          </div>

          {/* Mobile D-Pad Controls */}
          <div className="mt-4 lg:hidden grid grid-cols-3 gap-2 w-[220px] sm:w-[260px] z-20 relative mx-auto mb-4">
            <div />
            <button 
              onClick={() => handleDirectionClick('UP')}
              className="bg-white/5 hover:bg-cyan-400/20 active:bg-cyan-400/40 aspect-square rounded-xl border border-white/10 shadow-[0_4px_0_rgba(255,255,255,0.05)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center overflow-hidden relative"
            >
              <ChevronUp className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-0 border border-cyan-400/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity"></div>
            </button>
            <div />
            <button 
              onClick={() => handleDirectionClick('LEFT')}
              className="bg-white/5 hover:bg-cyan-400/20 active:bg-cyan-400/40 aspect-square rounded-xl border border-white/10 shadow-[0_4px_0_rgba(255,255,255,0.05)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center overflow-hidden relative"
            >
              <ChevronLeft className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-0 border border-cyan-400/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity"></div>
            </button>
            <button 
              onClick={() => handleDirectionClick('DOWN')}
              className="bg-white/5 hover:bg-cyan-400/20 active:bg-cyan-400/40 aspect-square rounded-xl border border-white/10 shadow-[0_4px_0_rgba(255,255,255,0.05)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center overflow-hidden relative"
            >
              <ChevronDown className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-0 border border-cyan-400/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity"></div>
            </button>
            <button 
              onClick={() => handleDirectionClick('RIGHT')}
              className="bg-white/5 hover:bg-cyan-400/20 active:bg-cyan-400/40 aspect-square rounded-xl border border-white/10 shadow-[0_4px_0_rgba(255,255,255,0.05)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center overflow-hidden relative"
            >
              <ChevronRight className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-0 border border-cyan-400/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </section>

        {/* Right Side: Visualization */}
        <aside className="w-full lg:w-48 flex flex-col gap-4 hidden lg:flex">
           <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col overflow-hidden">
             <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Frequency Hz</p>
             <div className="flex-1 flex items-end gap-2">
               {isPlaying ? [1, 2, 3, 4, 5].map((i) => (
                 <motion.div 
                   key={i}
                   animate={{ height: [`${Math.random() * 40 + 20}%`, `${Math.random() * 60 + 40}%`, `${Math.random() * 40 + 20}%`] }}
                   transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "linear" }}
                   className={`w-full rounded-t ${i === 3 ? 'bg-fuchsia-400/80' : 'bg-cyan-400/40'}`}
                 />
               )) : (
                 <>
                   <div className="w-full bg-cyan-400/20 h-[30%] rounded-t"></div>
                   <div className="w-full bg-cyan-400/40 h-[40%] rounded-t"></div>
                   <div className="w-full bg-fuchsia-400/60 h-[60%] rounded-t"></div>
                   <div className="w-full bg-cyan-400/40 h-[40%] rounded-t"></div>
                   <div className="w-full bg-cyan-400/20 h-[30%] rounded-t"></div>
                 </>
               )}
             </div>
           </div>
           <div className="h-32 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/30 p-4 flex flex-col justify-center items-center">
             <span className="text-[10px] uppercase text-fuchsia-400 mb-1 tracking-widest">Multiplier</span>
             <span className="text-4xl font-bold italic text-white/90">x{isGameRunning ? (1 + score / 50).toFixed(1) : "1.0"}</span>
           </div>
        </aside>
      </main>

      {/* Bottom Music Controls */}
      <footer className="h-auto lg:h-24 bg-black/60 border-t border-white/10 px-4 lg:px-10 py-4 lg:py-0 flex flex-col lg:flex-row items-center justify-between z-20 gap-4 lg:gap-0">
        <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-1/4 justify-between lg:justify-start">
           <div className="flex flex-col text-left">
             <span className="text-xs font-bold text-white max-w-[120px] lg:max-w-none truncate">{SONGS[currentSongIndex].title.split(' (')[0]}</span>
             <span className="text-[10px] text-white/40 uppercase tracking-widest">A.I. Genesis Node</span>
           </div>
           <div className="flex items-center justify-end gap-2 lg:hidden">
            <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <div className="w-16 h-1 bg-white/10 rounded-full">
              <div className="h-full bg-white/40 w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl w-full">
          <div className="flex items-center gap-8">
            <button onClick={prevSong} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6L18 6v12z"/></svg>
            </button>
            <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={nextSong} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6h2v12h-2zm-10.5 6L15 6v12z"/></svg>
            </button>
          </div>
          <div className="w-full items-center gap-3 text-[10px] font-mono text-white/40 hidden lg:flex">
            <span>00:00</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
              {isPlaying ? (
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                />
              ) : (
                <div className="absolute top-0 left-0 h-full w-[45%] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
              )}
            </div>
            <span>03:22</span>
          </div>
        </div>

        <div className="items-center justify-end gap-4 w-full lg:w-1/4 hidden lg:flex">
          <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          <div className="w-24 h-1 bg-white/10 rounded-full">
            <div className="h-full bg-white/40 w-3/4 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
