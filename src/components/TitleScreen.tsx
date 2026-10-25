import React from 'react';
import { VehicleConfig, WeatherType } from '../types/game';
import { VEHICLE_CATALOG } from '../game/constants';
import { sounds } from '../audio/soundManager';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenGarage: () => void;
  selectedVehicle: VehicleConfig;
  onSelectVehicle: (v: VehicleConfig) => void;
  weather: WeatherType;
  onSelectWeather: (w: WeatherType) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenGarage,
  selectedVehicle,
  onSelectVehicle,
  weather,
  onSelectWeather,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 pointer-events-auto bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70 select-none">
      {/* Top Bar: Weather Selector & Mute */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-2xl p-1.5 backdrop-blur-none shadow-lg">
          {(['sunny', 'heatwave', 'rain', 'storm', 'fog', 'sunset', 'neon_night'] as WeatherType[]).map((w) => {
            const labels: Record<WeatherType, string> = {
              sunny: '☀️ Nắng Đẹp',
              heatwave: '🔥 Nắng Nóng',
              rain: '🌧️ Mưa Rơi',
              storm: '⛈️ Dông Bão',
              fog: '🌫️ Sương Mù',
              sunset: '🌇 Hoàng Hôn',
              neon_night: '🌙 Đêm Neon',
            };
            return (
              <button
                key={w}
                onClick={() => {
                  sounds.playClick();
                  onSelectWeather(w);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  weather === w
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {labels[w]}
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggleMute}
          className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
        >
          <span>{isMuted ? '🔇 Đã Tắt Âm' : '🔊 Âm Thanh Bật'}</span>
        </button>
      </div>

      {/* Hero Center Title Lockup */}
      <div className="max-w-2xl mx-auto text-center space-y-4 my-auto">
        {/* Bespoke SVG Title Lockup */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
            <span>🛵 Siêu Phẩm Mô Phỏng Giao Hàng 3D</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 tracking-tight leading-none drop-shadow-2xl">
            SUPER SHIPPER 3D
          </h1>

          <p className="text-base sm:text-xl font-bold text-slate-300 mt-2 max-w-lg">
            Khám phá thành phố mở rộng lớn, nhận đơn hỏa tốc, drift né xe cộ & nâng cấp xe giao hàng xé gió!
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            onClick={() => {
              sounds.playClick();
              onStartGame();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg shadow-2xl hover:shadow-emerald-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5"
          >
            <span>BẮT ĐẦU GIAO HÀNG</span>
            <span className="bg-emerald-700/60 text-xs px-2 py-0.5 rounded font-mono font-normal">Space / Enter</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenGarage();
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500/80 text-amber-300 font-black text-base shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🛠️ Xưởng Độ Xe & Garage</span>
            <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded font-mono">[G]</span>
          </button>
        </div>

        {/* Vehicle Quick Switcher Carousel */}
        <div className="pt-5 flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {VEHICLE_CATALOG.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                sounds.playClick();
                onSelectVehicle(v);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedVehicle.id === v.id
                  ? 'bg-slate-800 border-amber-500 text-amber-300 ring-2 ring-amber-500/40 shadow-lg'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{v.type === 'cargo' ? '🚚' : '🛵'}</span>
              <span>{v.vietnameseName}</span>
              {!v.unlocked && <span className="text-[10px] text-amber-400">🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Flat Control Hint Line per Game Guidelines */}
      <div className="text-center text-xs font-mono text-slate-400">
        WASD Di Chuyển · Space Phanh/Drift · Shift Nitro Tăng Tốc · H Bấm Còi · Esc Tạm Dừng
      </div>
    </div>
  );
};
