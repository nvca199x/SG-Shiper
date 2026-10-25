import React, { useState } from 'react';
import { DeliveryMission, MissionCategory, PlayerStats } from '../types/game';
import { sounds } from '../audio/soundManager';

interface MissionBoardModalProps {
  missions: DeliveryMission[];
  activeMission: DeliveryMission | null;
  stats: PlayerStats;
  onAcceptMission: (missionId: string) => void;
  onCancelActiveMission: () => void;
  onClose: () => void;
}

export const MissionBoardModal: React.FC<MissionBoardModalProps> = ({
  missions,
  activeMission,
  stats,
  onAcceptMission,
  onCancelActiveMission,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả Hợp Đồng', icon: '📋' },
    { id: 'rush_delivery', label: 'Giao Đúng Giờ', icon: '⏱️' },
    { id: 'fragile_cargo', label: 'Hàng Dễ Vỡ', icon: '💎' },
    { id: 'skill_circuit', label: 'Tuyến Kỹ Năng Cao', icon: '🎯' },
    { id: 'storm_courier', label: 'Thử Thách Bão Táp', icon: '⛈️' },
    { id: 'multi_stop', label: 'Chuỗi VIP Đa Điểm', icon: '⭐' },
  ];

  const filteredMissions = selectedCategory === 'all'
    ? missions
    : missions.filter((m) => m.category === selectedCategory);

  // Reputation tier label
  const getDriverRank = (rep: number) => {
    if (rep >= 1000) return { title: 'Vua Shipper 3D Huyền Thoại', color: 'text-amber-400', level: 5 };
    if (rep >= 600) return { title: 'Bậc Thầy Giao Vận Thành Phố', color: 'text-rose-400', level: 4 };
    if (rep >= 350) return { title: 'Chiến Binh Đường Phố PRO', color: 'text-purple-400', level: 3 };
    if (rep >= 150) return { title: 'Shipper Chuyên Nghiệp', color: 'text-cyan-400', level: 2 };
    return { title: 'Tài Xế Mới Vào Nghề', color: 'text-emerald-400', level: 1 };
  };

  const driverRank = getDriverRank(stats.reputationPoints);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-none pointer-events-auto select-none">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-md">
              📜
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                BẢNG HỢP ĐỒNG & NHIỆM VỤ ĐẶC BIỆT
              </h2>
              <p className="text-xs text-slate-400">
                Thử thách giao hàng đúng giờ, hàng dễ vỡ, vượt bão và cung đường kỹ năng cao
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-3.5 py-1.5 text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cấp Bậc Tài Xế</span>
              <span className={`text-xs font-black font-mono ${driverRank.color}`}>
                ★ Cấp {driverRank.level} · {driverRank.title}
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(c.id);
              }}
              className={`pb-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === c.id
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Active Mission Banner (if any) */}
        {activeMission && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-purple-950/40 border-2 border-purple-500/70 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🎯</span>
              <div>
                <div className="text-xs font-bold text-purple-400 uppercase">HỢP ĐỒNG ĐANG TIẾN HÀNH</div>
                <div className="font-bold text-sm text-slate-100">{activeMission.title}</div>
                <div className="text-xs text-slate-400">
                  Checkpoint: {activeMission.currentCheckpointIdx + 1}/{activeMission.checkpoints.length} · Thời gian còn: {Math.ceil(activeMission.remainingTime)}s
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onCancelActiveMission();
              }}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 text-red-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy Hợp Đồng
            </button>
          </div>
        )}

        {/* Missions List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMissions.map((m) => {
              const isCurrent = activeMission?.id === m.id;
              const isDone = m.status === 'completed';

              return (
                <div
                  key={m.id}
                  className={`bg-slate-950/70 border-2 rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-purple-500 ring-2 ring-purple-500/30'
                      : isDone
                      ? 'border-emerald-500/50 opacity-80'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {m.badge}
                        </span>
                        {m.isFragile && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                            CẤM LÀM VỠ
                          </span>
                        )}
                        {m.weatherOverride && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            BÃO TÁP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-amber-400 text-xs font-bold">
                        {Array.from({ length: m.difficulty }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>

                    <h3 className="font-black text-base text-slate-100">{m.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>

                    {/* Checkpoints route preview */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">
                        Lộ trình ({m.checkpoints.length} chặng):
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-300">
                        {m.checkpoints.map((cp, cIdx) => (
                          <span key={cp.id} className="bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                            {cIdx + 1}. {cp.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rewards bar */}
                    <div className="bg-slate-900/80 rounded-xl p-2.5 flex items-center justify-between text-xs mt-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tiền cước hợp đồng</span>
                        <span className="font-bold text-emerald-400 font-mono tabular-nums">
                          +{m.rewardMoney.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Thưởng tốc độ</span>
                        <span className="font-bold text-amber-400 font-mono tabular-nums">
                          +{m.bonusTip.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Uy tín</span>
                        <span className="font-bold text-purple-400 font-mono tabular-nums">
                          +{m.reputationPoints} Điểm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Thời hạn</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          {m.timeLimit}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4">
                    {isCurrent ? (
                      <div className="text-center py-2 text-xs font-bold text-purple-400 bg-purple-950/40 rounded-xl border border-purple-500/30">
                        ✓ Đang thực hiện nhiệm vụ này
                      </div>
                    ) : isDone ? (
                      <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                        ✓ Đã hoàn thành hợp đồng
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playUpgrade();
                          onAcceptMission(m.id);
                        }}
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Nhận Hợp Đồng Này</span>
                        <span>➔</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Quay Lại Lái Xe [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
