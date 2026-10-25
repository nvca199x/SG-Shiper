/**
 * Super Shipper 3D - Giao Hàng Thành Phố Mở
 * Advanced Customization · Diverse Mission System · Dynamic Weather Engine
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameCanvas } from './game/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { GarageModal } from './components/GarageModal';
import { MissionBoardModal } from './components/MissionBoardModal';
import { PauseModal } from './components/PauseModal';
import { MobileControls } from './components/MobileControls';
import { DeliverySystem } from './game/deliverySystem';
import { PhysicsEngine, InputState } from './game/physicsEngine';
import { sounds } from './audio/soundManager';
import { VEHICLE_CATALOG, WEATHER_CONDITIONS } from './game/constants';
import {
  GameState,
  WeatherType,
  VehicleConfig,
  VehicleUpgrades,
  VehicleCustomization,
  PlayerStats,
} from './types/game';

const STORAGE_KEY = 'super_shipper_save_v2';

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>('title');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [weatherCountdown, setWeatherCountdown] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(() => {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  });

  // Weather change alert toast
  const [weatherToast, setWeatherToast] = useState<{ title: string; desc: string; icon: string } | null>(null);

  // Player Stats with localStorage persistence
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_stats`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      money: 150000,
      completedDeliveries: 0,
      completedMissions: 0,
      rating: 5.0,
      totalKm: 0,
      totalTips: 0,
      reputationPoints: 50,
      driverTitle: 'Tài Xế Mới Vào Nghề',
    };
  });

  // Vehicles Catalog with Unlocked state
  const [vehicles, setVehicles] = useState<VehicleConfig[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_vehicles`);
      if (saved) {
        const parsed: VehicleConfig[] = JSON.parse(saved);
        return VEHICLE_CATALOG.map((catV) => {
          const found = parsed.find((p) => p.id === catV.id);
          return found ? { ...catV, unlocked: found.unlocked } : catV;
        });
      }
    } catch {
      // fallback
    }
    return VEHICLE_CATALOG;
  });

  // Selected Vehicle & Upgrades
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleConfig>(vehicles[0]);

  const [upgrades, setUpgrades] = useState<VehicleUpgrades>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_upgrades`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      engineLevel: 1,
      accelLevel: 1,
      handlingLevel: 1,
      nitroLevel: 1,
      cargoLevel: 1,
      customization: {
        primaryColor: vehicles[0].color,
        secondaryColor: '#1e293b',
        rimColor: '#e2e8f0',
        decal: 'none',
        headlight: 'xenon_white',
        underglow: 'none',
        windshield: 'sport_smoke',
        exhaust: 'stock',
        bumper: 'none',
        flag: 'vietnam_flag',
      },
    };
  });

  // Real-time HUD states
  const [speedKmH, setSpeedKmH] = useState<number>(0);
  const [nitroPercent, setNitroPercent] = useState<number>(100);
  const [shockLevel, setShockLevel] = useState<number>(0);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; z: number; heading: number }>({
    x: 0,
    z: 30,
    heading: 0,
  });

  // Delivery celebration banner
  const [celebration, setCelebration] = useState<{
    success: boolean;
    title: string;
    payout: number;
    tip: number;
    reputation?: number;
    failReason?: string;
  } | null>(null);

  // Core Simulation Systems
  const deliverySystemRef = useRef<DeliverySystem>(new DeliverySystem());
  const physicsEngineRef = useRef<PhysicsEngine>(new PhysicsEngine());

  // Input states
  const inputStateRef = useRef<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    nitro: false,
    horn: false,
  });

  // Save to localStorage when stats, upgrades, or vehicles change
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_stats`, JSON.stringify(stats));
      localStorage.setItem(`${STORAGE_KEY}_upgrades`, JSON.stringify(upgrades));
      localStorage.setItem(`${STORAGE_KEY}_vehicles`, JSON.stringify(vehicles));
    } catch {
      // Ignore storage errors
    }
  }, [stats, upgrades, vehicles]);

  // Sync Audio Mute
  useEffect(() => {
    sounds.setMuted(isMuted);
  }, [isMuted]);

  // Dynamic Weather Engine
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setWeatherCountdown((prev) => {
        if (prev <= 1) {
          const weatherOptions: WeatherType[] = [
            'sunny',
            'heatwave',
            'rain',
            'storm',
            'fog',
            'sunset',
            'neon_night',
          ];
          const pool = weatherOptions.filter((w) => w !== weather);
          const nextWeather = pool[Math.floor(Math.random() * pool.length)];
          setWeather(nextWeather);

          const info = WEATHER_CONDITIONS[nextWeather];
          setWeatherToast({
            title: `Thời tiết thay đổi: ${info.name}`,
            desc: info.description,
            icon: info.icon,
          });

          setTimeout(() => {
            setWeatherToast(null);
          }, 4500);

          return 75;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, weather]);

  // Robust Keyboard Event Handlers supporting both code and key (including Vietnamese Telex)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      // Forward (W / ArrowUp / Telex ư)
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup' || key === 'ư') {
        inputStateRef.current.forward = true;
      }
      // Backward (S / ArrowDown / Telex s)
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        inputStateRef.current.backward = true;
      }
      // Left (A / ArrowLeft / Telex a)
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        inputStateRef.current.left = true;
      }
      // Right (D / ArrowRight / Telex d / Telex đ)
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright' || key === 'đ') {
        inputStateRef.current.right = true;
      }
      // Brake / Drift (Space)
      if (code === 'Space' || key === ' ' || key === 'space') {
        inputStateRef.current.brake = true;
        if (gameState === 'title') handleStartGame();
      }
      // Nitro (Shift)
      if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
        inputStateRef.current.nitro = true;
      }
      // Horn (H / C)
      if (code === 'KeyH' || code === 'KeyC' || key === 'h' || key === 'c') {
        inputStateRef.current.horn = true;
        sounds.playHorn();
      }

      // Shortcut Keys
      if (code === 'KeyG' || key === 'g') {
        if (gameState === 'playing') setGameState('garage');
        else if (gameState === 'garage') setGameState('playing');
      }

      if (code === 'KeyM' || key === 'm') {
        if (gameState === 'playing') setGameState('missions');
        else if (gameState === 'missions') setGameState('playing');
      }

      if (code === 'Escape' || key === 'escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused' || gameState === 'garage' || gameState === 'missions') {
          setGameState('playing');
        }
      }

      if ((code === 'Enter' || key === 'enter') && gameState === 'title') {
        handleStartGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup' || key === 'ư') {
        inputStateRef.current.forward = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        inputStateRef.current.backward = false;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        inputStateRef.current.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright' || key === 'đ') {
        inputStateRef.current.right = false;
      }
      if (code === 'Space' || key === ' ' || key === 'space') {
        inputStateRef.current.brake = false;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
        inputStateRef.current.nitro = false;
      }
      if (code === 'KeyH' || code === 'KeyC' || key === 'h' || key === 'c') {
        inputStateRef.current.horn = false;
      }
    };

    const handleBlur = () => {
      inputStateRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        brake: false,
        nitro: false,
        horn: false,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Start Game handler
  const handleStartGame = () => {
    sounds.startEngine();
    setGameState('playing');
    window.focus();

    if (deliverySystemRef.current.activeOrders.length === 0 && !deliverySystemRef.current.activeMission) {
      if (deliverySystemRef.current.availableOrders.length > 0) {
        deliverySystemRef.current.acceptOrder(
          deliverySystemRef.current.availableOrders[0].id,
          upgrades.cargoLevel
        );
      }
    }
  };

  // Speed and telemetry callback from Three.js render loop
  const handleSpeedUpdate = useCallback((kmh: number, nitroPct: number, shock: number) => {
    setSpeedKmH(kmh);
    setNitroPercent(nitroPct);
    setShockLevel(shock);
    setPlayerCoords({
      x: Math.round(physicsEngineRef.current.position.x),
      z: Math.round(physicsEngineRef.current.position.z),
      heading: physicsEngineRef.current.heading,
    });
  }, []);

  // Standard Delivery Event Callback
  const handleDeliveryEvent = useCallback(
    (event: 'pickup' | 'delivered', payout?: number, tip?: number) => {
      if (event === 'delivered' && payout) {
        const totalEarn = payout + (tip || 0);

        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#e11d48'],
        });

        setStats((prev) => {
          const nextRating = Math.min(5.0, Number((prev.rating * 0.95 + 5.0 * 0.05).toFixed(2)));
          return {
            ...prev,
            money: prev.money + totalEarn,
            completedDeliveries: prev.completedDeliveries + 1,
            totalTips: prev.totalTips + (tip || 0),
            rating: nextRating,
            totalKm: prev.totalKm + 1200,
            reputationPoints: prev.reputationPoints + 15,
          };
        });

        setCelebration({
          success: true,
          title: 'Giao hàng thành công xuất sắc!',
          payout,
          tip: tip || 0,
        });

        setTimeout(() => {
          setCelebration(null);
        }, 3600);
      }
    },
    []
  );

  // Structured Mission Result Callback
  const handleMissionResult = useCallback(
    (success: boolean, title: string, money: number, tip: number, rep: number, reason?: string) => {
      if (success) {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#a855f7', '#f59e0b', '#10b981', '#38bdf8'],
        });

        setStats((prev) => ({
          ...prev,
          money: prev.money + money + tip,
          completedMissions: prev.completedMissions + 1,
          totalTips: prev.totalTips + tip,
          reputationPoints: prev.reputationPoints + rep,
          totalKm: prev.totalKm + 2500,
        }));

        setCelebration({
          success: true,
          title: `HỢP ĐỒNG HOÀN THÀNH: ${title}`,
          payout: money,
          tip,
          reputation: rep,
        });
      } else {
        setCelebration({
          success: false,
          title: `HỢP ĐỒNG THẤT BẠI: ${title}`,
          payout: 0,
          tip: 0,
          failReason: reason || 'Nhiệm vụ thất bại!',
        });
      }

      setTimeout(() => {
        setCelebration(null);
      }, 4200);
    },
    []
  );

  // Crash event
  const handleCrash = useCallback(() => {}, []);

  // Weather Cycle manual toggle
  const handleToggleWeather = () => {
    const cycle: WeatherType[] = [
      'sunny',
      'heatwave',
      'rain',
      'storm',
      'fog',
      'sunset',
      'neon_night',
    ];
    const nextIdx = (cycle.indexOf(weather) + 1) % cycle.length;
    const nextW = cycle[nextIdx];
    setWeather(nextW);
    setWeatherCountdown(75);
    sounds.playClick();

    const info = WEATHER_CONDITIONS[nextW];
    setWeatherToast({
      title: info.name,
      desc: info.description,
      icon: info.icon,
    });
    setTimeout(() => setWeatherToast(null), 3500);
  };

  // Accept an order
  const handleAcceptOrder = () => {
    if (deliverySystemRef.current.availableOrders.length > 0) {
      deliverySystemRef.current.acceptOrder(
        deliverySystemRef.current.availableOrders[0].id,
        upgrades.cargoLevel
      );
    }
  };

  // Start structured mission
  const handleStartMission = (missionId: string) => {
    const ok = deliverySystemRef.current.startMission(missionId);
    if (ok) {
      const mission = deliverySystemRef.current.activeMission;
      if (mission?.weatherOverride) {
        setWeather(mission.weatherOverride);
        setWeatherCountdown(120);
      }
      setGameState('playing');
    }
  };

  // Cancel active mission
  const handleCancelActiveMission = () => {
    deliverySystemRef.current.cancelActiveMission();
    setCelebration({
      success: false,
      title: 'Đã hủy hợp đồng',
      payout: 0,
      tip: 0,
      failReason: 'Bạn đã chủ động hủy hợp đồng.',
    });
    setTimeout(() => setCelebration(null), 2500);
  };

  // Upgrades: purchase performance part
  const handleApplyUpgrade = (
    category: 'engine' | 'accel' | 'handling' | 'nitro' | 'cargo',
    nextLevel: number,
    cost: number
  ) => {
    if (stats.money < cost) return;

    setStats((prev) => ({
      ...prev,
      money: prev.money - cost,
    }));

    setUpgrades((prev) => ({
      ...prev,
      [`${category}Level`]: nextLevel,
    }));
  };

  // Upgrades: apply custom decal/paint/accessories
  const handleUpdateCustomization = (
    updates: Partial<VehicleCustomization>,
    cost: number
  ) => {
    if (cost > 0 && stats.money < cost) return;

    if (cost > 0) {
      setStats((prev) => ({
        ...prev,
        money: prev.money - cost,
      }));
    }

    setUpgrades((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        ...updates,
      },
    }));
  };

  // Vehicle purchase
  const handleBuyVehicle = (vehicle: VehicleConfig) => {
    if (stats.money < vehicle.price) return;

    setStats((prev) => ({
      ...prev,
      money: prev.money - vehicle.price,
    }));

    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicle.id ? { ...v, unlocked: true } : v))
    );

    setSelectedVehicle(vehicle);
    setUpgrades((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        primaryColor: vehicle.color,
      },
    }));
  };

  // Select vehicle
  const handleSelectVehicle = (vehicle: VehicleConfig) => {
    setSelectedVehicle(vehicle);
    setUpgrades((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        primaryColor: vehicle.color,
      },
    }));
  };

  // Reset player position if stuck
  const handleResetPosition = () => {
    physicsEngineRef.current.resetPosition(0, 30, 0);
    setGameState('playing');
  };

  return (
    <div
      tabIndex={0}
      onClick={() => window.focus()}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none outline-none"
    >
      {/* 1. 3D WebGL Canvas Viewport */}
      <GameCanvas
        gameState={gameState}
        vehicleConfig={selectedVehicle}
        vehicleUpgrades={upgrades}
        weather={weather}
        deliverySystem={deliverySystemRef.current}
        physicsEngine={physicsEngineRef.current}
        inputStateRef={inputStateRef}
        onSpeedUpdate={handleSpeedUpdate}
        onDeliveryEvent={handleDeliveryEvent}
        onMissionResult={handleMissionResult}
        onCrash={handleCrash}
      />

      {/* 2. Weather Change Notification Toast */}
      {weatherToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-25 bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 pointer-events-none max-w-md w-full">
          <span className="text-3xl">{weatherToast.icon}</span>
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
              {weatherToast.title}
            </div>
            <div className="text-xs text-slate-300">{weatherToast.desc}</div>
          </div>
        </div>
      )}

      {/* 3. Order & Mission Celebration Banner Toast */}
      {celebration && (
        <div
          className={`absolute top-20 left-1/2 -translate-x-1/2 z-25 bg-slate-900/95 border-2 rounded-3xl p-4 sm:p-5 shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in-90 duration-200 pointer-events-none max-w-lg w-full ${
            celebration.success ? 'border-emerald-500' : 'border-red-500'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl border ${
              celebration.success
                ? 'bg-emerald-500/20 border-emerald-500/40'
                : 'bg-red-500/20 border-red-500/40'
            }`}
          >
            {celebration.success ? '🎉' : '❌'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase ${
                  celebration.success ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {celebration.title}
              </span>
              {celebration.success && <span className="text-xs text-amber-400 font-bold">★★★★★</span>}
            </div>

            {celebration.success ? (
              <>
                <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono tabular-nums">
                  +{(celebration.payout + celebration.tip).toLocaleString('vi-VN')}{' '}
                  <span className="text-sm font-bold text-emerald-400">VNĐ</span>
                </div>
                <div className="text-xs text-amber-300 font-medium flex items-center gap-2">
                  {celebration.tip > 0 && (
                    <span>+{celebration.tip.toLocaleString('vi-VN')} đ thưởng tốc độ</span>
                  )}
                  {celebration.reputation && (
                    <span className="text-purple-300 font-bold">
                      +{celebration.reputation} Uy Tín
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-red-300 font-medium mt-1">
                {celebration.failReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. In-Game HUD (Only during Playing) */}
      {gameState === 'playing' && (
        <>
          <HUD
            stats={stats}
            speedKmH={speedKmH}
            nitroPercent={nitroPercent}
            shockLevel={shockLevel}
            activeOrders={deliverySystemRef.current.activeOrders}
            activeMission={deliverySystemRef.current.activeMission}
            availableCount={deliverySystemRef.current.availableOrders.length}
            weather={weather}
            weatherTimeRemaining={weatherCountdown}
            vehicleConfig={selectedVehicle}
            playerPos={playerCoords}
            onOpenGarage={() => setGameState('garage')}
            onOpenMissions={() => setGameState('missions')}
            onOpenPause={() => setGameState('paused')}
            onToggleWeather={handleToggleWeather}
            onAcceptFirstOrder={handleAcceptOrder}
            onHorn={() => {
              inputStateRef.current.horn = true;
              sounds.playHorn();
              setTimeout(() => {
                inputStateRef.current.horn = false;
              }, 250);
            }}
            showMobileControls={showMobileControls}
            onToggleMobileControls={() => setShowMobileControls(!showMobileControls)}
          />

          {showMobileControls && <MobileControls inputStateRef={inputStateRef} />}
        </>
      )}

      {/* 5. Full-Viewport Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenGarage={() => setGameState('garage')}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={handleSelectVehicle}
          weather={weather}
          onSelectWeather={(w) => {
            setWeather(w);
            setWeatherCountdown(75);
          }}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
        />
      )}

      {/* 6. Garage / Advanced Tuning Modal */}
      {gameState === 'garage' && (
        <GarageModal
          currentVehicle={selectedVehicle}
          upgrades={upgrades}
          stats={stats}
          onSelectVehicle={handleSelectVehicle}
          onBuyVehicle={handleBuyVehicle}
          onApplyUpgrade={handleApplyUpgrade}
          onUpdateCustomization={handleUpdateCustomization}
          onClose={() => setGameState('playing')}
        />
      )}

      {/* 7. Mission Board Modal */}
      {gameState === 'missions' && (
        <MissionBoardModal
          missions={deliverySystemRef.current.availableMissions}
          activeMission={deliverySystemRef.current.activeMission}
          stats={stats}
          onAcceptMission={handleStartMission}
          onCancelActiveMission={handleCancelActiveMission}
          onClose={() => setGameState('playing')}
        />
      )}

      {/* 8. Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          stats={stats}
          isMuted={isMuted}
          onResume={() => setGameState('playing')}
          onResetPosition={handleResetPosition}
          onOpenGarage={() => setGameState('garage')}
          onToggleMute={() => setIsMuted(!isMuted)}
          onExitToTitle={() => {
            sounds.stopEngine();
            setGameState('title');
          }}
        />
      )}
    </div>
  );
}
