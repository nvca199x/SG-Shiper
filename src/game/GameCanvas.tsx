import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { generateCityWorld, CityWorld } from './cityGenerator';
import { buildProceduralVehicle, VehicleParts } from './vehicleBuilder';
import { TrafficSystem } from './trafficSystem';
import { PhysicsEngine, InputState } from './physicsEngine';
import { DeliverySystem } from './deliverySystem';
import { VehicleConfig, VehicleUpgrades, WeatherType, GameState } from '../types/game';
import { WEATHER_CONDITIONS } from './constants';

interface GameCanvasProps {
  gameState: GameState;
  vehicleConfig: VehicleConfig;
  vehicleUpgrades: VehicleUpgrades;
  weather: WeatherType;
  deliverySystem: DeliverySystem;
  physicsEngine: PhysicsEngine;
  inputStateRef: React.MutableRefObject<InputState>;
  onSpeedUpdate: (kmh: number, nitroPercent: number, shockLevel: number) => void;
  onDeliveryEvent: (event: 'pickup' | 'delivered', payout?: number, tip?: number) => void;
  onMissionResult: (success: boolean, title: string, money: number, tip: number, rep: number, reason?: string) => void;
  onCrash: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  vehicleConfig,
  vehicleUpgrades,
  weather,
  deliverySystem,
  physicsEngine,
  inputStateRef,
  onSpeedUpdate,
  onDeliveryEvent,
  onMissionResult,
  onCrash,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const vehiclePartsRef = useRef<VehicleParts | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const worldRef = useRef<CityWorld | null>(null);
  const trafficRef = useRef<TrafficSystem | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const navArrowRef = useRef<THREE.Group | null>(null);
  const activeBeaconRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);

  // Dynamic props stored in refs to avoid closure stale state in render loop
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const weatherRef = useRef(weather);
  weatherRef.current = weather;

  const onSpeedUpdateRef = useRef(onSpeedUpdate);
  onSpeedUpdateRef.current = onSpeedUpdate;

  const onDeliveryEventRef = useRef(onDeliveryEvent);
  onDeliveryEventRef.current = onDeliveryEvent;

  const onMissionResultRef = useRef(onMissionResult);
  onMissionResultRef.current = onMissionResult;

  const onCrashRef = useRef(onCrash);
  onCrashRef.current = onCrash;

  // Rain Particles
  const rainPointsRef = useRef<THREE.Points | null>(null);
  const rainGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const rainPositionsRef = useRef<Float32Array | null>(null);

  // Lightning effect during storm
  const lightningTimeRef = useRef<number>(0);

  // Weather update effect
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;
    const scene = sceneRef.current;
    const dirLight = dirLightRef.current;
    const hemiLight = hemiLightRef.current;
    const condition = WEATHER_CONDITIONS[weather];

    // Inform physics engine of friction / brake multipliers
    physicsEngine.setWeatherModifiers(condition);

    // Weather Visuals
    switch (weather) {
      case 'sunny':
        scene.background = new THREE.Color(0x38bdf8); // Sky blue
        scene.fog = new THREE.FogExp2(0x38bdf8, condition.fogDensity);
        dirLight.color.setHex(0xfffaed);
        dirLight.intensity = condition.lightIntensity;
        hemiLight.color.setHex(0xffffff);
        hemiLight.groundColor.setHex(0x334155);
        hemiLight.intensity = 1.0;
        break;

      case 'heatwave':
        scene.background = new THREE.Color(0xfde047); // Searing golden-yellow haze
        scene.fog = new THREE.FogExp2(0xf59e0b, condition.fogDensity);
        dirLight.color.setHex(0xffedd5);
        dirLight.intensity = condition.lightIntensity;
        hemiLight.color.setHex(0xfef08a);
        hemiLight.groundColor.setHex(0x78350f);
        hemiLight.intensity = 1.1;
        break;

      case 'sunset':
        scene.background = new THREE.Color(0xf97316); // Amber orange
        scene.fog = new THREE.FogExp2(0xf97316, condition.fogDensity);
        dirLight.color.setHex(0xfdba74);
        dirLight.intensity = condition.lightIntensity;
        hemiLight.color.setHex(0xfb923c);
        hemiLight.groundColor.setHex(0x475569);
        hemiLight.intensity = 0.8;
        break;

      case 'neon_night':
        scene.background = new THREE.Color(0x090d16); // Deep midnight
        scene.fog = new THREE.FogExp2(0x090d16, condition.fogDensity);
        dirLight.color.setHex(0x60a5fa);
        dirLight.intensity = condition.lightIntensity;
        hemiLight.color.setHex(0x1e293b);
        hemiLight.groundColor.setHex(0x0f172a);
        hemiLight.intensity = 0.4;
        break;

      case 'fog':
        scene.background = new THREE.Color(0x94a3b8); // Dense grey mist
        scene.fog = new THREE.FogExp2(0x94a3b8, condition.fogDensity);
        dirLight.color.setHex(0xcfd8dc);
        dirLight.intensity = condition.lightIntensity;
        hemiLight.color.setHex(0xb0bec5);
        hemiLight.groundColor.setHex(0x37474f);
        hemiLight.intensity = 0.7;
        break;

      case 'rain':
      case 'storm':
        const stormCol = weather === 'storm' ? 0x1e293b : 0x334155;
        scene.background = new THREE.Color(stormCol);
        scene.fog = new THREE.FogExp2(stormCol, condition.fogDensity);
        dirLight.color.setHex(0x64748b);
        dirLight.intensity = condition.lightIntensity;
        hemiLight.color.setHex(0x475569);
        hemiLight.groundColor.setHex(0x0f172a);
        hemiLight.intensity = 0.5;
        break;
    }

    // Toggle rain visibility
    if (rainPointsRef.current) {
      rainPointsRef.current.visible = weather === 'rain' || weather === 'storm';
    }
  }, [weather]);

  // Vehicle rebuild effect when config or customization changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (vehiclePartsRef.current) {
      scene.remove(vehiclePartsRef.current.group);
    }

    const parts = buildProceduralVehicle(vehicleConfig, vehicleUpgrades.customization);
    vehiclePartsRef.current = parts;
    scene.add(parts.group);

    // Apply initial position
    parts.group.position.copy(physicsEngine.position);
    parts.group.rotation.y = physicsEngine.heading;

    physicsEngine.configureStats(vehicleConfig, vehicleUpgrades);
  }, [vehicleConfig, vehicleUpgrades]);

  // Main Three.js Lifecycle
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.0);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight.position.set(120, 180, 100);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
    dirLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const d = 120;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Generate City World
    const world = generateCityWorld();
    scene.add(world.root);
    worldRef.current = world;

    // Traffic System
    const traffic = new TrafficSystem();
    scene.add(traffic.group);
    trafficRef.current = traffic;

    // Player Vehicle
    const parts = buildProceduralVehicle(vehicleConfig, vehicleUpgrades.customization);
    vehiclePartsRef.current = parts;
    scene.add(parts.group);
    parts.group.position.copy(physicsEngine.position);
    parts.group.rotation.y = physicsEngine.heading;

    // Immediately configure physics stats and weather on mount
    physicsEngine.configureStats(vehicleConfig, vehicleUpgrades);
    physicsEngine.setWeatherModifiers(WEATHER_CONDITIONS[weather]);

    // Road-Surface GPS Navigation Chevron (Projected flat on the asphalt ahead of the vehicle)
    const navArrowGroup = new THREE.Group();
    navArrowGroup.name = 'road_nav_arrow';

    // 1. Semi-translucent dark road contrast backing (ensures clear visibility on any asphalt/crosswalk)
    const baseShape = new THREE.Shape();
    baseShape.moveTo(0, 1.85); // Tip forward
    baseShape.lineTo(1.1, -0.65); // Right wing
    baseShape.lineTo(0.48, -0.32); // Inner right
    baseShape.lineTo(0.48, -1.25); // Tail right
    baseShape.lineTo(-0.48, -1.25); // Tail left
    baseShape.lineTo(-0.48, -0.32); // Inner left
    baseShape.lineTo(-1.1, -0.65); // Left wing
    baseShape.closePath();

    const baseGeo = new THREE.ShapeGeometry(baseShape);
    baseGeo.rotateX(Math.PI / 2); // Lay flat on road, tip points along +Z
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x090d16,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.renderOrder = 9998;
    baseMesh.position.y = 0.16;
    navArrowGroup.add(baseMesh);

    // 2. Main Luminous Glowing Chevron Arrow
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, 1.65); // Tip
    innerShape.lineTo(0.95, -0.55); // Right wing
    innerShape.lineTo(0.4, -0.28); // Inner right
    innerShape.lineTo(0.4, -1.1); // Tail right
    innerShape.lineTo(-0.4, -1.1); // Tail left
    innerShape.lineTo(-0.4, -0.28); // Inner left
    innerShape.lineTo(-0.95, -0.55); // Left wing
    innerShape.closePath();

    const innerGeo = new THREE.ShapeGeometry(innerShape);
    innerGeo.rotateX(Math.PI / 2); // Lay flat on road, tip points along +Z
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const innerMesh = new THREE.Mesh(innerGeo, arrowMat);
    innerMesh.renderOrder = 9999;
    innerMesh.position.y = 0.18;
    navArrowGroup.add(innerMesh);

    // 3. Second mini-chevron pulsing ahead along the road (AR flow effect)
    const pulseShape = new THREE.Shape();
    pulseShape.moveTo(0, 0.9);
    pulseShape.lineTo(0.5, -0.25);
    pulseShape.lineTo(0.2, -0.1);
    pulseShape.lineTo(0.2, -0.5);
    pulseShape.lineTo(-0.2, -0.5);
    pulseShape.lineTo(-0.2, -0.1);
    pulseShape.lineTo(-0.5, -0.25);
    pulseShape.closePath();

    const pulseGeo = new THREE.ShapeGeometry(pulseShape);
    pulseGeo.rotateX(Math.PI / 2); // Lay flat on road, tip points along +Z
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.renderOrder = 10000;
    pulseMesh.position.set(0, 0.20, 1.4);
    navArrowGroup.add(pulseMesh);

    navArrowGroup.position.set(0, 0.20, 0);
    navArrowGroup.renderOrder = 9999;
    scene.add(navArrowGroup);
    navArrowRef.current = navArrowGroup;

    // Dedicated Single Active Target Beacon (ONLY appears at the current active destination!)
    const activeBeaconGroup = new THREE.Group();
    activeBeaconGroup.name = 'active_target_beacon';
    activeBeaconGroup.visible = false;

    // Outer Target Pulse Ring on Road
    const beaconRingGeo = new THREE.RingGeometry(3.6, 4.4, 32);
    beaconRingGeo.rotateX(-Math.PI / 2);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.position.y = 0.08;
    activeBeaconGroup.add(beaconRing);

    // Floating Rotating 3D Diamond Icon
    const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    diamondMesh.position.y = 4.2;
    activeBeaconGroup.add(diamondMesh);

    // Single Sky Pillar Beam
    const beamGeo = new THREE.CylinderGeometry(0.3, 1.2, 45, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 22.5;
    activeBeaconGroup.add(beamMesh);

    scene.add(activeBeaconGroup);
    activeBeaconRef.current = activeBeaconGroup;

    // Drift / Nitro Particles
    const pCount = 150;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let pi = 0; pi < pCount * 3; pi++) {
      pPos[pi] = 0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.65,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;
    particlePositionsRef.current = pPos;

    // Rain Particle System (700 raindrops)
    const rainCount = 700;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let ri = 0; ri < rainCount; ri++) {
      rainPositions[ri * 3] = (Math.random() - 0.5) * 160;
      rainPositions[ri * 3 + 1] = Math.random() * 45;
      rainPositions[ri * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.45,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    scene.add(rainPoints);
    rainPointsRef.current = rainPoints;
    rainGeoRef.current = rainGeo;
    rainPositionsRef.current = rainPositions;

    // Camera follow state
    const currentCamPos = new THREE.Vector3(0, 10, 45);
    const currentLookAt = new THREE.Vector3(0, 1.2, 30);
    let titleCamAngle = 0;

    // Clock
    const clock = new THREE.Clock();
    let frameId = 0;

    // Software GL pacing function
    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    // Render loop
    const tick = () => {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      if (gameStateRef.current === 'playing') {
        // Physics update
        const input = inputStateRef.current;
        const { hasCrashed, crashSpeed, shockLevel } = physicsEngine.update(
          dt,
          input,
          world.collisionBoxes
        );

        if (hasCrashed) {
          deliverySystem.applyCrashDamage(Math.min(30, Math.round(crashSpeed * 2)));
          onCrashRef.current();
        }

        // Check Traffic collision
        const hitTraffic = traffic.checkPlayerCollision(physicsEngine.position);
        if (hitTraffic) {
          physicsEngine.speed = -physicsEngine.speed * 0.4;
          deliverySystem.applyCrashDamage(15);
          onCrashRef.current();
        }

        // Update Traffic cars
        traffic.update(dt, physicsEngine.position);

        // Update Deliveries & Structured Missions
        const curWeather = weatherRef.current;
        const condition = WEATHER_CONDITIONS[curWeather];
        const {
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
        } = deliverySystem.update(
          dt,
          [physicsEngine.position.x, 0, physicsEngine.position.z],
          condition,
          shockLevel
        );

        if (pickedUpCount > 0) onDeliveryEventRef.current('pickup');
        if (deliveredCount > 0) onDeliveryEventRef.current('delivered', payout, tip);

        if (missionCompleted && missionTitle) {
          onMissionResultRef.current(true, missionTitle, missionRewardMoney, missionBonusTip, missionReputation);
        }
        if (missionFailed && missionTitle) {
          onMissionResultRef.current(false, missionTitle, 0, 0, 0, deliverySystem.activeMission?.failureReason);
        }

        // Send UI stats
        const nitroPct = physicsEngine.maxNitro > 0
          ? Math.round((physicsEngine.nitroAmount / physicsEngine.maxNitro) * 100)
          : 0;
        onSpeedUpdateRef.current(physicsEngine.getSpeedKmH(), nitroPct, shockLevel);

        // Update 3D Vehicle parts
        if (vehiclePartsRef.current) {
          const vp = vehiclePartsRef.current;
          vp.group.position.copy(physicsEngine.position);
          vp.group.rotation.y = physicsEngine.heading;
          vp.group.rotation.z = physicsEngine.leanAngle;

          // Steer front fork
          vp.frontFork.rotation.y = physicsEngine.steeringAngle;

          // Rotate wheels
          vp.frontWheel.rotation.x = physicsEngine.wheelRotation;
          vp.rearWheel.rotation.x = physicsEngine.wheelRotation;

          // Flapping flag in wind
          if (vp.flagMesh) {
            vp.flagMesh.rotation.y = Math.sin(clock.getElapsedTime() * 12) * 0.25;
          }

          // Nitro flame/trail particles
          if (particlesRef.current && particlePositionsRef.current) {
            const posArr = particlePositionsRef.current;
            if (physicsEngine.isNitroActive || physicsEngine.isDrifting) {
              const backX = physicsEngine.position.x - Math.sin(physicsEngine.heading) * 1.5;
              const backZ = physicsEngine.position.z - Math.cos(physicsEngine.heading) * 1.5;

              for (let p = 0; p < pCount; p++) {
                if (Math.random() < 0.3) {
                  posArr[p * 3] = backX + (Math.random() - 0.5) * 0.4;
                  posArr[p * 3 + 1] = 0.4 + (Math.random() - 0.5) * 0.3;
                  posArr[p * 3 + 2] = backZ + (Math.random() - 0.5) * 0.4;
                }
              }
              particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }
          }
        }

        // Update Rain Particles around player
        if (rainPointsRef.current && rainPositionsRef.current && (curWeather === 'rain' || curWeather === 'storm')) {
          const rPos = rainPositionsRef.current;
          const px = physicsEngine.position.x;
          const pz = physicsEngine.position.z;
          const fallSpeed = curWeather === 'storm' ? 38 : 22;

          for (let ri = 0; ri < rainCount; ri++) {
            rPos[ri * 3 + 1] -= fallSpeed * dt;
            if (rPos[ri * 3 + 1] < 0) {
              rPos[ri * 3] = px + (Math.random() - 0.5) * 120;
              rPos[ri * 3 + 1] = 35 + Math.random() * 10;
              rPos[ri * 3 + 2] = pz + (Math.random() - 0.5) * 120;
            }
          }
          rainPointsRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Storm Lightning Flash Simulation
        if (curWeather === 'storm' && dirLightRef.current) {
          lightningTimeRef.current += dt;
          if (lightningTimeRef.current > 7.0 && Math.random() < 0.04) {
            dirLightRef.current.intensity = 4.5;
            setTimeout(() => {
              if (dirLightRef.current) dirLightRef.current.intensity = condition.lightIntensity;
            }, 60);
            lightningTimeRef.current = 0;
          }
        }

        // Update 3D GPS Chevron Arrow & Single Active Target Beacon
        const targets = deliverySystem.getActiveTargets();
        const targetPos = targets.checkpoint || targets.pickup || targets.dropoff;

        if (navArrowRef.current) {
          const arrow = navArrowRef.current;

          if (targetPos) {
            arrow.visible = true;

            // Position on the road surface, 11.5m ahead of the vehicle for crystal clear visibility
            const leadDist = 11.5;
            const forwardX = Math.sin(physicsEngine.heading);
            const forwardZ = Math.cos(physicsEngine.heading);
            const arrowX = physicsEngine.position.x + forwardX * leadDist;
            const arrowZ = physicsEngine.position.z + forwardZ * leadDist;
            arrow.position.set(arrowX, 0.20, arrowZ);

            // Point +Z directly toward destination target
            const dx = targetPos[0] - arrowX;
            const dz = targetPos[2] - arrowZ;
            const targetYaw = Math.atan2(dx, dz);
            arrow.rotation.set(0, targetYaw, 0);

            // Determine color matching delivery phase
            let arrowHex = 0x10b981; // Emerald for Customer Delivery
            if (targets.checkpoint) {
              arrowHex = 0xa855f7; // Purple for Mission Checkpoints
            } else if (targets.pickup) {
              arrowHex = 0xf59e0b; // Gold for Food/Drink Pickups
            }

            // Main luminous chevron
            const innerMesh = arrow.children[1] as THREE.Mesh;
            if (innerMesh && innerMesh.material) {
              (innerMesh.material as THREE.MeshBasicMaterial).color.setHex(arrowHex);
              const breath = 1.0 + Math.sin(clock.getElapsedTime() * 3.5) * 0.05;
              innerMesh.scale.set(breath, 1.0, breath);
            }

            // Forward pulsing mini-chevron (AR flow effect)
            const pulseMesh = arrow.children[2] as THREE.Mesh;
            if (pulseMesh && pulseMesh.material) {
              const pMat = pulseMesh.material as THREE.MeshBasicMaterial;
              pMat.color.setHex(arrowHex);
              const pOffset = (clock.getElapsedTime() * 2.4) % 1.0;
              pulseMesh.position.z = 1.1 + pOffset * 0.9;
              const pScale = 1.0 - pOffset * 0.3;
              pulseMesh.scale.set(pScale, 1.0, pScale);
              pMat.opacity = 0.85 * (1.0 - pOffset * 0.75);
            }
          } else {
            arrow.visible = false;
          }
        }

        // Update Single Active Target Beacon (The ONLY beacon in the whole city!)
        if (activeBeaconRef.current) {
          const beacon = activeBeaconRef.current;

          if (targetPos) {
            beacon.visible = true;
            beacon.position.set(targetPos[0], 0, targetPos[2]);

            let bHex = 0x10b981;
            if (targets.checkpoint) bHex = 0xa855f7;
            else if (targets.pickup) bHex = 0xf59e0b;

            // Pulse landing pad ring
            const ring = beacon.children[0] as THREE.Mesh;
            if (ring) {
              (ring.material as THREE.MeshBasicMaterial).color.setHex(bHex);
              const pScale = 1.0 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
              ring.scale.set(pScale, pScale, pScale);
              ring.rotation.z += dt * 1.5;
            }

            // Floating 3D Diamond
            const diamond = beacon.children[1] as THREE.Mesh;
            if (diamond) {
              const dMat = diamond.material as THREE.MeshStandardMaterial;
              dMat.color.setHex(bHex);
              dMat.emissive.setHex(bHex);
              diamond.rotation.y += dt * 2.2;
              diamond.rotation.x += dt * 1.0;
              diamond.position.y = 4.2 + Math.sin(clock.getElapsedTime() * 3) * 0.4;
            }

            // Sky beam pillar
            const beam = beacon.children[2] as THREE.Mesh;
            if (beam) {
              (beam.material as THREE.MeshBasicMaterial).color.setHex(bHex);
              (beam.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
            }
          } else {
            beacon.visible = false;
          }
        }

        // Dynamic 3rd Person Follow Camera
        const speedRatio = Math.min(1.0, Math.abs(physicsEngine.speed) / 35);
        const isCarOrTruck = vehicleConfig.type === 'car' || vehicleConfig.type === 'cargo';
        const baseCamDist = isCarOrTruck ? 8.2 : 6.8;
        const baseCamHeight = isCarOrTruck ? 3.6 : 3.2;
        const camDist = baseCamDist + speedRatio * 2.5;
        const camHeight = baseCamHeight + speedRatio * 0.8;

        const targetCamX = physicsEngine.position.x - Math.sin(physicsEngine.heading) * camDist;
        const targetCamZ = physicsEngine.position.z - Math.cos(physicsEngine.heading) * camDist;
        const targetCamY = physicsEngine.position.y + camHeight;

        currentCamPos.x = THREE.MathUtils.damp(currentCamPos.x, targetCamX, 6, dt);
        currentCamPos.y = THREE.MathUtils.damp(currentCamPos.y, targetCamY, 6, dt);
        currentCamPos.z = THREE.MathUtils.damp(currentCamPos.z, targetCamZ, 6, dt);
        camera.position.copy(currentCamPos);

        const lookTarget = new THREE.Vector3(
          physicsEngine.position.x + Math.sin(physicsEngine.heading) * 4,
          physicsEngine.position.y + 1.4,
          physicsEngine.position.z + Math.cos(physicsEngine.heading) * 4
        );
        currentLookAt.lerp(lookTarget, 0.1);
        camera.lookAt(currentLookAt);

        // Adjust FOV based on speed
        camera.fov = THREE.MathUtils.damp(camera.fov, 65 + speedRatio * 15, 4, dt);
        camera.updateProjectionMatrix();

      } else {
        // Title Screen / Garage / Paused: Cinematic rotating camera pan
        titleCamAngle += dt * 0.35;
        const radius = 24;
        const cx = Math.sin(titleCamAngle) * radius;
        const cz = Math.cos(titleCamAngle) * radius + 30;
        camera.position.set(cx, 8, cz);
        camera.lookAt(0, 1.2, 30);

        if (navArrowRef.current) {
          navArrowRef.current.visible = false;
        }

        if (activeBeaconRef.current) {
          activeBeaconRef.current.visible = false;
        }

        if (vehiclePartsRef.current) {
          vehiclePartsRef.current.rearWheel.rotation.x += dt * 2.0;
        }
      }

      // Rotate subtle curbside landmark rings gently
      world.interactiveLandmarks.forEach((lmGroup) => {
        const ring = lmGroup.children[0];
        if (ring) {
          ring.rotation.z += dt * 0.5;
        }
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none touch-none"
    />
  );
};
