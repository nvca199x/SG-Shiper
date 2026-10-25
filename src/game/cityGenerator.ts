import * as THREE from 'three';
import { CITY_BOUNDS, LANDMARKS } from './constants';
import { Landmark } from '../types/game';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  type: 'building' | 'prop' | 'barrier';
}

export interface CityWorld {
  root: THREE.Group;
  collisionBoxes: CollisionBox[];
  roadIntersections: THREE.Vector3[];
  interactiveLandmarks: Map<string, THREE.Group>;
}

export function generateCityWorld(): CityWorld {
  const root = new THREE.Group();
  root.name = 'city_open_world';
  const collisionBoxes: CollisionBox[] = [];
  const roadIntersections: THREE.Vector3[] = [];
  const interactiveLandmarks = new Map<string, THREE.Group>();

  // 1. Terrain Ground Base (huge extension beyond playable bounds to avoid void)
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  root.add(ground);

  // 2. Road Network Grid
  // Roads run along X and Z at intervals
  const roadInterval = 100;
  const roadWidth = 14;
  const sidewalkWidth = 4;
  const totalRoadWidth = roadWidth + sidewalkWidth * 2; // 22m

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Dark asphalt
    roughness: 0.8,
    metalness: 0.1,
  });

  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Concrete pavement
    roughness: 0.7,
    metalness: 0.05,
  });

  const roadStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Yellow center line
  const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const numRoads = 7; // -300 to +300
  const roadCoords: number[] = [];
  for (let i = -3; i <= 3; i++) {
    roadCoords.push(i * roadInterval);
  }

  // Pre-calculate intersections
  for (const rx of roadCoords) {
    for (const rz of roadCoords) {
      roadIntersections.push(new THREE.Vector3(rx, 0, rz));
    }
  }

  // Generate Road Strips (X and Z directions)
  const fullSpan = 720;

  roadCoords.forEach((rx) => {
    // North-South Road along Z
    const roadZGeo = new THREE.PlaneGeometry(roadWidth, fullSpan);
    roadZGeo.rotateX(-Math.PI / 2);
    const roadZ = new THREE.Mesh(roadZGeo, roadMaterial);
    roadZ.position.set(rx, 0.01, 0);
    roadZ.receiveShadow = true;
    root.add(roadZ);

    // Left & Right Sidewalks
    const swLeftGeo = new THREE.BoxGeometry(sidewalkWidth, 0.2, fullSpan);
    const swLeft = new THREE.Mesh(swLeftGeo, sidewalkMaterial);
    swLeft.position.set(rx - (roadWidth / 2 + sidewalkWidth / 2), 0.1, 0);
    swLeft.receiveShadow = true;
    root.add(swLeft);

    const swRight = swLeft.clone();
    swRight.position.x = rx + (roadWidth / 2 + sidewalkWidth / 2);
    root.add(swRight);

    // Center Yellow Dashed Line
    for (let z = -fullSpan / 2 + 10; z < fullSpan / 2 - 10; z += 12) {
      const dashGeo = new THREE.PlaneGeometry(0.35, 6);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, roadStripeMat);
      dash.position.set(rx, 0.02, z);
      root.add(dash);
    }
  });

  roadCoords.forEach((rz) => {
    // East-West Road along X
    const roadXGeo = new THREE.PlaneGeometry(fullSpan, roadWidth);
    roadXGeo.rotateX(-Math.PI / 2);
    const roadX = new THREE.Mesh(roadXGeo, roadMaterial);
    roadX.position.set(0, 0.01, rz);
    roadX.receiveShadow = true;
    root.add(roadX);

    // Sidewalks
    const swNorthGeo = new THREE.BoxGeometry(fullSpan, 0.2, sidewalkWidth);
    const swNorth = new THREE.Mesh(swNorthGeo, sidewalkMaterial);
    swNorth.position.set(0, 0.1, rz - (roadWidth / 2 + sidewalkWidth / 2));
    swNorth.receiveShadow = true;
    root.add(swNorth);

    const swSouth = swNorth.clone();
    swSouth.position.z = rz + (roadWidth / 2 + sidewalkWidth / 2);
    root.add(swSouth);

    // Center Line
    for (let x = -fullSpan / 2 + 10; x < fullSpan / 2 - 10; x += 12) {
      const dashGeo = new THREE.PlaneGeometry(6, 0.35);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, roadStripeMat);
      dash.position.set(x, 0.02, rz);
      root.add(dash);
    }
  });

  // Crosswalk Zebras at Intersections
  roadCoords.forEach((rx) => {
    roadCoords.forEach((rz) => {
      // 4 Zebra Crossings around each intersection
      const offsets = [
        { x: rx, z: rz - (roadWidth / 2 + 2), rot: 0 },
        { x: rx, z: rz + (roadWidth / 2 + 2), rot: 0 },
        { x: rx - (roadWidth / 2 + 2), z: rz, rot: Math.PI / 2 },
        { x: rx + (roadWidth / 2 + 2), z: rz, rot: Math.PI / 2 },
      ];

      offsets.forEach((off) => {
        for (let s = -4; s <= 4; s += 1.4) {
          const barGeo = new THREE.PlaneGeometry(0.8, 3.2);
          barGeo.rotateX(-Math.PI / 2);
          const bar = new THREE.Mesh(barGeo, zebraMat);
          if (off.rot === 0) {
            bar.position.set(off.x + s, 0.025, off.z);
          } else {
            bar.rotation.y = Math.PI / 2;
            bar.position.set(off.x, 0.025, off.z + s);
          }
          root.add(bar);
        }
      });
    });
  });

  // 3. Buildings & City Blocks
  // Each block is bounded by roads: e.g. between x1 and x2, z1 and z2
  // We place district-themed structures within each block
  const buildingPalette = [
    0x38bdf8, // Glass tower cyan
    0x0284c7, // Blue office
    0x475569, // Slate modern
    0xf59e0b, // Amber commercial
    0x10b981, // Emerald condo
    0xef4444, // Red brick
    0x8b5cf6, // Violet apartment
    0xf8fafc, // Pearl white
  ];

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });

  for (let ix = 0; ix < roadCoords.length - 1; ix++) {
    for (let iz = 0; iz < roadCoords.length - 1; iz++) {
      const x1 = roadCoords[ix] + totalRoadWidth / 2 + 2;
      const x2 = roadCoords[ix + 1] - totalRoadWidth / 2 - 2;
      const z1 = roadCoords[iz] + totalRoadWidth / 2 + 2;
      const z2 = roadCoords[iz + 1] - totalRoadWidth / 2 - 2;

      const blockCenterX = (x1 + x2) / 2;
      const blockCenterZ = (z1 + z2) / 2;
      const blockW = x2 - x1;
      const blockD = z2 - z1;

      // Special Block 1: Central Park at center (ix === 3, iz === 3 -> around [0, 0])
      if (Math.abs(blockCenterX) < 40 && Math.abs(blockCenterZ) < 40) {
        // Central Park
        const grassGeo = new THREE.BoxGeometry(blockW, 0.3, blockD);
        const grassMat = new THREE.MeshStandardMaterial({
          color: 0x15803d, // Lush green
          roughness: 0.9,
        });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.position.set(blockCenterX, 0.15, blockCenterZ);
        grass.receiveShadow = true;
        root.add(grass);

        // Fountain in center of park
        const fountainRingGeo = new THREE.CylinderGeometry(10, 11, 1.2, 24);
        const fountainRing = new THREE.Mesh(fountainRingGeo, stoneMat);
        fountainRing.position.set(blockCenterX, 0.6, blockCenterZ);
        root.add(fountainRing);

        const waterGeo = new THREE.CylinderGeometry(9.6, 9.6, 0.8, 20);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          roughness: 0.1,
          metalness: 0.8,
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(blockCenterX, 0.8, blockCenterZ);
        root.add(water);

        collisionBoxes.push({
          minX: blockCenterX - 11,
          maxX: blockCenterX + 11,
          minZ: blockCenterZ - 11,
          maxZ: blockCenterZ + 11,
          type: 'barrier',
        });
        continue;
      }

      // Check District Theme based on position
      const isDowntown = blockCenterX > 0 && blockCenterZ < 0;
      const isFoodMarket = blockCenterX < 0 && blockCenterZ < 0;
      const isResidential = blockCenterX < 0 && blockCenterZ > 0;
      const isIndustrial = blockCenterX > 0 && blockCenterZ > 0;

      if (isDowntown) {
        // 2-3 High-Rise Skyscrapers per block
        const bHeights = [38, 55, 46, 68];
        const subW = blockW / 2 - 3;
        const subD = blockD / 2 - 3;

        const subPositions = [
          [x1 + subW / 2 + 1, z1 + subD / 2 + 1],
          [x2 - subW / 2 - 1, z1 + subD / 2 + 1],
          [x1 + subW / 2 + 1, z2 - subD / 2 - 1],
          [x2 - subW / 2 - 1, z2 - subD / 2 - 1],
        ];

        subPositions.forEach(([sx, sz], bIdx) => {
          const height = bHeights[bIdx % bHeights.length] + ((sx * sz) % 15);
          const colorHex = buildingPalette[(Math.abs(sx + sz) as number) % buildingPalette.length];
          const bMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.35,
            metalness: 0.45,
          });

          // Main tower
          const bGeo = new THREE.BoxGeometry(subW, height, subD);
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set(sx, height / 2, sz);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          root.add(bMesh);

          // Roof top spire or AC unit
          const roofGeo = new THREE.BoxGeometry(subW * 0.4, 3, subD * 0.4);
          const roof = new THREE.Mesh(roofGeo, stoneMat);
          roof.position.set(sx, height + 1.5, sz);
          root.add(roof);

          collisionBoxes.push({
            minX: sx - subW / 2 - 0.5,
            maxX: sx + subW / 2 + 0.5,
            minZ: sz - subD / 2 - 0.5,
            maxZ: sz + subD / 2 + 0.5,
            type: 'building',
          });
        });

      } else if (isFoodMarket) {
        // Food Market / Shophouses (colorful smaller buildings, awnings, vibrant stalls)
        const numShopsX = 3;
        const numShopsZ = 2;
        const shopW = blockW / numShopsX - 3;
        const shopD = blockD / numShopsZ - 3;

        for (let si = 0; si < numShopsX; si++) {
          for (let sj = 0; sj < numShopsZ; sj++) {
            const sx = x1 + shopW / 2 + si * (shopW + 3) + 1.5;
            const sz = z1 + shopD / 2 + sj * (shopD + 3) + 1.5;
            const shopHeight = 10 + ((si + sj) % 3) * 3;

            const shopMat = new THREE.MeshStandardMaterial({
              color: buildingPalette[(si * 3 + sj + 2) % buildingPalette.length],
              roughness: 0.6,
            });
            const shopGeo = new THREE.BoxGeometry(shopW, shopHeight, shopD);
            const shopMesh = new THREE.Mesh(shopGeo, shopMat);
            shopMesh.position.set(sx, shopHeight / 2, sz);
            shopMesh.castShadow = true;
            shopMesh.receiveShadow = true;
            root.add(shopMesh);

            // Colorful Striped Awning in front
            const awningGeo = new THREE.BoxGeometry(shopW * 0.9, 0.4, 2.5);
            const awningMat = new THREE.MeshStandardMaterial({
              color: (si + sj) % 2 === 0 ? 0xef4444 : 0xf59e0b,
              roughness: 0.5,
            });
            const awning = new THREE.Mesh(awningGeo, awningMat);
            awning.position.set(sx, 3.2, sz - shopD / 2 - 1.2);
            awning.rotation.x = 0.15;
            root.add(awning);

            collisionBoxes.push({
              minX: sx - shopW / 2 - 0.5,
              maxX: sx + shopW / 2 + 0.5,
              minZ: sz - shopD / 2 - 1.8,
              maxZ: sz + shopD / 2 + 0.5,
              type: 'building',
            });
          }
        }

      } else if (isResidential) {
        // Townhouses and residential villas with balconies & garden yards
        const villaW = blockW / 2 - 4;
        const villaD = blockD / 2 - 4;

        const positions = [
          [x1 + villaW / 2 + 2, z1 + villaD / 2 + 2],
          [x2 - villaW / 2 - 2, z1 + villaD / 2 + 2],
          [x1 + villaW / 2 + 2, z2 - villaD / 2 - 2],
          [x2 - villaW / 2 - 2, z2 - villaD / 2 - 2],
        ];

        positions.forEach(([vx, vz], idx) => {
          const vHeight = 12 + (idx % 2) * 4;
          const vMat = new THREE.MeshStandardMaterial({
            color: idx % 2 === 0 ? 0xf8fafc : 0xfef08a,
            roughness: 0.5,
          });
          const vGeo = new THREE.BoxGeometry(villaW, vHeight, villaD);
          const vMesh = new THREE.Mesh(vGeo, vMat);
          vMesh.position.set(vx, vHeight / 2, vz);
          vMesh.castShadow = true;
          vMesh.receiveShadow = true;
          root.add(vMesh);

          // Pitched Roof
          const roofGeo = new THREE.ConeGeometry(villaW * 0.75, 4, 4);
          roofGeo.rotateY(Math.PI / 4);
          const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.set(vx, vHeight + 2, vz);
          roof.castShadow = true;
          root.add(roof);

          collisionBoxes.push({
            minX: vx - villaW / 2 - 0.5,
            maxX: vx + villaW / 2 + 0.5,
            minZ: vz - villaD / 2 - 0.5,
            maxZ: vz + villaD / 2 + 0.5,
            type: 'building',
          });
        });

      } else {
        // Industrial Warehouse & Logistics Center
        const wHeight = 14;
        const wMat = new THREE.MeshStandardMaterial({
          color: 0x475569, // Corrugated industrial slate
          roughness: 0.8,
          metalness: 0.4,
        });
        const wGeo = new THREE.BoxGeometry(blockW - 10, wHeight, blockD - 14);
        const wMesh = new THREE.Mesh(wGeo, wMat);
        wMesh.position.set(blockCenterX, wHeight / 2, blockCenterZ);
        wMesh.castShadow = true;
        wMesh.receiveShadow = true;
        root.add(wMesh);

        // Shipping Containers stacked nearby
        const containerColors = [0x0284c7, 0xdc2626, 0x16a34a, 0xeab308];
        for (let ci = 0; ci < 4; ci++) {
          const cGeo = new THREE.BoxGeometry(6, 2.8, 14);
          const cMat = new THREE.MeshStandardMaterial({
            color: containerColors[ci % containerColors.length],
            roughness: 0.5,
            metalness: 0.6,
          });
          const container = new THREE.Mesh(cGeo, cMat);
          container.position.set(x1 + 6 + ci * 2, 1.4, z1 + 10);
          container.castShadow = true;
          root.add(container);
        }

        collisionBoxes.push({
          minX: blockCenterX - (blockW - 10) / 2 - 0.5,
          maxX: blockCenterX + (blockW - 10) / 2 + 0.5,
          minZ: blockCenterZ - (blockD - 14) / 2 - 0.5,
          maxZ: blockCenterZ + (blockD - 14) / 2 + 0.5,
          type: 'building',
        });
      }
    }
  }

  // 4. City Props: Instanced Street Trees along sidewalks
  const treeCount = 180;
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.5, 6);
  const foliageGeo = new THREE.SphereGeometry(2.2, 8, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

  const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const instancedFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
  instancedTrunk.castShadow = true;
  instancedFoliage.castShadow = true;

  const dummy = new THREE.Object3D();
  let treeIdx = 0;

  roadCoords.forEach((rx) => {
    for (let z = -280; z <= 280; z += 35) {
      if (treeIdx >= treeCount) break;
      // Skip intersections
      if (roadCoords.some((rz) => Math.abs(z - rz) < 18)) continue;

      const tx = rx - 9;
      dummy.position.set(tx, 1.75, z);
      dummy.scale.set(0.9 + Math.random() * 0.3, 0.9 + Math.random() * 0.3, 0.9 + Math.random() * 0.3);
      dummy.updateMatrix();
      instancedTrunk.setMatrixAt(treeIdx, dummy.matrix);

      dummy.position.set(tx, 4.5, z);
      dummy.updateMatrix();
      instancedFoliage.setMatrixAt(treeIdx, dummy.matrix);

      // Add tree collision
      collisionBoxes.push({
        minX: tx - 0.8,
        maxX: tx + 0.8,
        minZ: z - 0.8,
        maxZ: z + 0.8,
        type: 'prop',
      });

      treeIdx++;
    }
  });

  instancedTrunk.count = treeIdx;
  instancedFoliage.count = treeIdx;
  instancedTrunk.instanceMatrix.needsUpdate = true;
  instancedFoliage.instanceMatrix.needsUpdate = true;
  root.add(instancedTrunk, instancedFoliage);

  // 5. Streetlamps at intersections
  const lampPostGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
  const lampHeadGeo = new THREE.BoxGeometry(1.2, 0.3, 0.5);
  const lampLightMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xfde047,
    emissiveIntensity: 1.5,
  });

  roadCoords.forEach((rx) => {
    roadCoords.forEach((rz) => {
      // 2 streetlamps per intersection corner
      const lx = rx - 10;
      const lz = rz - 10;

      const lamp = new THREE.Group();
      lamp.position.set(lx, 0, lz);

      const post = new THREE.Mesh(lampPostGeo, lampMat);
      post.position.y = 3.75;
      lamp.add(post);

      const head = new THREE.Mesh(lampHeadGeo, lampLightMat);
      head.position.set(0.5, 7.3, 0);
      lamp.add(head);

      root.add(lamp);

      collisionBoxes.push({
        minX: lx - 0.5,
        maxX: lx + 0.5,
        minZ: lz - 0.5,
        maxZ: lz + 0.5,
        type: 'prop',
      });
    });
  });

  // 6. Perimeter Natural Barrier: Mountains/Hills & Trees bounding the city
  // Bounded naturally per Three.js directives (no void!)
  const hillCount = 36;
  const hillGeo = new THREE.ConeGeometry(50, 45, 8);
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.95 });

  for (let hi = 0; hi < hillCount; hi++) {
    const angle = (hi / hillCount) * Math.PI * 2;
    const dist = 390 + (hi % 3) * 20;
    const hx = Math.cos(angle) * dist;
    const hz = Math.sin(angle) * dist;

    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(hx, 15, hz);
    hill.scale.set(1 + (hi % 2) * 0.5, 1 + (hi % 3) * 0.4, 1 + (hi % 2) * 0.5);
    root.add(hill);
  }

  // City Bounds Barrier Collisions
  collisionBoxes.push(
    { minX: CITY_BOUNDS.minX - 20, maxX: CITY_BOUNDS.minX, minZ: -500, maxZ: 500, type: 'barrier' },
    { minX: CITY_BOUNDS.maxX, maxX: CITY_BOUNDS.maxX + 20, minZ: -500, maxZ: 500, type: 'barrier' },
    { minX: -500, maxX: 500, minZ: CITY_BOUNDS.minZ - 20, maxZ: CITY_BOUNDS.minZ, type: 'barrier' },
    { minX: -500, maxX: 500, minZ: CITY_BOUNDS.maxZ, maxZ: CITY_BOUNDS.maxZ + 20, type: 'barrier' }
  );

  // 7. Interactive Delivery Landmarks (Subtle curbside store markings; beacon is exclusive to active target)
  LANDMARKS.forEach((lm) => {
    const lmGroup = new THREE.Group();
    lmGroup.position.set(lm.position[0], 0, lm.position[2]);

    const lmColor = new THREE.Color(lm.color);

    // Subtle store entrance curb ring
    const curbRingGeo = new THREE.RingGeometry(2.0, 2.3, 24);
    curbRingGeo.rotateX(-Math.PI / 2);
    const curbRingMat = new THREE.MeshBasicMaterial({
      color: lmColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const curbRing = new THREE.Mesh(curbRingGeo, curbRingMat);
    curbRing.position.y = 0.04;
    lmGroup.add(curbRing);

    root.add(lmGroup);
    interactiveLandmarks.set(lm.id, lmGroup);
  });

  return {
    root,
    collisionBoxes,
    roadIntersections,
    interactiveLandmarks,
  };
}
