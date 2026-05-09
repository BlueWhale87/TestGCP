import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, VolumeX, Volume2 } from 'lucide-react';

const GRID_SIZE = 22;

type Point = { x: number; y: number };

const tracks = [
  { id: 1, title: 'tape_01.aif', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
  { id: 2, title: 'fm_drums.wav', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  { id: 3, title: 'pulse_wave.mdl', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' }
];

// Custom hook for intervals
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  
  // Safely assign latest callback during render to avoid dependency issues
  // in accordance with useEffect dependency constraints
  savedCallback.current = callback;

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function App() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [nextDirection, setNextDirection] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [speed, setSpeed] = useState(130);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood = { x: 0, y: 0 };
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      isOccupied = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    setNextDirection({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
    setSpeed(130);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setIsGameStarted(true);

    if (!isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  useInterval(() => {
    if (gameOver || !isGameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { x: head.x + nextDirection.x, y: head.y + nextDirection.y };
      
      setDirection(nextDirection);

      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE || 
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)
      ) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setSpeed(s => Math.max(50, s - 2)); 
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, isGameStarted && !gameOver ? speed : null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction.x, direction.y]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="min-h-screen w-full bg-[#eef0f2] text-black flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
      <audio 
        ref={audioRef} 
        src={tracks[currentTrackIndex].url}
        onEnded={handleNextTrack}
        muted={isMuted}
      />

      {/* Hardware Body */}
      <div id="device-body" className="w-full max-w-[1000px] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-6 lg:p-10 relative flex flex-col gap-6 lg:gap-8 border border-black/5 selection:bg-[#ff3300] selection:text-white">
        
        {/* Brand & Speaker Header */}
        <div className="flex justify-between items-start px-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight lowercase flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#ff3300] shadow-inner"></span>
              snake—1
            </h1>
            <p className="font-mono text-xs text-black/40 lowercase tracking-tight">8-bit computation & audio unit.</p>
          </div>

          {/* Faux Speaker Grill */}
          <div className="hidden sm:flex gap-1.5 opacity-20 mr-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="w-1.5 h-1.5 rounded-full bg-black"></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: SCREEN & GAME MODULE */}
          <div id="game-screen-module" className="flex-1 bg-[#222222] rounded-[2rem] p-6 flex flex-col shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] border-2 border-[#111]">
            <div className="w-full flex justify-between items-center mb-4 px-2">
               <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">display_01</span>
               <span className="w-2 h-2 rounded-full bg-[#00cc55] shadow-[0_0_8px_#00cc55]"></span>
            </div>

            <div className="flex-1 flex justify-center items-center relative rounded-xl overflow-hidden bg-[#0a0a0a]">
              
              <div 
                className="grid gap-[2px] p-4 relative z-10 mx-auto"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isSnake = snake.some(s => s.x === x && s.y === y);
                  const isHead = snake[0].x === x && snake[0].y === y;
                  const isFood = food.x === x && food.y === y;

                  return (
                    <div 
                      key={i} 
                      className={`
                        w-[10px] h-[10px] sm:w-[14px] sm:h-[14px] transition-colors duration-75
                        ${isHead ? 'bg-white rounded-[3px]' : isSnake ? 'bg-[#ff5500] rounded-[3px]' : isFood ? 'bg-[#0055ff] rounded-full shadow-[0_0_8px_#0055ff]' : 'bg-[#1a1a1a] rounded-[2px]'}
                      `} 
                    />
                  );
                })}
              </div>

              {/* SCREEN OVERLAYS */}
              {(!isGameStarted || gameOver) && (
                <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                  <h2 className="text-xl sm:text-2xl font-bold lowercase tracking-tight mb-8 text-white font-sans">
                    {gameOver ? 'system halted.' : 'ready.'}
                  </h2>
                  <button 
                    id="game-start-button"
                    onClick={resetGame}
                    className="font-sans text-sm font-bold lowercase px-8 py-3 rounded-full bg-[#ff5500] hover:bg-[#ff6611] text-white transition-all shadow-lg active:scale-95"
                  >
                    {gameOver ? 'reboot' : 'press start'}
                  </button>
                </div>
              )}
            </div>

            {/* D-Pad Hint */}
            <div className="mt-8 flex justify-between items-center text-white/40 font-mono text-[10px] px-2 uppercase tracking-widest">
              <div className="flex gap-1.5">
                <span className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shadow-[0_2px_0_rgba(255,255,255,0.1)]">W</span>
                <span className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shadow-[0_2px_0_rgba(255,255,255,0.1)]">A</span>
                <span className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shadow-[0_2px_0_rgba(255,255,255,0.1)]">S</span>
                <span className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shadow-[0_2px_0_rgba(255,255,255,0.1)]">D</span>
              </div>
              <span>d-pad</span>
            </div>
          </div>

          {/* RIGHT: AUDIO MODULE & TAPE CONTROLS */}
          <div id="audio-module" className="w-full lg:w-[320px] flex flex-col gap-6 lg:gap-8 shrink-0">
            
            {/* The 4 Encoders */}
            <div className="flex justify-between px-6 pt-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0055ff] shadow-[inset_0_4px_6px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)]"></div>
                <span className="font-mono text-[8px] text-black/40 lowercase">t1</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00cc55] shadow-[inset_0_4px_6px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)]"></div>
                <span className="font-mono text-[8px] text-black/40 lowercase">t2</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#eeeeee] border border-gray-300 shadow-[inset_0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]"></div>
                <span className="font-mono text-[8px] text-black/40 lowercase">t3</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ff5500] shadow-[inset_0_4px_6px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)]"></div>
                <span className="font-mono text-[8px] text-black/40 lowercase">t4</span>
              </div>
            </div>

            {/* LCD Screen */}
            <div className="bg-[#ccff00] rounded-[16px] p-5 font-mono text-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] flex flex-col justify-between h-48 border border-black/5 relative overflow-hidden">
               <div className="flex justify-between items-start text-xs relative z-10">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-widest">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-black animate-pulse' : 'bg-black/20'}`}></div>
                    audio
                  </div>
                  <span className="font-bold">scr.{score.toString().padStart(4, '0')}</span>
               </div>

               <div className="text-xl sm:text-2xl font-bold lowercase tracking-tighter truncate mt-4 mb-auto relative z-10">
                  {tracks[currentTrackIndex].title}
               </div>

               {/* Simple Audio Spectral Bars */}
               <div className="flex items-end gap-[2px] h-12 w-full opacity-30 relative z-10 bottom-0">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-black transition-all duration-100 ease-out"
                      style={{ 
                        height: isPlaying ? `${10 + Math.random() * 90}%` : '4px',
                      }}
                    />
                  ))}
               </div>
            </div>

            {/* Tape Controls / Mechanical Keys */}
            <div className="mt-auto pt-4">
              <div className="flex justify-between text-[10px] font-mono lowercase text-black/40 px-2 mb-2">
                <span>vol</span>
                <span className="ml-[10px]">rev</span>
                <span className="ml-[14px]">fwd</span>
                <span>play</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <button 
                  id="btn-mute-toggle"
                  onClick={() => setIsMuted(!isMuted)} 
                  className="h-14 bg-[#f0f0f0] hover:bg-white text-black rounded-[14px] shadow-[0_4px_0_#dcdcdc] active:shadow-[0_0px_0_#dcdcdc] active:translate-y-1 transition-all flex items-center justify-center border border-black/5"
                >
                  {isMuted ? <VolumeX size={18} strokeWidth={2}/> : <Volume2 size={18} strokeWidth={2}/>}
                </button>
                <button 
                  id="btn-prev-track"
                  onClick={handlePrevTrack}
                  className="h-14 bg-[#f0f0f0] hover:bg-white text-black rounded-[14px] shadow-[0_4px_0_#dcdcdc] active:shadow-[0_0px_0_#dcdcdc] active:translate-y-1 transition-all flex items-center justify-center border border-black/5"
                >
                  <SkipBack size={18} strokeWidth={2}/>
                </button>
                <button 
                  id="btn-next-track"
                  onClick={handleNextTrack}
                  className="h-14 bg-[#f0f0f0] hover:bg-white text-black rounded-[14px] shadow-[0_4px_0_#dcdcdc] active:shadow-[0_0px_0_#dcdcdc] active:translate-y-1 transition-all flex items-center justify-center border border-black/5"
                >
                  <SkipForward size={18} strokeWidth={2}/>
                </button>
                <button 
                  id="btn-play-pause"
                  onClick={togglePlay}
                  className="h-14 bg-[#ff3300] hover:bg-[#ff4411] text-white rounded-[14px] shadow-[0_4px_0_#cc2200] active:shadow-[0_0px_0_#cc2200] active:translate-y-1 transition-all flex items-center justify-center border border-black/10"
                >
                  {isPlaying ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

