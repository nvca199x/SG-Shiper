import React from 'react';
import { DeliveryOrder, DeliveryMission, PlayerStats, WeatherType, VehicleConfig } from '../types/game';
import { WEATHER_CONDITIONS } from '../game/constants';

interface HUDProps {
  stats: PlayerStats;
  speedKmH: number;
  nitroPercent: number;
  shockLevel: number;
  activeOrders: DeliveryOrder[];
  activeMission: DeliveryMission | null;
  availableCount: number;
  weather: WeatherType;
  weatherTimeRemaining: number;
  vehicleConfig: VehicleConfig;
  playerPos: { x: number; z: number; heading: number };
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenPause: () => void;
  onToggleWeather: () => void;
  onAcceptFirstOrder: () => void;
  onHorn: () => void;
  showMobileControls: boolean;
  onToggleMobileControls: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  speedKmH,
  nitroPercent,
  shockLevel,
  activeOrders,
  activeMission,
  availableCount,
  weather,
  weatherTimeRemaining,
  vehicleConfig,
  playerPos,
  onOpenGarage,
  onOpenMissions,
  onOpenPause,
  onToggleWeather,
  onAcceptFirstOrder,
  onHorn,
  showMobileControls,
  onToggleMobileControls,
}) => {
  const currentOrder = activeOrders[0];
  const weatherInfo = WEATHER_CONDITIONS[weather];

  // Minimap radar scale
  const minimapCenter = 70;
  const mapScale = 0.24;

  // Real-time HUD GPS Direction & Distance calculation
  let targetCoord: [number, number] | null = null;
  let targetPlaceName = '';
  let targetThemeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  let isPickupPhase = false;

  if (activeMission && activeMission.checkpoints[activeMission.currentCheckpointIdx]) {
    const cp = activeMission.checkpoints[activeMission.currentCheckpointIdx];
    targetCoord = [cp.position[0], cp.position[2]];
    targetPlaceName = cp.name;
    targetThemeClass = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  } else if (currentOrder) {
    if (!currentOrder.pickedUp) {
      targetCoord = [currentOrder.pickupPos[0], currentOrder.pickupPos[2]];
      targetPlaceName = currentOrder.restaurantName;
      targetThemeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      isPickupPhase = true;
    } else {
      targetCoord = [currentOrder.dropoffPos[0], currentOrder.dropoffPos[2]];
      targetPlaceName = currentOrder.customerName;
      targetThemeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  }

  let distanceMeters = 0;
  let relativeAngleDeg = 0;

  if (targetCoord) {
    const dx = targetCoord[0] - playerPos.x;
    const dz = targetCoord[1] - playerPos.z;
    distanceMeters = Math.round(Math.hypot(dx, dz));

    // World angle from player to target (atan2(dx, dz))
    const worldAngle = Math.atan2(dx, dz);
    // Relative angle against player heading
    let diff = worldAngle - playerPos.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    relativeAngleDeg = Math.round((diff * 180) / Math.PI);
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden font-sans">
      {/* Top Header Cluster */}
      <div className="w-full flex items-start justify-between gap-3">
        {/* Top-Left: Shipper Driver Profile & Earnings */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl font-black text-white shadow-md">
              🛵
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white border border-slate-900">
              PRO
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Tài Xế Siêu Tốc</span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                ★ {stats.rating.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                {stats.reputationPoints} Uy Tín
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 tabular-nums">
              {stats.money.toLocaleString('vi-VN')} <span className="text-xs font-medium text-emerald-300">VNĐ</span>
            </div>
          </div>
        </div>

        {/* Top-Center: Active Mission OR Delivery Order Card */}
        {activeMission ? (
          <div className="pointer-events-auto bg-slate-900/95 border-2 border-purple-500/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl max-w-xs sm:max-w-sm w-full animate-in fade-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-purple-400 flex items-center gap-1">
                  <span>📜 HỢP ĐỒNG:</span>
                  <span className="truncate max-w-[140px]">{activeMission.title}</span>
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 tabular-nums">
                ⏱️ {Math.ceil(activeMission.remainingTime)}s
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-300 flex items-center justify-between">
                <span>
                  Chặng: <strong className="text-amber-400">{activeMission.currentCheckpointIdx + 1}/{activeMission.checkpoints.length}</strong> ({activeMission.checkpoints[activeMission.currentCheckpointIdx]?.name || 'Hoàn tất'})
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  +{(activeMission.rewardMoney + activeMission.bonusTip).toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Fragile Cargo Integrity or G-Force Shock Gauge */}
              {activeMission.isFragile && (
                <div className="pt-1 border-t border-slate-800/80">
                  <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-0.5">
                    <span className="text-red-400 font-bold">Độ nguyên vẹn bánh kem / gốm sứ</span>
                    <span className={activeMission.cargoIntegrity > 50 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {Math.round(activeMission.cargoIntegrity)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        activeMission.cargoIntegrity > 50 ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${activeMission.cargoIntegrity}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Real-time GPS Target Navigator */}
              {targetCoord && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-300 truncate max-w-[170px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Đích:</span>
                    <span className="font-semibold text-purple-200 truncate">{targetPlaceName}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-bold font-mono ${targetThemeClass} shadow-sm shrink-0`}>
                    <span className="tabular-nums">{distanceMeters}m</span>
                    <svg
                      className="w-3.5 h-3.5 fill-current transition-transform duration-100 ease-out"
                      viewBox="0 0 24 24"
                      style={{ transform: `rotate(${relativeAngleDeg}deg)` }}
                    >
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : currentOrder ? (
          <div className="pointer-events-auto bg-slate-900/95 border-2 border-amber-500/70 rounded-2xl p-3 sm:p-3.5 shadow-2xl max-w-xs sm:max-w-sm w-full animate-in fade-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                  {currentOrder.pickedUp ? '🟢 ĐANG GIAO ĐẾN KHÁCH' : '🟡 ĐẾN QUÁN LẤY HÀNG'}
                </span>
                {currentOrder.isFragile && (
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">
                    DỄ VỠ
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 tabular-nums">
                ⏱️ {Math.ceil(currentOrder.remainingTime)}s
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-100 truncate">
                {currentOrder.title}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>{currentOrder.pickedUp ? `Khách: ${currentOrder.customerName}` : `Quán: ${currentOrder.restaurantName}`}</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  +{(currentOrder.baseReward + currentOrder.tipReward).toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Freshness Bar */}
              <div className="pt-1.5">
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-0.5">
                  <span>Chất lượng món</span>
                  <span className={currentOrder.freshness > 60 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {Math.round(currentOrder.freshness)}% {currentOrder.freshness > 70 ? '🔥 Nóng giòn' : '⚠️ Đã nguội'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentOrder.freshness > 60 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${currentOrder.freshness}%` }}
                  />
                </div>
              </div>

              {/* Real-time GPS Target Navigator */}
              {targetCoord && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-300 truncate max-w-[170px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {isPickupPhase ? 'Lấy tại:' : 'Giao tại:'}
                    </span>
                    <span className="font-semibold text-slate-100 truncate">{targetPlaceName}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-bold font-mono ${targetThemeClass} shadow-sm shrink-0`}>
                    <span className="tabular-nums">{distanceMeters}m</span>
                    <svg
                      className="w-3.5 h-3.5 fill-current transition-transform duration-100 ease-out"
                      viewBox="0 0 24 24"
                      style={{ transform: `rotate(${relativeAngleDeg}deg)` }}
                    >
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-3">
            <div className="text-xs text-slate-300 font-medium">
              Có <span className="font-bold text-amber-400">{availableCount} đơn mới</span> đang chờ!
            </div>
            <button
              onClick={onAcceptFirstOrder}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Nhận Đơn</span>
              <span className="bg-emerald-700/60 text-[10px] px-1 py-0.2 rounded font-mono">Space/Enter</span>
            </button>
          </div>
        )}

        {/* Top-Right: Quick Toolbar (Missions, Garage, Weather, Pause) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Dynamic Weather Widget */}
          <button
            onClick={onToggleWeather}
            title={`${weatherInfo.name} - ${weatherInfo.description}`}
            className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-200 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>{weatherInfo.icon}</span>
            <span className="hidden sm:inline">{weatherInfo.name}</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-800 px-1 py-0.2 rounded">
              {Math.ceil(weatherTimeRemaining)}s
            </span>
          </button>

          {/* Mission Board Button */}
          <button
            onClick={onOpenMissions}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>📜 Hợp Đồng</span>
            <span className="hidden sm:inline bg-purple-800/60 text-[10px] px-1 py-0.2 rounded font-mono">[M]</span>
          </button>

          {/* Garage Button */}
          <button
            onClick={onOpenGarage}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>🛠️ Độ Xe</span>
            <span className="hidden sm:inline bg-orange-700/60 text-[10px] px-1 py-0.2 rounded font-mono">[G]</span>
          </button>

          <button
            onClick={onToggleMobileControls}
            title="Phím ảo điện thoại"
            className={`border rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors shadow-lg cursor-pointer ${
              showMobileControls
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200'
            }`}
          >
            📱 Phím Ảo
          </button>

          <button
            onClick={onOpenPause}
            className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-2 text-slate-300 transition-colors shadow-lg cursor-pointer"
            title="Tạm dừng / Cài đặt [Esc]"
          >
            ⏸️
          </button>
        </div>
      </div>

      {/* Bottom Dock: Minimap Radar, Speedometer, Shock Gauge, Horn, Nitro */}
      <div className="w-full flex items-end justify-between gap-3">
        {/* Bottom-Left: 2D Minimap Radar */}
        <div className="pointer-events-auto relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-slate-950/90 border-2 border-slate-700/90 shadow-2xl overflow-hidden p-1 flex items-center justify-center">
          {/* Radar background grid */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="absolute w-20 h-20 rounded-full border border-slate-700/60" />
          <div className="absolute w-28 h-28 rounded-full border border-slate-700/40" />

          {/* Compass labels */}
          <span className="absolute top-1 text-[9px] font-bold text-slate-400">B</span>
          <span className="absolute bottom-1 text-[9px] font-bold text-slate-400">N</span>
          <span className="absolute left-1.5 text-[9px] font-bold text-slate-400">T</span>
          <span className="absolute right-1.5 text-[9px] font-bold text-slate-400">Đ</span>

          {/* Player Blip with heading triangle */}
          <div
            className="absolute z-10 w-4 h-4 flex items-center justify-center"
            style={{
              transform: `rotate(${-playerPos.heading}rad)`,
            }}
          >
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-cyan-400" />
          </div>

          {/* Active Target Blip on radar (Mission or Delivery) */}
          {activeMission && activeMission.checkpoints[activeMission.currentCheckpointIdx] ? (
            <div
              className="absolute w-3.5 h-3.5 rounded-full shadow-lg bg-purple-400 ring-2 ring-purple-300 animate-bounce"
              style={{
                left: `${Math.max(8, Math.min(124, minimapCenter + (activeMission.checkpoints[activeMission.currentCheckpointIdx].position[0] - playerPos.x) * mapScale))}px`,
                top: `${Math.max(8, Math.min(124, minimapCenter + (activeMission.checkpoints[activeMission.currentCheckpointIdx].position[2] - playerPos.z) * mapScale))}px`,
              }}
            />
          ) : currentOrder ? (
            <div
              className={`absolute w-3.5 h-3.5 rounded-full shadow-lg animate-bounce ${
                currentOrder.pickedUp ? 'bg-emerald-400 ring-2 ring-emerald-300' : 'bg-amber-400 ring-2 ring-amber-300'
              }`}
              style={{
                left: `${Math.max(8, Math.min(124, minimapCenter + ((currentOrder.pickedUp ? currentOrder.dropoffPos[0] : currentOrder.pickupPos[0]) - playerPos.x) * mapScale))}px`,
                top: `${Math.max(8, Math.min(124, minimapCenter + ((currentOrder.pickedUp ? currentOrder.dropoffPos[2] : currentOrder.pickupPos[2]) - playerPos.z) * mapScale))}px`,
              }}
            />
          ) : null}

          <div className="absolute bottom-1 left-2 text-[9px] font-mono text-slate-400 font-semibold">
            GPS RADAR
          </div>
        </div>

        {/* Bottom-Right: Speedometer Cluster, G-Force Shock Meter, Nitro Bar */}
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col items-end gap-2">
          {/* Weather Grip Notice */}
          <div className="text-[10px] font-bold text-amber-300/90 flex items-center gap-1">
            <span>{weatherInfo.icon}</span>
            <span>Độ bám: {Math.round(weatherInfo.frictionMultiplier * 100)}%</span>
            {weatherInfo.frictionMultiplier < 0.7 && (
              <span className="text-red-400 bg-red-950/60 px-1 py-0.2 rounded border border-red-500/30">
                ĐƯỜNG TRƠN
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onHorn}
              className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 border border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-300 transition-colors cursor-pointer flex items-center gap-1 shadow"
            >
              📢 Còi [H]
            </button>

            <div className="text-right">
              <div className="text-2xl sm:text-4xl font-black text-slate-100 font-mono tracking-tight tabular-nums flex items-baseline justify-end gap-1">
                {speedKmH}
                <span className="text-xs sm:text-sm font-bold text-slate-400 font-sans">km/h</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 truncate max-w-[130px]">
                {vehicleConfig.vietnameseName}
              </div>
            </div>
          </div>

          {/* Fragile Cargo Shock Meter (Real-time G-Force) */}
          <div className="w-40 sm:w-52">
            <div className="flex justify-between items-center text-[10px] font-bold mb-0.5">
              <span className={shockLevel > 40 ? 'text-red-400 animate-pulse' : 'text-slate-400'}>
                ĐỘ RUNG LẮC XE (G-FORCE)
              </span>
              <span className="font-mono tabular-nums text-slate-300">{shockLevel}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-100 ${
                  shockLevel > 50 ? 'bg-red-500' : shockLevel > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, shockLevel)}%` }}
              />
            </div>
          </div>

          {/* Nitro Gauge Bar */}
          <div className="w-40 sm:w-52">
            <div className="flex justify-between items-center text-[10px] font-bold text-cyan-400 mb-0.5">
              <span>NITRO BOOST [Shift]</span>
              <span className="font-mono tabular-nums">{nitroPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-150 ${
                  nitroPercent > 20
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{ width: `${nitroPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
