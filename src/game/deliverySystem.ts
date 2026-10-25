import { DeliveryOrder, DeliveryMission, WeatherConditionInfo, Landmark } from '../types/game';
import { LANDMARKS, ORDER_TEMPLATES, MISSION_TEMPLATES } from './constants';
import { sounds } from '../audio/soundManager';

export class DeliverySystem {
  public availableOrders: DeliveryOrder[] = [];
  public activeOrders: DeliveryOrder[] = [];
  public completedHistory: DeliveryOrder[] = [];
  private orderCounter: number = 1;

  // Structured Missions
  public availableMissions: DeliveryMission[] = [];
  public activeMission: DeliveryMission | null = null;
  public completedMissions: DeliveryMission[] = [];

  constructor() {
    this.refreshAvailableOrders();
    this.initMissions();
  }

  private initMissions() {
    this.availableMissions = MISSION_TEMPLATES.map((tmpl, idx) => ({
      ...tmpl,
      id: `mission_${idx + 1}`,
      status: 'available',
      cargoIntegrity: 100,
      remainingTime: tmpl.timeLimit,
      currentCheckpointIdx: 0,
      checkpoints: tmpl.checkpoints.map((cp) => ({ ...cp, isCompleted: false })),
    }));
  }

  public refreshAvailableOrders(count: number = 4) {
    this.availableOrders = [];
    const restaurants = LANDMARKS.filter((l) => l.type === 'restaurant' || l.type === 'market');
    const destinations = LANDMARKS.filter((l) => l.type === 'residence' || l.type === 'office' || l.type === 'depot');

    for (let i = 0; i < count; i++) {
      const template = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
      const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
      const destination = destinations[Math.floor(Math.random() * destinations.length)];

      const dx = destination.position[0] - restaurant.position[0];
      const dz = destination.position[2] - restaurant.position[2];
      const dist = Math.round(Math.hypot(dx, dz));

      const timeLimit = Math.max(50, Math.round(dist * 0.45) + 30);
      const baseReward = Math.round(template.baseReward + dist * 120);
      const tipReward = Math.round(baseReward * 0.4);

      const order: DeliveryOrder = {
        id: `order_${this.orderCounter++}`,
        title: template.title,
        category: template.category as DeliveryOrder['category'],
        customerName: this.getRandomCustomerName(),
        restaurantName: restaurant.name,
        pickupPos: restaurant.position,
        dropoffPos: destination.position,
        baseReward,
        tipReward,
        totalDistance: dist,
        timeLimit,
        remainingTime: timeLimit,
        freshness: 100,
        isFragile: template.isFragile,
        pickedUp: false,
        delivered: false,
        status: 'available',
      };

      this.availableOrders.push(order);
    }
  }

  private getRandomCustomerName(): string {
    const names = [
      'Nguyễn Văn Tuấn', 'Trần Thị Mai', 'Lê Hoàng Nam', 'Phạm Quỳnh Anh',
      'Đặng Minh Khôi', 'Vũ Thùy Linh', 'Bùi Đức Anh', 'Hoàng Phương Thảo',
      'Đỗ Thanh Tùng', 'Ngô Bảo Châu', 'Lý Hải Đăng', 'Võ Thị Ngọc Bích'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  public acceptOrder(orderId: string, maxSlots: number): boolean {
    if (this.activeOrders.length >= maxSlots) {
      return false;
    }
    const idx = this.availableOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      const order = this.availableOrders.splice(idx, 1)[0];
      order.status = 'in_transit';
      this.activeOrders.push(order);
      sounds.playPickup();
      return true;
    }
    return false;
  }

  // Accept a structured mission
  public startMission(missionId: string): boolean {
    const m = this.availableMissions.find((item) => item.id === missionId);
    if (!m) return false;

    // Reset mission state
    m.status = 'in_progress';
    m.remainingTime = m.timeLimit;
    m.cargoIntegrity = 100;
    m.currentCheckpointIdx = 0;
    m.checkpoints.forEach((cp) => (cp.isCompleted = false));

    this.activeMission = m;
    sounds.playPickup();
    return true;
  }

  public cancelActiveMission() {
    if (this.activeMission) {
      this.activeMission.status = 'available';
      this.activeMission = null;
    }
  }

  public update(
    dt: number,
    playerPos: [number, number, number],
    weatherInfo: WeatherConditionInfo,
    shockLevel: number
  ): {
    pickedUpCount: number;
    deliveredCount: number;
    payout: number;
    tip: number;
    missionCompleted: boolean;
    missionFailed: boolean;
    missionRewardMoney: number;
    missionBonusTip: number;
    missionReputation: number;
    missionTitle?: string;
  } {
    let pickedUpCount = 0;
    let deliveredCount = 0;
    let payout = 0;
    let tip = 0;
    let missionCompleted = false;
    let missionFailed = false;
    let missionRewardMoney = 0;
    let missionBonusTip = 0;
    let missionReputation = 0;
    let missionTitle: string | undefined;

    // 1. Process Standard Active Orders
    for (let i = this.activeOrders.length - 1; i >= 0; i--) {
      const order = this.activeOrders[i];
      order.remainingTime = Math.max(0, order.remainingTime - dt);

      // Freshness decays faster in heatwaves
      if (order.pickedUp) {
        order.freshness = Math.max(10, order.freshness - dt * 0.4 * weatherInfo.spoilageRateMultiplier);
      }

      // Check pickup distance if not yet picked up
      if (!order.pickedUp) {
        const distToPickup = Math.hypot(
          playerPos[0] - order.pickupPos[0],
          playerPos[2] - order.pickupPos[2]
        );

        if (distToPickup < 11.5) {
          order.pickedUp = true;
          pickedUpCount++;
          sounds.playPickup();
        }
      } else {
        // Check dropoff distance
        const distToDropoff = Math.hypot(
          playerPos[0] - order.dropoffPos[0],
          playerPos[2] - order.dropoffPos[2]
        );

        if (distToDropoff < 11.5) {
          order.delivered = true;
          order.status = 'completed';
          deliveredCount++;

          const speedBonus = order.remainingTime > order.timeLimit * 0.4 ? order.tipReward : Math.round(order.tipReward * 0.3);
          const freshnessMult = Math.max(0.5, order.freshness / 100);

          const finalEarn = Math.round(order.baseReward * freshnessMult);
          const finalTip = Math.round(speedBonus * freshnessMult * weatherInfo.tipBonusMultiplier);

          payout += finalEarn;
          tip += finalTip;

          this.completedHistory.push(order);
          this.activeOrders.splice(i, 1);
          sounds.playDeliverSuccess();
        }
      }
    }

    // 2. Process Active Structured Mission
    if (this.activeMission && this.activeMission.status === 'in_progress') {
      const m = this.activeMission;
      m.remainingTime = Math.max(0, m.remainingTime - dt);

      // Fragile cargo damage from excess shocks / sudden jerks
      if (m.isFragile && shockLevel > m.maxAllowedShock) {
        const damage = Math.round((shockLevel - m.maxAllowedShock) * 0.35);
        m.cargoIntegrity = Math.max(0, m.cargoIntegrity - damage);
        sounds.playCrash();

        if (m.cargoIntegrity <= 0) {
          m.status = 'failed';
          m.failureReason = 'Hàng hóa đã bị rung lắc đổ nát hoàn toàn!';
          missionFailed = true;
          missionTitle = m.title;
          this.activeMission = null;
        }
      }

      // Time expired
      if (m.remainingTime <= 0 && m.status === 'in_progress') {
        m.status = 'failed';
        m.failureReason = 'Hết thời gian quy định của hợp đồng!';
        missionFailed = true;
        missionTitle = m.title;
        this.activeMission = null;
      }

      // Checkpoint progression
      if (m.status === 'in_progress') {
        const currentCp = m.checkpoints[m.currentCheckpointIdx];
        if (currentCp) {
          const distToCp = Math.hypot(
            playerPos[0] - currentCp.position[0],
            playerPos[2] - currentCp.position[2]
          );

          if (distToCp < 11.5) {
            currentCp.isCompleted = true;
            m.currentCheckpointIdx++;
            sounds.playPickup();

            // All checkpoints cleared -> Mission Success!
            if (m.currentCheckpointIdx >= m.checkpoints.length) {
              m.status = 'completed';
              missionCompleted = true;
              missionTitle = m.title;

              const speedBonus = m.remainingTime > m.timeLimit * 0.3 ? m.bonusTip : Math.round(m.bonusTip * 0.4);
              const fragileMult = m.isFragile ? m.cargoIntegrity / 100 : 1.0;

              missionRewardMoney = Math.round(m.rewardMoney * fragileMult);
              missionBonusTip = Math.round(speedBonus * fragileMult * weatherInfo.tipBonusMultiplier);
              missionReputation = m.reputationPoints;

              this.completedMissions.push(m);
              this.activeMission = null;
              sounds.playDeliverSuccess();
            }
          }
        }
      }
    }

    // Refresh orders if low
    if (this.availableOrders.length < 2) {
      this.refreshAvailableOrders(3);
      sounds.playNewOrderNotification();
    }

    return {
      pickedUpCount,
      deliveredCount,
      payout,
      tip,
      missionCompleted,
      missionFailed,
      missionRewardMoney,
      missionBonusTip,
      missionReputation,
      missionTitle,
    };
  }

  public applyCrashDamage(damage: number = 18) {
    for (const order of this.activeOrders) {
      if (order.pickedUp) {
        order.freshness = Math.max(10, order.freshness - damage);
      }
    }
    if (this.activeMission && this.activeMission.isFragile) {
      this.activeMission.cargoIntegrity = Math.max(0, this.activeMission.cargoIntegrity - damage * 1.5);
    }
  }

  public getActiveTargets(): { pickup?: [number, number, number]; dropoff?: [number, number, number]; checkpoint?: [number, number, number] } {
    // Mission target takes priority if active
    if (this.activeMission && this.activeMission.status === 'in_progress') {
      const currentCp = this.activeMission.checkpoints[this.activeMission.currentCheckpointIdx];
      if (currentCp) {
        return { checkpoint: currentCp.position };
      }
    }

    if (this.activeOrders.length === 0) return {};
    const unpicked = this.activeOrders.find((o) => !o.pickedUp);
    if (unpicked) return { pickup: unpicked.pickupPos };
    return { dropoff: this.activeOrders[0].dropoffPos };
  }
}
