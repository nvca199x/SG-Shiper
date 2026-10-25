import React from 'react';
import { PlayerStats } from '../types/game';
import { sounds } from '../audio/soundManager';

interface PauseModalProps {
  stats: PlayerStats;
  isMuted: boolean;
  onResume: () => void;
  onResetPosition: () => void;
  onOpenGarage: () => void;
  onToggleMute: () => void;
  onExitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  isMuted,
  onResume,
  onResetPosition,
  onOpenGarage,
  onToggleMute,
  onExitToTitle,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none pointer-events-auto select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-100">TẠM DỪNG</h2>
          <p className="text-xs text-slate-400">Nghỉ ngơi uống nước trước khi tiếp tục giao đơn</p>
        </div>

        {/* Driver Stats Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Đơn Đã Giao</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {stats.completedDeliveries} đơn
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Đánh Giá Trung Bình</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              ★ {stats.rating.toFixed(2)} / 5.0
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Tổng Tiền Đã Kiếm</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {stats.money.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Quãng Đường Đã Chạy</span>
            <span className="text-base font-bold text-cyan-400 font-mono">
              {(stats.totalKm / 1000).toFixed(1)} km
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Tiếp Tục Chạy Xe</span>
            <span className="bg-emerald-700/60 text-xs px-2 py-0.5 rounded font-mono font-normal">[Esc]</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenGarage();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
          >
            🛠️ Xưởng Độ Xe (Garage)
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onResetPosition();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            🔄 Kéo Xe Ra Giữa Đường (Nếu Kẹt)
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isMuted ? '🔇 Bật Âm Thanh' : '🔊 Tắt Âm Thanh'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onExitToTitle();
            }}
            className="w-full py-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-400 font-bold text-xs transition-colors cursor-pointer"
          >
            Về Màn Hình Chính
          </button>
        </div>

        {/* Keyboard instructions */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Phím điều khiển:</div>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
            <div>W / ↑ : Ga tiến</div>
            <div>S / ↓ : Lùi / Thắng</div>
            <div>A/D / ←→ : Bẻ lái</div>
            <div>Space : Phanh / Drift</div>
            <div>Shift : Nitro tăng tốc</div>
            <div>H : Bấm còi</div>
          </div>
        </div>
      </div>
    </div>
  );
};
