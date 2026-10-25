import * as THREE from 'three';
import { VehicleConfig, VehicleUpgrades, WeatherConditionInfo } from '../types/game';
import { CollisionBox } from './cityGenerator';
import { sounds } from '../audio/soundManager';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  nitro: boolean;
  horn: boolean;
}

export class PhysicsEngine {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 30);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public speed: number = 0; // m/s
  public heading: number = 0; // radians around Y
  public steeringAngle: number = 0;
  public leanAngle: number = 0;
  public wheelRotation: number = 0;
  public nitroAmount: number = 100;
  public maxNitro: number = 100;
  public isNitroActive: boolean = false;
  public isDrifting: boolean = false;

  // Fragile Cargo Shock / G-Force meter
  public currentShock: number = 0; // instantaneous shock (0-100)
  private prevSpeed: number = 0;

  // Weather modifiers
  public frictionMultiplier: number = 1.0;
  public brakeMultiplier: number = 1.0;
  public vehicleType: string = 'scooter';

  private topSpeedMps: number = 20; // 72 km/h
  private accelPower: number = 14;
  private brakePower: number = 24;
  private handlingRate: number = 2.8;

  constructor() {
    this.resetPosition();
  }

  public resetPosition(x: number = 0, z: number = 30, heading: number = 0) {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.speed = 0;
    this.heading = heading;
    this.steeringAngle = 0;
    this.leanAngle = 0;
    this.currentShock = 0;
    this.prevSpeed = 0;
  }

  public setWeatherModifiers(weatherInfo: WeatherConditionInfo) {
    this.frictionMultiplier = weatherInfo.frictionMultiplier;
    this.brakeMultiplier = weatherInfo.brakeMultiplier;
  }

  public configureStats(config: VehicleConfig, upgrades: VehicleUpgrades) {
    this.vehicleType = config.type;
    // Top Speed calculation: base + upgrade bonus
    const engineBonusKm = [0, 0, 10, 22, 38, 55][upgrades.engineLevel] || 0;
    const totalKmH = config.baseSpeed + engineBonusKm;
    this.topSpeedMps = (totalKmH * 1000) / 3600;

    // Acceleration
    const accelBonus = 1 + (upgrades.accelLevel - 1) * 0.18;
    this.accelPower = config.baseAccel * accelBonus;

    // Handling & Brake
    const handlingBonus = 1 + (upgrades.handlingLevel - 1) * 0.16;
    this.brakePower = config.baseBrake * handlingBonus;
    this.handlingRate = config.baseHandling * handlingBonus;

    // Nitro
    this.maxNitro = upgrades.nitroLevel > 0 ? config.baseNitroMax + (upgrades.nitroLevel - 1) * 35 : 0;
    if (this.nitroAmount > this.maxNitro) {
      this.nitroAmount = this.maxNitro;
    }
  }

  public update(
    rawDt: number,
    input: InputState,
    collisionBoxes: CollisionBox[]
  ): { hasCrashed: boolean; crashSpeed: number; shockLevel: number } {
    const dt = Math.min(rawDt, 0.05); // Frame delta time clamp

    // 1. Steering & Drift (Modified by weather wetness)
    let targetSteer = 0;
    if (input.left) targetSteer += 1;
    if (input.right) targetSteer -= 1;

    // Wet roads make drifting happen much more easily!
    const driftSpeedThreshold = 4 * this.frictionMultiplier;
    this.isDrifting = (input.brake || this.frictionMultiplier < 0.7) && Math.abs(this.speed) > driftSpeedThreshold;
    const effectiveGrip = this.handlingRate * this.frictionMultiplier;
    const steerSpeed = this.isDrifting ? effectiveGrip * 1.6 : effectiveGrip;

    this.steeringAngle = THREE.MathUtils.damp(
      this.steeringAngle,
      targetSteer * (this.isDrifting ? 0.75 : 0.55),
      8,
      dt
    );

    // Turn vehicle heading proportionally to speed and steer
    if (Math.abs(this.speed) > 0.2) {
      const turnDir = this.speed >= 0 ? 1 : -1;
      this.heading += this.steeringAngle * steerSpeed * turnDir * dt;
    }

    // Leaning effect (motorcycles lean into turns, cars have subtle body roll)
    const isTwoWheeler = this.vehicleType !== 'cargo' && this.vehicleType !== 'car';
    const leanScale = isTwoWheeler ? 0.45 : 0.05;
    const targetLean = -this.steeringAngle * (Math.abs(this.speed) / this.topSpeedMps) * leanScale;
    this.leanAngle = THREE.MathUtils.damp(this.leanAngle, targetLean, 10, dt);

    // 2. Nitro Boost logic
    this.isNitroActive = input.nitro && this.nitroAmount > 5 && this.maxNitro > 0 && input.forward;
    if (this.isNitroActive) {
      this.nitroAmount = Math.max(0, this.nitroAmount - 32 * dt);
      sounds.playNitro();
    } else {
      // Passive recharge
      if (this.maxNitro > 0 && this.nitroAmount < this.maxNitro) {
        this.nitroAmount = Math.min(this.maxNitro, this.nitroAmount + 8 * dt);
      }
    }

    // 3. Acceleration & Speed
    const effectiveTopSpeed = this.isNitroActive ? this.topSpeedMps * 1.35 : this.topSpeedMps;
    const effectiveAccel = (this.isNitroActive ? this.accelPower * 1.8 : this.accelPower) * this.frictionMultiplier;
    const effectiveBrake = this.brakePower * this.brakeMultiplier;

    if (input.forward) {
      if (this.speed < effectiveTopSpeed) {
        this.speed += effectiveAccel * dt;
      }
    } else if (input.backward) {
      // Reverse / Backwards
      if (this.speed > -8) {
        this.speed -= effectiveBrake * 0.7 * dt;
      }
    } else {
      // Rolling friction adjusted for rain/storm
      const friction = (this.isDrifting ? 16 : 6.0) * this.frictionMultiplier;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - friction * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + friction * dt);
      }
    }

    // Active Braking
    if (input.brake && this.speed > 0) {
      this.speed = Math.max(0, this.speed - effectiveBrake * dt);
    }

    // 4. Update Position along heading
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);

    const oldX = this.position.x;
    const oldZ = this.position.z;

    this.position.x += forwardX * this.speed * dt;
    this.position.z += forwardZ * this.speed * dt;

    // 5. Spin wheels
    this.wheelRotation += (this.speed / 0.35) * dt;

    // 6. Calculate G-force / Shock jerk on fragile goods
    const speedChange = Math.abs(this.speed - this.prevSpeed) / dt;
    this.prevSpeed = this.speed;
    let shockLevel = Math.min(100, Math.round(speedChange * 2.2));

    // 7. Realistic Oriented Vehicle Collision & Anti-Tunneling Corner Pushout
    let hasCrashed = false;
    let crashSpeed = 0;

    const isCar = this.vehicleType === 'car';
    const isTruck = this.vehicleType === 'truck' || this.vehicleType === 'cargo';
    const discRadius = isTruck ? 0.78 : (isCar ? 0.68 : 0.42);
    // Contact points along the vehicle's actual orientation
    const discOffsets = isTruck ? [1.2, 0, -1.2] : (isCar ? [1.1, 0, -1.1] : [0.65, -0.65]);
    const broadSpan = isTruck ? 3.4 : (isCar ? 3.0 : 2.5);

    // Iterative 2-pass solver to prevent getting trapped/tunneled in acute wall corners
    for (let pass = 0; pass < 2; pass++) {
      let collidedThisPass = false;

      for (const box of collisionBoxes) {
        // Broad phase bounding box check for the whole vehicle footprint
        if (
          this.position.x + broadSpan < box.minX ||
          this.position.x - broadSpan > box.maxX ||
          this.position.z + broadSpan < box.minZ ||
          this.position.z - broadSpan > box.maxZ
        ) {
          continue;
        }

        for (const offset of discOffsets) {
          const discX = this.position.x + forwardX * offset;
          const discZ = this.position.z + forwardZ * offset;

          // Clamped point on AABB box
          const clampedX = Math.max(box.minX, Math.min(box.maxX, discX));
          const clampedZ = Math.max(box.minZ, Math.min(box.maxZ, discZ));

          const dx = discX - clampedX;
          const dz = discZ - clampedZ;
          const distSq = dx * dx + dz * dz;

          let pushX = 0;
          let pushZ = 0;
          let normalX = 0;
          let normalZ = 0;
          let hit = false;

          if (distSq < 0.00001) {
            // Disc center is inside the box: push out along the nearest edge
            const dLeft = discX - box.minX;
            const dRight = box.maxX - discX;
            const dTop = discZ - box.minZ;
            const dBottom = box.maxZ - discZ;
            const minDist = Math.min(dLeft, dRight, dTop, dBottom);

            if (minDist === dLeft) {
              normalX = -1;
            } else if (minDist === dRight) {
              normalX = 1;
            } else if (minDist === dTop) {
              normalZ = -1;
            } else {
              normalZ = 1;
            }

            const penetration = minDist + discRadius;
            pushX = normalX * penetration;
            pushZ = normalZ * penetration;
            hit = true;
          } else if (distSq < discRadius * discRadius) {
            // Disc overlaps edge or corner
            const dist = Math.sqrt(distSq);
            normalX = dx / dist;
            normalZ = dz / dist;
            const penetration = discRadius - dist;
            pushX = normalX * penetration;
            pushZ = normalZ * penetration;
            hit = true;
          }

          if (hit) {
            collidedThisPass = true;
            // Immediate surface normal push-out: eliminates tunneling
            this.position.x += pushX;
            this.position.z += pushZ;

            // Velocity response: calculate velocity projection onto normal
            const velX = forwardX * this.speed;
            const velZ = forwardZ * this.speed;
            const vDotN = velX * normalX + velZ * normalZ;

            if (vDotN < 0) {
              // Moving into the obstacle
              if (Math.abs(this.speed) > 4.5 && vDotN < -2.2) {
                // High speed collision impact
                if (!hasCrashed) {
                  hasCrashed = true;
                  crashSpeed = Math.abs(this.speed);
                  shockLevel = Math.min(100, shockLevel + 65);
                  sounds.playCrash();
                }
                // Gentle bounce back, never fling across walls
                this.speed = -this.speed * 0.22;
              } else {
                // Low-speed wall slide: cancel velocity into wall, allow sliding tangentially
                const headingDotN = forwardX * normalX + forwardZ * normalZ;
                if (this.speed > 0 && headingDotN < 0) {
                  this.speed = Math.max(0, this.speed * (1 + headingDotN * 0.7));
                } else if (this.speed < 0 && headingDotN > 0) {
                  this.speed = Math.min(0, this.speed * (1 - headingDotN * 0.7));
                }
                this.speed *= 0.88; // wall friction
              }
            }
          }
        }
      }

      if (!collidedThisPass) break;
    }

    this.currentShock = shockLevel;

    // 8. World Bounds Safeguard
    const bound = 390;
    if (this.position.x < -bound) {
      this.position.x = -bound;
      if (this.speed * forwardX < 0) this.speed = 0;
    } else if (this.position.x > bound) {
      this.position.x = bound;
      if (this.speed * forwardX > 0) this.speed = 0;
    }
    if (this.position.z < -bound) {
      this.position.z = -bound;
      if (this.speed * forwardZ < 0) this.speed = 0;
    } else if (this.position.z > bound) {
      this.position.z = bound;
      if (this.speed * forwardZ > 0) this.speed = 0;
    }

    // Update sound engine pitch
    const speedRatio = Math.min(1.0, Math.abs(this.speed) / this.topSpeedMps);
    sounds.updateEnginePitch(speedRatio, input.forward, this.isNitroActive);

    if (input.horn) {
      sounds.playHorn();
    }

    return { hasCrashed, crashSpeed, shockLevel };
  }

  public getSpeedKmH(): number {
    return Math.round(Math.abs(this.speed) * 3.6);
  }
}
