import React from 'react';
import { InputState } from '../game/physicsEngine';

interface MobileControlsProps {
  inputStateRef: React.MutableRefObject<InputState>;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputStateRef }) => {
  const handleTouch = (key: keyof InputState, active: boolean) => {
    inputStateRef.current[key] = active;
  };

  return (
    <div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-15 pointer-events-none flex justify-between px-4 sm:px-10 select-none">
      {/* Steering Buttons (Left) */}
      <div className="flex gap-3 pointer-events-auto items-center">
        <button
          onPointerDown={() => handleTouch('left', true)}
          onPointerUp={() => handleTouch('left', false)}
          onPointerLeave={() => handleTouch('left', false)}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/80 active:bg-amber-500 border-2 border-slate-600 active:border-amber-400 text-white active:text-slate-950 font-black text-2xl flex items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer touch-none"
        >
          ◀
        </button>
        <button
          onPointerDown={() => handleTouch('right', true)}
          onPointerUp={() => handleTouch('right', false)}
          onPointerLeave={() => handleTouch('right', false)}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/80 active:bg-amber-500 border-2 border-slate-600 active:border-amber-400 text-white active:text-slate-950 font-black text-2xl flex items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer touch-none"
        >
          ▶
        </button>
      </div>

      {/* Throttle, Brake & Nitro Buttons (Right) */}
      <div className="flex items-end gap-2 sm:gap-3 pointer-events-auto">
        {/* Nitro & Drift column */}
        <div className="flex flex-col gap-2">
          <button
            onPointerDown={() => handleTouch('nitro', true)}
            onPointerUp={() => handleTouch('nitro', false)}
            onPointerLeave={() => handleTouch('nitro', false)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/80 active:bg-cyan-400 border-2 border-cyan-500 text-cyan-300 active:text-slate-950 font-black text-xs flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer touch-none"
          >
            <span>🚀</span>
            <span className="text-[9px]">NITRO</span>
          </button>

          <button
            onPointerDown={() => handleTouch('brake', true)}
            onPointerUp={() => handleTouch('brake', false)}
            onPointerLeave={() => handleTouch('brake', false)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-950/80 active:bg-rose-500 border-2 border-rose-500 text-rose-300 active:text-white font-black text-xs flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer touch-none"
          >
            <span>🛑</span>
            <span className="text-[9px]">DRIFT</span>
          </button>
        </div>

        {/* Forward & Reverse */}
        <div className="flex flex-col gap-2">
          <button
            onPointerDown={() => handleTouch('forward', true)}
            onPointerUp={() => handleTouch('forward', false)}
            onPointerLeave={() => handleTouch('forward', false)}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-600 active:bg-emerald-400 border-2 border-emerald-400 text-white active:text-slate-950 font-black text-xl flex flex-col items-center justify-center shadow-2xl active:scale-95 cursor-pointer touch-none"
          >
            <span>▲</span>
            <span className="text-[9px] font-bold">GA TIẾN</span>
          </button>

          <button
            onPointerDown={() => handleTouch('backward', true)}
            onPointerUp={() => handleTouch('backward', false)}
            onPointerLeave={() => handleTouch('backward', false)}
            className="w-16 h-14 sm:w-18 sm:h-14 rounded-2xl bg-slate-900/80 active:bg-slate-700 border-2 border-slate-600 text-slate-200 font-black text-sm flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer touch-none"
          >
            <span>▼</span>
            <span className="text-[9px] font-bold">LÙI/THẮNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
