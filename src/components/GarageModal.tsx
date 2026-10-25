import React, { useState } from 'react';
import {
  VehicleConfig,
  VehicleUpgrades,
  PlayerStats,
  VehicleCustomization,
  DecalType,
  HeadlightType,
  UnderglowType,
  WindshieldType,
  ExhaustType,
  FrontBumperType,
  FlagType,
} from '../types/game';
import {
  VEHICLE_CATALOG,
  UPGRADE_TIERS,
  COLOR_OPTIONS,
  RIM_COLOR_OPTIONS,
  DECAL_OPTIONS,
  HEADLIGHT_OPTIONS,
  UNDERGLOW_OPTIONS,
  WINDSHIELD_OPTIONS,
  EXHAUST_OPTIONS,
  BUMPER_OPTIONS,
  FLAG_OPTIONS,
} from '../game/constants';
import { sounds } from '../audio/soundManager';

interface GarageModalProps {
  currentVehicle: VehicleConfig;
  upgrades: VehicleUpgrades;
  stats: PlayerStats;
  onSelectVehicle: (v: VehicleConfig) => void;
  onBuyVehicle: (v: VehicleConfig) => void;
  onApplyUpgrade: (category: 'engine' | 'accel' | 'handling' | 'nitro' | 'cargo', nextLevel: number, cost: number) => void;
  onUpdateCustomization: (updates: Partial<VehicleCustomization>, cost: number) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  currentVehicle,
  upgrades,
  stats,
  onSelectVehicle,
  onBuyVehicle,
  onApplyUpgrade,
  onUpdateCustomization,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tuning' | 'paint' | 'decals' | 'lights' | 'exterior' | 'vehicles'>('tuning');

  const custom = upgrades.customization;
  const engineBonusKm = [0, 0, 10, 22, 38, 55][upgrades.engineLevel] || 0;
  const currentTopSpeed = currentVehicle.baseSpeed + engineBonusKm;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-none pointer-events-auto select-none">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md">
              🛠️
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                XƯỞNG ĐỘ XE & TÙY CHỈNH CAO CẤP
              </h2>
              <p className="text-xs text-slate-400">
                Độ máy, dán tem xe, gắn đèn LED gầm, pô độ titan và cản chống va đập
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl px-3.5 py-1.5 text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Ví Tiền Shipper</span>
              <span className="text-base sm:text-lg font-black text-emerald-300 font-mono tabular-nums">
                {stats.money.toLocaleString('vi-VN')} đ
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('tuning');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tuning' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Động Cơ & Hiệu Năng
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('paint');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'paint' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎨 Màu Sơn & Mâm Xe
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('decals');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'decals' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🏁 Đề Can & Tem Đua
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('lights');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lights' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            💡 Đèn Pha & Led Gầm
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('exterior');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'exterior' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ Cản Xe, Pô & Phụ Kiện
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('vehicles');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vehicles' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛵 Mua Xe Mới
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: TUNING */}
          {activeTab === 'tuning' && (
            <div className="space-y-6">
              {/* Specs Summary */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Tốc Độ Tối Đa</span>
                  <span className="text-xl font-black text-amber-400 font-mono tabular-nums">{currentTopSpeed} km/h</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Sức Chở Thùng Hàng</span>
                  <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
                    {upgrades.cargoLevel} Đơn Cùng Lúc
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Bình Nitro N2O</span>
                  <span className="text-xl font-black text-cyan-400 font-mono tabular-nums">
                    {upgrades.nitroLevel === 0 ? 'Chưa Lắp' : `Cấp ${upgrades.nitroLevel}`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Độ Bám & Thắng Đĩa</span>
                  <span className="text-xl font-black text-rose-400 font-mono tabular-nums">
                    Cấp {upgrades.handlingLevel}/5
                  </span>
                </div>
              </div>

              {/* Upgrade Tiers List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Động cơ */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-200">🔥 Động Cơ & Tốc Độ</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">Cấp {upgrades.engineLevel}/5</span>
                    </div>
                    <p className="text-xs text-slate-400">{UPGRADE_TIERS.engine[upgrades.engineLevel - 1]?.statBonus}</p>
                  </div>

                  <div className="pt-3">
                    {upgrades.engineLevel < 5 ? (
                      (() => {
                        const nextTier = UPGRADE_TIERS.engine[upgrades.engineLevel];
                        const canAfford = stats.money >= nextTier.cost;
                        return (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              sounds.playUpgrade();
                              onApplyUpgrade('engine', upgrades.engineLevel + 1, nextTier.cost);
                            }}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              canAfford ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>Lên Cấp {upgrades.engineLevel + 1}: {nextTier.statBonus}</span>
                            <span className="font-mono">{nextTier.cost.toLocaleString('vi-VN')} đ</span>
                          </button>
                        );
                      })()
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                        ✓ ĐÃ NÂNG CẤP TỐI ĐA (MAX)
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Gia tốc */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-200">⚡ Gia Tốc & Côn Nồi</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">Cấp {upgrades.accelLevel}/5</span>
                    </div>
                    <p className="text-xs text-slate-400">{UPGRADE_TIERS.accel[upgrades.accelLevel - 1]?.statBonus}</p>
                  </div>

                  <div className="pt-3">
                    {upgrades.accelLevel < 5 ? (
                      (() => {
                        const nextTier = UPGRADE_TIERS.accel[upgrades.accelLevel];
                        const canAfford = stats.money >= nextTier.cost;
                        return (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              sounds.playUpgrade();
                              onApplyUpgrade('accel', upgrades.accelLevel + 1, nextTier.cost);
                            }}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              canAfford ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>Lên Cấp {upgrades.accelLevel + 1}: {nextTier.statBonus}</span>
                            <span className="font-mono">{nextTier.cost.toLocaleString('vi-VN')} đ</span>
                          </button>
                        );
                      })()
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                        ✓ ĐÃ NÂNG CẤP TỐI ĐA (MAX)
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Phanh */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-200">🛑 Phanh ABS & Bám Cua Drift</span>
                      <span className="text-xs font-mono text-rose-400 font-bold">Cấp {upgrades.handlingLevel}/5</span>
                    </div>
                    <p className="text-xs text-slate-400">{UPGRADE_TIERS.handling[upgrades.handlingLevel - 1]?.statBonus}</p>
                  </div>

                  <div className="pt-3">
                    {upgrades.handlingLevel < 5 ? (
                      (() => {
                        const nextTier = UPGRADE_TIERS.handling[upgrades.handlingLevel];
                        const canAfford = stats.money >= nextTier.cost;
                        return (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              sounds.playUpgrade();
                              onApplyUpgrade('handling', upgrades.handlingLevel + 1, nextTier.cost);
                            }}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              canAfford ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-md' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>Lên Cấp {upgrades.handlingLevel + 1}: {nextTier.statBonus}</span>
                            <span className="font-mono">{nextTier.cost.toLocaleString('vi-VN')} đ</span>
                          </button>
                        );
                      })()
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                        ✓ ĐÃ NÂNG CẤP TỐI ĐA (MAX)
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Nitro */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-200">🚀 Bình Phun Nitro N2O</span>
                      <span className="text-xs font-mono text-blue-400 font-bold">Cấp {upgrades.nitroLevel}/4</span>
                    </div>
                    <p className="text-xs text-slate-400">{UPGRADE_TIERS.nitro[upgrades.nitroLevel]?.statBonus}</p>
                  </div>

                  <div className="pt-3">
                    {upgrades.nitroLevel < 4 ? (
                      (() => {
                        const nextTier = UPGRADE_TIERS.nitro[upgrades.nitroLevel + 1];
                        const canAfford = stats.money >= nextTier.cost;
                        return (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              sounds.playUpgrade();
                              onApplyUpgrade('nitro', upgrades.nitroLevel + 1, nextTier.cost);
                            }}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              canAfford ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-md' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>Mở Cấp {upgrades.nitroLevel + 1}: {nextTier.statBonus}</span>
                            <span className="font-mono">{nextTier.cost.toLocaleString('vi-VN')} đ</span>
                          </button>
                        );
                      })()
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                        ✓ ĐÃ NÂNG CẤP TỐI ĐA (MAX)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAINT & RIMS */}
          {activeTab === 'paint' && (
            <div className="space-y-6">
              {/* Primary Color */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">1. Màu Sơn Thân Xe Chính</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = custom.primaryColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={() => {
                          sounds.playClick();
                          onUpdateCustomization({ primaryColor: c.hex }, 0);
                        }}
                        className={`p-2.5 rounded-2xl bg-slate-950/70 border-2 transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs font-bold text-slate-200 truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Accent Color */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">2. Màu Phụ Dàn Áo & Áo Khoác Shipper</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = custom.secondaryColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={`sec_${c.hex}`}
                        onClick={() => {
                          sounds.playClick();
                          onUpdateCustomization({ secondaryColor: c.hex }, 0);
                        }}
                        className={`p-2.5 rounded-2xl bg-slate-950/70 border-2 transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs font-bold text-slate-200 truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rim / Wheel Colors */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">3. Màu Mâm Bánh Xe (Rims)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {RIM_COLOR_OPTIONS.map((r) => {
                    const isSelected = custom.rimColor.toLowerCase() === r.hex.toLowerCase();
                    return (
                      <button
                        key={r.hex}
                        onClick={() => {
                          sounds.playClick();
                          onUpdateCustomization({ rimColor: r.hex }, 0);
                        }}
                        className={`p-2.5 rounded-2xl bg-slate-950/70 border-2 transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: r.hex }} />
                        <span className="text-xs font-bold text-slate-200 truncate">{r.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DECALS & LIVERIES */}
          {activeTab === 'decals' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">Dán Đề Can & Tem Đua Thể Thao</h3>
                <p className="text-xs text-slate-400">Tạo phong cách khác biệt trên từng con phố với tem xe độc quyền</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {DECAL_OPTIONS.map((d) => {
                  const isSelected = custom.decal === d.id;
                  const canBuy = stats.money >= d.price;

                  return (
                    <div
                      key={d.id}
                      className={`p-4 rounded-2xl bg-slate-950/70 border-2 flex flex-col justify-between transition-all ${
                        isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{d.icon}</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {d.price === 0 ? 'Miễn Phí' : `${d.price.toLocaleString('vi-VN')} đ`}
                        </span>
                      </div>

                      <div className="my-2">
                        <div className="font-bold text-sm text-slate-200">{d.name}</div>
                      </div>

                      <button
                        disabled={isSelected || !canBuy}
                        onClick={() => {
                          sounds.playUpgrade();
                          onUpdateCustomization({ decal: d.id as DecalType }, d.price);
                        }}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : canBuy
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? '✓ Đang Dán' : 'Dán Tem Này'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LIGHTS & UNDERGLOW */}
          {activeTab === 'lights' && (
            <div className="space-y-6">
              {/* Headlights */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">1. Đèn Pha Chiếu Sáng (Headlights)</h3>
                <p className="text-xs text-slate-400 mb-3">Tăng tầm chiếu xa, phá tan sương mù và dông bão ban đêm</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HEADLIGHT_OPTIONS.map((hl) => {
                    const isSelected = custom.headlight === hl.id;
                    const canBuy = stats.money >= hl.price;

                    return (
                      <div
                        key={hl.id}
                        className={`p-3.5 rounded-2xl bg-slate-950/70 border-2 flex items-center justify-between ${
                          isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-white/20 shadow-lg flex items-center justify-center text-xs" style={{ backgroundColor: hl.hex }}>
                            💡
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{hl.name}</div>
                            <div className="text-[10px] text-cyan-400 font-mono">Tầm xa: {hl.beamRange}m</div>
                          </div>
                        </div>

                        <button
                          disabled={isSelected || !canBuy}
                          onClick={() => {
                            sounds.playUpgrade();
                            onUpdateCustomization({ headlight: hl.id as HeadlightType }, hl.price);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : canBuy
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isSelected ? '✓ Đang Dùng' : hl.price === 0 ? 'Chọn' : `${hl.price.toLocaleString('vi-VN')} đ`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Neon Underglow */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">2. Đèn Gầm Neon (Underglow Ground Effects)</h3>
                <p className="text-xs text-slate-400 mb-3">Tỏa sáng rực rỡ mặt đường khi chạy tốc độ cao ban đêm</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {UNDERGLOW_OPTIONS.map((ug) => {
                    const isSelected = custom.underglow === ug.id;
                    const canBuy = stats.money >= ug.price;

                    return (
                      <button
                        key={ug.id}
                        disabled={isSelected || !canBuy}
                        onClick={() => {
                          sounds.playUpgrade();
                          onUpdateCustomization({ underglow: ug.id as UnderglowType }, ug.price);
                        }}
                        className={`p-3 rounded-2xl bg-slate-950/70 border-2 transition-all text-left flex flex-col justify-between h-24 cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-5 h-5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: ug.hex }} />
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            {ug.price === 0 ? 'Tắt' : `${ug.price.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-200">{ug.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EXTERIOR ACCESSORIES */}
          {activeTab === 'exterior' && (
            <div className="space-y-6">
              {/* Exhaust Mufflers */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">1. Ống Pô Độ Thể Thao (Exhaust)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {EXHAUST_OPTIONS.map((ex) => {
                    const isSelected = custom.exhaust === ex.id;
                    const canBuy = stats.money >= ex.price;

                    return (
                      <button
                        key={ex.id}
                        disabled={isSelected || !canBuy}
                        onClick={() => {
                          sounds.playUpgrade();
                          onUpdateCustomization({ exhaust: ex.id as ExhaustType }, ex.price);
                        }}
                        className={`p-3.5 rounded-2xl bg-slate-950/70 border-2 text-left transition-all cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-200">{ex.name}</span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            {ex.price === 0 ? 'Zin' : `${ex.price.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isSelected ? '✓ Đang lắp' : 'Gắn pô này'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Windshields */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">2. Kính Chắn Gió Khí Động Học (Windshield)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {WINDSHIELD_OPTIONS.map((ws) => {
                    const isSelected = custom.windshield === ws.id;
                    const canBuy = stats.money >= ws.price;

                    return (
                      <button
                        key={ws.id}
                        disabled={isSelected || !canBuy}
                        onClick={() => {
                          sounds.playUpgrade();
                          onUpdateCustomization({ windshield: ws.id as WindshieldType }, ws.price);
                        }}
                        className={`p-3.5 rounded-2xl bg-slate-950/70 border-2 text-left transition-all cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-200">{ws.name}</span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            {ws.price === 0 ? 'Không' : `${ws.price.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isSelected ? '✓ Đang dùng' : 'Lắp kính'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Front Bumpers / Crash Cages */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">3. Cản Trước & Khung Chống Đổ (Crash Cage)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {BUMPER_OPTIONS.map((bm) => {
                    const isSelected = custom.bumper === bm.id;
                    const canBuy = stats.money >= bm.price;

                    return (
                      <button
                        key={bm.id}
                        disabled={isSelected || !canBuy}
                        onClick={() => {
                          sounds.playUpgrade();
                          onUpdateCustomization({ bumper: bm.id as FrontBumperType }, bm.price);
                        }}
                        className={`p-3.5 rounded-2xl bg-slate-950/70 border-2 text-left transition-all cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-200">{bm.name}</span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            {bm.price === 0 ? 'Không' : `${bm.price.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isSelected ? '✓ Đang lắp' : 'Lắp cản'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flags */}
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-1">4. Cờ Hiệu Shipper Đuôi Xe</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {FLAG_OPTIONS.map((fl) => {
                    const isSelected = custom.flag === fl.id;
                    const canBuy = stats.money >= fl.price;

                    return (
                      <button
                        key={fl.id}
                        disabled={isSelected || !canBuy}
                        onClick={() => {
                          sounds.playUpgrade();
                          onUpdateCustomization({ flag: fl.id as FlagType }, fl.price);
                        }}
                        className={`p-3.5 rounded-2xl bg-slate-950/70 border-2 text-left transition-all cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-200 mb-1">{fl.name}</div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {isSelected ? '✓ Đang treo' : fl.price === 0 ? 'Không treo' : `${fl.price.toLocaleString('vi-VN')} đ`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHOWROOM VEHICLES */}
          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VEHICLE_CATALOG.map((v) => {
                const isSelected = currentVehicle.id === v.id;
                const canBuy = stats.money >= v.price;

                return (
                  <div
                    key={v.id}
                    className={`bg-slate-950/70 border-2 rounded-2xl p-4 flex flex-col justify-between transition-all ${
                      isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs uppercase font-bold text-amber-400">
                            {v.type === 'car' ? '🚗 Ô Tô Giao Hàng' : v.type === 'cargo' ? '🚚 Bán Tải Shipper' : '🛵 Xe Máy Shipper'}
                          </div>
                          <h3 className="font-black text-lg text-slate-100">{v.vietnameseName}</h3>
                        </div>

                        {isSelected ? (
                          <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                            Đang Chạy
                          </span>
                        ) : v.unlocked ? (
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                            Đã Sở Hữu
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                            {v.price.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-2">{v.description}</p>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Tốc độ gốc</span>
                          <span className="font-bold text-slate-200">{v.baseSpeed} km/h</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Gia tốc</span>
                          <span className="font-bold text-slate-200">{v.baseAccel} m/s²</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Sức chứa</span>
                          <span className="font-bold text-slate-200">{v.baseMaxCapacity} đơn</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      {isSelected ? (
                        <div className="text-center text-xs font-bold text-amber-400 py-2">
                          ✓ Xe hiện tại
                        </div>
                      ) : v.unlocked ? (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onSelectVehicle(v);
                          }}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Lấy Xe Này Chạy
                        </button>
                      ) : (
                        <button
                          disabled={!canBuy}
                          onClick={() => {
                            sounds.playUpgrade();
                            onBuyVehicle(v);
                          }}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            canBuy
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>Mở Khóa Xe</span>
                          <span className="font-mono">({v.price.toLocaleString('vi-VN')} đ)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            Quay Lại Phố Giao Hàng [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
