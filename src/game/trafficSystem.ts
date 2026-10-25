import * as THREE from 'three';
import { TrafficCar } from '../types/game';

export class TrafficSystem {
  public group: THREE.Group;
  public cars: TrafficCar[] = [];
  private carMeshes: THREE.Group[] = [];
  private readonly maxCars = 18;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'traffic_system';
    this.initTraffic();
  }

  private initTraffic() {
    const carColors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#f8fafc', '#0f172a', '#a855f7'];
    const roadCoords = [-200, -100, 0, 100, 200];

    for (let i = 0; i < this.maxCars; i++) {
      const isZRoad = i % 2 === 0;
      const roadCoord = roadCoords[i % roadCoords.length];
      const isPositiveDir = i % 4 < 2;

      let x = 0;
      let z = 0;
      let angle = 0;
      let direction: 'north' | 'south' | 'east' | 'west' = 'north';

      if (isZRoad) {
        // Traveling along Z
        const laneOffset = isPositiveDir ? 4.5 : -4.5;
        x = roadCoord + laneOffset;
        z = (Math.random() * 500) - 250;
        angle = isPositiveDir ? 0 : Math.PI;
        direction = isPositiveDir ? 'south' : 'north';
      } else {
        // Traveling along X
        const laneOffset = isPositiveDir ? 4.5 : -4.5;
        z = roadCoord + laneOffset;
        x = (Math.random() * 500) - 250;
        angle = isPositiveDir ? -Math.PI / 2 : Math.PI / 2;
        direction = isPositiveDir ? 'east' : 'west';
      }

      const carColor = carColors[i % carColors.length];
      const mesh = this.createCarMesh(carColor);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = angle;
      this.group.add(mesh);
      this.carMeshes.push(mesh);

      this.cars.push({
        id: `traffic_${i}`,
        meshIndex: i,
        x,
        z,
        speed: 12 + Math.random() * 6, // m/s (~40 - 65 km/h)
        targetSpeed: 14,
        angle,
        color: carColor,
        direction,
        roadIndex: i % roadCoords.length,
        laneOffset: isPositiveDir ? 4.5 : -4.5,
      });
    }
  }

  private createCarMesh(colorHex: string): THREE.Group {
    const car = new THREE.Group();
    const color = new THREE.Color(colorHex);

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.5,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.9,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfef08a,
      emissiveIntensity: 1.5,
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.0,
    });

    // Lower chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.7, 4.2);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    car.add(chassis);

    // Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.85, 0.65, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    car.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const w1 = new THREE.Mesh(wheelGeo, tireMat);
    w1.position.set(-1.0, 0.38, 1.3);
    const w2 = w1.clone();
    w2.position.x = 1.0;
    const w3 = w1.clone();
    w3.position.z = -1.3;
    const w4 = w2.clone();
    w4.position.z = -1.3;
    car.add(w1, w2, w3, w4);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.08);
    const hlLeft = new THREE.Mesh(hlGeo, lightMat);
    hlLeft.position.set(-0.7, 0.6, 2.12);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.7;
    car.add(hlLeft, hlRight);

    // Taillights
    const tlLeft = new THREE.Mesh(hlGeo, tailMat);
    tlLeft.position.set(-0.7, 0.6, -2.12);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.7;
    car.add(tlLeft, tlRight);

    return car;
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    const bound = 310;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      const mesh = this.carMeshes[car.meshIndex];

      // Distance to player for yielding / avoiding collision
      const dx = playerPos.x - car.x;
      const dz = playerPos.z - car.z;
      const distToPlayer = Math.hypot(dx, dz);

      let effectiveSpeed = car.speed;
      if (distToPlayer < 9) {
        // Slow down or brake for player
        effectiveSpeed = Math.max(0, effectiveSpeed - 15 * dt);
      }

      // Move along direction
      if (car.direction === 'south') {
        car.z += effectiveSpeed * dt;
        if (car.z > bound) car.z = -bound;
      } else if (car.direction === 'north') {
        car.z -= effectiveSpeed * dt;
        if (car.z < -bound) car.z = bound;
      } else if (car.direction === 'east') {
        car.x += effectiveSpeed * dt;
        if (car.x > bound) car.x = -bound;
      } else if (car.direction === 'west') {
        car.x -= effectiveSpeed * dt;
        if (car.x < -bound) car.x = bound;
      }

      mesh.position.set(car.x, 0, car.z);
    }
  }

  public checkPlayerCollision(playerPos: THREE.Vector3, playerRadius: number = 1.2): boolean {
    for (const car of this.cars) {
      const dx = playerPos.x - car.x;
      const dz = playerPos.z - car.z;
      const dist = Math.hypot(dx, dz);
      if (dist < playerRadius + 1.8) {
        return true;
      }
    }
    return false;
  }
}
