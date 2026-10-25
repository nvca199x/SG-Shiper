export type GameState = 'title' | 'playing' | 'garage' | 'missions' | 'paused' | 'order_summary';

export type WeatherType = 'sunny' | 'heatwave' | 'rain' | 'storm' | 'fog' | 'sunset' | 'neon_night';

export type DistrictType = 'downtown' | 'food_market' | 'residential' | 'industrial' | 'park' | 'highway';

// Advanced Vehicle Customization Specs
export type DecalType = 'none' | 'racing_stripes' | 'dragon_flames' | 'delivery_fast' | 'cyber_circuit' | 'carbon_fiber';

export type HeadlightType = 'halogen_yellow' | 'xenon_white' | 'laser_cyan' | 'matrix_gold';

export type UnderglowType = 'none' | 'cyan' | 'magenta' | 'amber' | 'emerald' | 'purple';

export type WindshieldType = 'none' | 'sport_smoke' | 'touring_clear';

export type ExhaustType = 'stock' | 'carbon_race' | 'titanium_flame';

export type FrontBumperType = 'none' | 'crash_cage' | 'heavy_bullbar';

export type FlagType = 'none' | 'vietnam_flag' | 'shipper_vip' | 'checkered';

export interface VehicleCustomization {
  primaryColor: string;
  secondaryColor: string;
  rimColor: string;
  decal: DecalType;
  headlight: HeadlightType;
  underglow: UnderglowType;
  windshield: WindshieldType;
  exhaust: ExhaustType;
  bumper: FrontBumperType;
  flag: FlagType;
}

export interface VehicleConfig {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  type: 'scooter' | 'underbone' | 'sport' | 'electric' | 'cargo' | 'car';
  price: number;
  unlocked: boolean;
  baseSpeed: number; // km/h
  baseAccel: number; // m/s^2
  baseBrake: number;
  baseHandling: number;
  baseMaxCapacity: number; // number of simultaneous parcels
  baseNitroMax: number;
  color: string;
  boxColor: string;
  scale: [number, number, number];
}

export interface VehicleUpgrades {
  engineLevel: number; // 1 to 5: Top speed
  accelLevel: number; // 1 to 5: Acceleration
  handlingLevel: number; // 1 to 5: Cornering grip and brake
  nitroLevel: number; // 0 to 5: Nitro tank size and refill rate
  cargoLevel: number; // 1 to 4: Max active delivery slots
  customization: VehicleCustomization;
}

export interface UpgradeCost {
  level: number;
  cost: number;
  name: string;
  statBonus: string;
}

export interface Landmark {
  id: string;
  name: string;
  district: DistrictType;
  position: [number, number, number]; // [x, y, z]
  type: 'restaurant' | 'residence' | 'office' | 'market' | 'depot';
  color: string;
  icon: string;
}

// Mission and Contract System
export type MissionCategory = 'rush_delivery' | 'fragile_cargo' | 'skill_circuit' | 'storm_courier' | 'multi_stop';

export interface MissionCheckpoint {
  id: string;
  name: string;
  position: [number, number, number];
  isCompleted: boolean;
}

export interface DeliveryMission {
  id: string;
  title: string;
  category: MissionCategory;
  categoryLabel: string;
  badge: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  rewardMoney: number;
  bonusTip: number;
  reputationPoints: number;
  timeLimit: number;
  remainingTime: number;
  // Fragile mechanics
  isFragile: boolean;
  cargoIntegrity: number; // 100% to 0% (if 0%, mission fails)
  maxAllowedShock: number; // threshold of g-force or collision
  // Route Checkpoints
  checkpoints: MissionCheckpoint[];
  currentCheckpointIdx: number;
  // Conditions
  weatherOverride?: WeatherType;
  status: 'available' | 'in_progress' | 'completed' | 'failed';
  failureReason?: string;
}

export interface DeliveryOrder {
  id: string;
  title: string;
  category: 'food' | 'milktea' | 'express' | 'fragile' | 'hot_soup';
  customerName: string;
  restaurantName: string;
  pickupPos: [number, number, number];
  dropoffPos: [number, number, number];
  baseReward: number; // VNĐ
  tipReward: number; // VNĐ if delivered fast
  totalDistance: number; // meters
  timeLimit: number; // seconds
  remainingTime: number; // seconds
  freshness: number; // 100% decaying or damaged on crashes
  isFragile: boolean;
  pickedUp: boolean;
  delivered: boolean;
  status: 'available' | 'in_transit' | 'completed' | 'failed';
}

export interface PlayerStats {
  money: number;
  completedDeliveries: number;
  completedMissions: number;
  rating: number; // e.g. 4.95
  totalKm: number;
  totalTips: number;
  reputationPoints: number;
  driverTitle: string;
}

export interface TrafficCar {
  id: string;
  meshIndex: number;
  x: number;
  z: number;
  speed: number;
  targetSpeed: number;
  angle: number;
  color: string;
  direction: 'north' | 'south' | 'east' | 'west';
  roadIndex: number;
  laneOffset: number;
}

export interface WeatherConditionInfo {
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  frictionMultiplier: number; // 1.0 normal, 0.6 rain, 0.45 storm
  brakeMultiplier: number;
  fogDensity: number;
  lightIntensity: number;
  spoilageRateMultiplier: number;
  tipBonusMultiplier: number;
}
