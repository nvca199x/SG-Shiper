import * as THREE from 'three';
import { VehicleConfig, VehicleCustomization } from '../types/game';
import { HEADLIGHT_OPTIONS, UNDERGLOW_OPTIONS } from './constants';

export interface VehicleParts {
  group: THREE.Group;
  frontWheel: THREE.Object3D;
  rearWheel: THREE.Object3D;
  frontFork: THREE.Object3D;
  headlightMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  boxMesh: THREE.Mesh;
  headlightLight?: THREE.SpotLight;
  exhaustPipe?: THREE.Object3D;
  underglowLight?: THREE.PointLight;
  flagMesh?: THREE.Mesh;
}

// Procedural Canvas Decal Texture Generator (Zero external textures!)
function createDecalTexture(decalType: string, baseHex: string): THREE.CanvasTexture | null {
  if (decalType === 'none') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  if (decalType === 'racing_stripes') {
    // Twin GT racing stripes in center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(210, 0, 36, 512);
    ctx.fillRect(266, 0, 36, 512);
    // Dark pin stripes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(198, 0, 8, 512);
    ctx.fillRect(306, 0, 8, 512);

  } else if (decalType === 'dragon_flames') {
    // Gradient fire flames along sides
    const gradient = ctx.createLinearGradient(0, 512, 0, 0);
    gradient.addColorStop(0, '#dc2626');
    gradient.addColorStop(0.5, '#f97316');
    gradient.addColorStop(1, '#fde047');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(50, 512);
    ctx.quadraticCurveTo(80, 280, 140, 200);
    ctx.quadraticCurveTo(160, 310, 220, 140);
    ctx.quadraticCurveTo(250, 280, 320, 120);
    ctx.quadraticCurveTo(360, 320, 420, 240);
    ctx.quadraticCurveTo(460, 380, 480, 512);
    ctx.closePath();
    ctx.fill();

  } else if (decalType === 'delivery_fast') {
    // Lightning bolt & "SUPER SHIPPER" typography
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(270, 60);
    ctx.lineTo(210, 250);
    ctx.lineTo(280, 250);
    ctx.lineTo(230, 450);
    ctx.lineTo(320, 220);
    ctx.lineTo(260, 220);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXPRESS', 256, 490);

  } else if (decalType === 'cyber_circuit') {
    // Cyberpunk neon circuits
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(80, 60);
    ctx.lineTo(80, 220);
    ctx.lineTo(200, 340);
    ctx.lineTo(440, 340);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(440, 100);
    ctx.lineTo(340, 100);
    ctx.lineTo(260, 180);
    ctx.lineTo(120, 180);
    ctx.stroke();

    // Circuit nodes
    ctx.fillStyle = '#38bdf8';
    [ [80, 60], [440, 340], [440, 100], [120, 180] ].forEach(([nx, ny]) => {
      ctx.beginPath();
      ctx.arc(nx, ny, 16, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (decalType === 'carbon_fiber') {
    // 3D carbon weave pattern
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#0f172a';
    for (let x = 0; x < 512; x += 16) {
      for (let y = 0; y < 512; y += 16) {
        if ((x + y) % 32 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function buildProceduralVehicle(
  config: VehicleConfig,
  customization?: VehicleCustomization
): VehicleParts {
  const root = new THREE.Group();
  root.name = `vehicle_${config.id}`;

  const primaryHex = customization?.primaryColor || config.color;
  const secondaryHex = customization?.secondaryColor || '#1e293b';
  const rimHex = customization?.rimColor || '#e2e8f0';

  const primaryColor = new THREE.Color(primaryHex);
  const secondaryColor = new THREE.Color(secondaryHex);
  const rimColor = new THREE.Color(rimHex);
  const boxColor = new THREE.Color(config.boxColor);

  // Decal texture on body panels
  const decalTexture = customization
    ? createDecalTexture(customization.decal, primaryHex)
    : null;

  // Materials
  const paintMaterial = new THREE.MeshStandardMaterial({
    color: decalTexture ? 0xffffff : primaryColor,
    map: decalTexture || null,
    roughness: customization?.decal === 'carbon_fiber' ? 0.6 : 0.25,
    metalness: customization?.decal === 'carbon_fiber' ? 0.2 : 0.35,
  });

  const secondaryPaintMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.3,
    metalness: 0.4,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: rimColor,
    metalness: 0.85,
    roughness: 0.18,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.15,
  });

  const blackPlasticMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.1,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Custom Headlight color
  const hlConfig = HEADLIGHT_OPTIONS.find((h) => h.id === customization?.headlight) || HEADLIGHT_OPTIONS[0];
  const hlColor = new THREE.Color(hlConfig.hex);

  const emissiveHeadlight = new THREE.MeshStandardMaterial({
    color: hlColor,
    emissive: hlColor,
    emissiveIntensity: 1.6,
    roughness: 0.15,
  });

  const emissiveTaillight = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff2222,
    emissiveIntensity: 1.5,
    roughness: 0.3,
  });

  const boxMaterial = new THREE.MeshStandardMaterial({
    color: boxColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  const isTruck = config.type === 'cargo';
  const isCar = config.type === 'car';

  // Wheel builder helper
  const createWheel = (radius: number, width: number) => {
    const wheelGroup = new THREE.Group();
    // Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMaterial);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 1.05, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMaterial);
    wheelGroup.add(rim);

    // Hub cap / Spokes
    const hubGeo = new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, width * 1.15, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, blackPlasticMaterial);
    wheelGroup.add(hub);

    return wheelGroup;
  };

  let frontWheel: THREE.Object3D;
  let rearWheel: THREE.Object3D;
  let frontFork: THREE.Object3D;
  let headlightMesh: THREE.Mesh;
  let bodyMesh: THREE.Mesh;
  let boxMesh: THREE.Mesh;
  let exhaustPipe: THREE.Object3D | undefined;
  let underglowLight: THREE.PointLight | undefined;
  let flagMesh: THREE.Mesh | undefined;

  if (isTruck) {
    // 3-Wheeled Cargo Van / Lambro
    const bodyGeo = new THREE.BoxGeometry(1.8, 1.4, 3.2);
    bodyMesh = new THREE.Mesh(bodyGeo, paintMaterial);
    bodyMesh.position.set(0, 1.1, -0.2);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Cab glass
    const glassGeo = new THREE.BoxGeometry(1.65, 0.65, 1.1);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.45, 0.7);
    root.add(glass);

    // Front bumper
    const bumperGeo = new THREE.BoxGeometry(1.85, 0.35, 0.3);
    const bumper = new THREE.Mesh(bumperGeo, secondaryPaintMat);
    bumper.position.set(0, 0.5, 1.45);
    root.add(bumper);

    // Big Cargo Box at rear
    const cargoGeo = new THREE.BoxGeometry(1.9, 1.6, 2.0);
    boxMesh = new THREE.Mesh(cargoGeo, boxMaterial);
    boxMesh.position.set(0, 1.3, -1.0);
    boxMesh.castShadow = true;
    root.add(boxMesh);

    // Wheels
    frontWheel = createWheel(0.42, 0.35);
    frontWheel.position.set(0, 0.42, 1.25);
    frontFork = new THREE.Group();
    frontFork.position.set(0, 0, 1.25);
    frontFork.add(frontWheel);
    root.add(frontFork);

    rearWheel = new THREE.Group();
    const leftWheel = createWheel(0.42, 0.35);
    leftWheel.position.set(-0.85, 0.42, -0.9);
    const rightWheel = createWheel(0.42, 0.35);
    rightWheel.position.set(0.85, 0.42, -0.9);
    (rearWheel as THREE.Group).add(leftWheel, rightWheel);
    root.add(rearWheel);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
    headlightMesh = new THREE.Mesh(hlGeo, emissiveHeadlight);
    headlightMesh.position.set(0.6, 0.9, 1.42);
    const hlLeft = headlightMesh.clone();
    hlLeft.position.x = -0.6;
    root.add(headlightMesh, hlLeft);

  } else if (isCar) {
    // 4-Wheeled Car / Electric Hatchback / Sports Sedan / Super Pickup
    const wheelRadius = 0.38;
    const wheelWidth = 0.28;

    // 1. Lower Chassis & Aerodynamic Floor
    const chassisGeo = new THREE.BoxGeometry(1.72, 0.26, 3.2);
    const chassis = new THREE.Mesh(chassisGeo, blackPlasticMaterial);
    chassis.position.set(0, 0.38, 0);
    root.add(chassis);

    // 2. Main Car Body Shell (Paint + Decal)
    const bodyGeo = new THREE.BoxGeometry(1.78, 0.58, 3.1);
    bodyMesh = new THREE.Mesh(bodyGeo, paintMaterial);
    bodyMesh.position.set(0, 0.72, -0.05);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // 3. Front Hood Slope & Grille
    const hoodGeo = new THREE.BoxGeometry(1.72, 0.22, 1.05);
    const hood = new THREE.Mesh(hoodGeo, paintMaterial);
    hood.position.set(0, 0.82, 0.95);
    root.add(hood);

    const grilleGeo = new THREE.BoxGeometry(1.2, 0.24, 0.1);
    const grille = new THREE.Mesh(grilleGeo, blackPlasticMaterial);
    grille.position.set(0, 0.62, 1.52);
    root.add(grille);

    // Front Bumper Lower Skirt
    const bumperGeo = new THREE.BoxGeometry(1.82, 0.3, 0.25);
    const bumper = new THREE.Mesh(bumperGeo, secondaryPaintMat);
    bumper.position.set(0, 0.42, 1.5);
    root.add(bumper);

    // 4. Cabin Greenhouse (Pillars & Tinted Glass)
    const glassGeo = new THREE.BoxGeometry(1.58, 0.58, 1.7);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.85,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.25, -0.25);
    root.add(glass);

    // Roof Cap
    const roofGeo = new THREE.BoxGeometry(1.62, 0.08, 1.6);
    const roof = new THREE.Mesh(roofGeo, paintMaterial);
    roof.position.set(0, 1.56, -0.25);
    root.add(roof);

    // 5. Dual Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.18, 0.12, 0.08);
    const leftMirror = new THREE.Mesh(mirrorGeo, secondaryPaintMat);
    leftMirror.position.set(-0.95, 1.12, 0.45);
    const rightMirror = new THREE.Mesh(mirrorGeo, secondaryPaintMat);
    rightMirror.position.set(0.95, 1.12, 0.45);
    root.add(leftMirror, rightMirror);

    // 6. Wheels (4-Wheeled Car)
    // Front wheels attached to frontFork so steering rotates them around Y,
    // while their child wheels rotate around X with wheelRotation!
    frontFork = new THREE.Group();
    frontFork.position.set(0, 0, 1.05);

    const frontWheelGroup = new THREE.Group();
    const leftFW = createWheel(wheelRadius, wheelWidth);
    leftFW.position.set(-0.88, wheelRadius, 0);
    const rightFW = createWheel(wheelRadius, wheelWidth);
    rightFW.position.set(0.88, wheelRadius, 0);
    frontWheelGroup.add(leftFW, rightFW);

    frontWheel = frontWheelGroup;
    frontFork.add(frontWheel);
    root.add(frontFork);

    // Rear wheels
    rearWheel = new THREE.Group();
    rearWheel.position.set(0, 0, -1.05);
    const leftRW = createWheel(wheelRadius, wheelWidth);
    leftRW.position.set(-0.88, wheelRadius, 0);
    const rightRW = createWheel(wheelRadius, wheelWidth);
    rightRW.position.set(0.88, wheelRadius, 0);
    (rearWheel as THREE.Group).add(leftRW, rightRW);
    root.add(rearWheel);

    // 7. Delivery Box / Cargo Roof Pod
    // Aerodynamic roof rails & express delivery container
    const railGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6);
    railGeo.rotateX(Math.PI / 2);
    const leftRail = new THREE.Mesh(railGeo, chromeMaterial);
    leftRail.position.set(-0.65, 1.62, -0.25);
    const rightRail = new THREE.Mesh(railGeo, chromeMaterial);
    rightRail.position.set(0.65, 1.62, -0.25);
    root.add(leftRail, rightRail);

    const cargoPodGeo = new THREE.BoxGeometry(1.15, 0.42, 1.35);
    boxMesh = new THREE.Mesh(cargoPodGeo, boxMaterial);
    boxMesh.position.set(0, 1.82, -0.25);
    boxMesh.castShadow = true;
    root.add(boxMesh);

    // 8. Headlights (Dual Modern LED Headlights)
    const hlGeo = new THREE.BoxGeometry(0.32, 0.16, 0.1);
    headlightMesh = new THREE.Mesh(hlGeo, emissiveHeadlight);
    headlightMesh.position.set(0.62, 0.76, 1.52);
    const hlLeft = headlightMesh.clone();
    hlLeft.position.x = -0.62;
    root.add(headlightMesh, hlLeft);

    // Dual Taillights
    const tlGeo = new THREE.BoxGeometry(0.34, 0.14, 0.08);
    const tlRight = new THREE.Mesh(tlGeo, emissiveTaillight);
    tlRight.position.set(0.62, 0.78, -1.61);
    const tlLeft = new THREE.Mesh(tlGeo, emissiveTaillight);
    tlLeft.position.set(-0.62, 0.78, -1.61);
    root.add(tlRight, tlLeft);

    // 9. Driver sitting inside the cabin
    const driverGroup = new THREE.Group();
    driverGroup.position.set(-0.38, 0.95, -0.05);

    const driverMat = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.6 });
    const driverTorso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.22), driverMat);
    driverTorso.position.set(0, 0.28, 0);
    driverGroup.add(driverTorso);

    const driverHelmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.3, metalness: 0.4 })
    );
    driverHelmet.position.set(0, 0.6, 0.05);
    driverGroup.add(driverHelmet);

    // Steering wheel
    const steerWheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.02, 6, 14),
      blackPlasticMaterial
    );
    steerWheel.position.set(0, 0.38, 0.32);
    steerWheel.rotation.x = -Math.PI / 4;
    driverGroup.add(steerWheel);

    root.add(driverGroup);

    // 10. Front Bumper Upgrade (Bullbar / Crash Cage)
    if (customization?.bumper && customization.bumper !== 'none') {
      const carBullbarGeo = new THREE.BoxGeometry(1.88, 0.42, 0.2);
      const carBullbarMat = new THREE.MeshStandardMaterial({
        color: customization.bumper === 'heavy_bullbar' ? 0xd97706 : 0x0f172a,
        metalness: 0.8,
        roughness: 0.25,
      });
      const carBullbar = new THREE.Mesh(carBullbarGeo, carBullbarMat);
      carBullbar.position.set(0, 0.52, 1.62);
      root.add(carBullbar);
    }

    // 11. Dual Sport Exhaust Pipes
    const exhaustType = customization?.exhaust || 'stock';
    let exMat = chromeMaterial;
    if (exhaustType === 'carbon_race') {
      exMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
    } else if (exhaustType === 'titanium_flame') {
      exMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.95 });
    }

    const exGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.3, 10);
    exGeo.rotateX(Math.PI / 2);
    const exRight = new THREE.Mesh(exGeo, exMat);
    exRight.position.set(0.55, 0.34, -1.62);
    const exLeft = new THREE.Mesh(exGeo, exMat);
    exLeft.position.set(-0.55, 0.34, -1.62);
    exhaustPipe = exRight;
    root.add(exRight, exLeft);

    // 12. Flag
    if (customization?.flag && customization.flag !== 'none') {
      const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(0.68, 1.8, -1.45);
      root.add(pole);

      const flagGeo = new THREE.PlaneGeometry(0.35, 0.24);
      let flagMat: THREE.Material;

      if (customization.flag === 'vietnam_flag') {
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = 128;
        flagCanvas.height = 80;
        const fctx = flagCanvas.getContext('2d')!;
        fctx.fillStyle = '#da251d';
        fctx.fillRect(0, 0, 128, 80);
        fctx.fillStyle = '#ffff00';
        fctx.font = 'bold 40px sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('★', 64, 54);
        const fTex = new THREE.CanvasTexture(flagCanvas);
        fTex.colorSpace = THREE.SRGBColorSpace;
        flagMat = new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide });
      } else if (customization.flag === 'shipper_vip') {
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = 128;
        flagCanvas.height = 80;
        const fctx = flagCanvas.getContext('2d')!;
        fctx.fillStyle = '#0f172a';
        fctx.fillRect(0, 0, 128, 80);
        fctx.fillStyle = '#f59e0b';
        fctx.font = 'bold 22px sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('VIP 5★', 64, 48);
        const fTex = new THREE.CanvasTexture(flagCanvas);
        fTex.colorSpace = THREE.SRGBColorSpace;
        flagMat = new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide });
      } else {
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = 128;
        flagCanvas.height = 80;
        const fctx = flagCanvas.getContext('2d')!;
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0, 0, 128, 80);
        fctx.fillStyle = '#000000';
        for (let x = 0; x < 128; x += 16) {
          for (let y = 0; y < 80; y += 16) {
            if ((x + y) % 32 === 0) fctx.fillRect(x, y, 16, 16);
          }
        }
        const fTex = new THREE.CanvasTexture(flagCanvas);
        fTex.colorSpace = THREE.SRGBColorSpace;
        flagMat = new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide });
      }

      flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(0.86, 2.25, -1.45);
      root.add(flagMesh);
    }
  } else {
    // 2-Wheeled Scooter / Underbone / Electric
    const wheelRadius = 0.35;
    const wheelWidth = 0.16;

    // 1. Streamlined Tubular Frame & Engine Block (Realistic motorcycle chassis)
    const frameGroup = new THREE.Group();
    const tubeGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.15, 8);
    tubeGeo.rotateX(Math.PI / 2);
    const mainTube = new THREE.Mesh(tubeGeo, blackPlasticMaterial);
    mainTube.position.set(0, 0.42, -0.05);
    frameGroup.add(mainTube);

    // Compact engine / battery block
    const engineGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.28, 8);
    engineGeo.rotateZ(Math.PI / 2);
    const engineBlock = new THREE.Mesh(engineGeo, chromeMaterial);
    engineBlock.position.set(0, 0.38, -0.2);
    frameGroup.add(engineBlock);

    // Foot pegs / Floor rest
    const pegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.52, 6);
    pegGeo.rotateZ(Math.PI / 2);
    const footPegs = new THREE.Mesh(pegGeo, blackPlasticMaterial);
    footPegs.position.set(0, 0.32, 0.18);
    frameGroup.add(footPegs);

    root.add(frameGroup);

    // 2. Body Shell / Cowling
    const bodyGeo = new THREE.BoxGeometry(0.48, 0.52, 0.95);
    bodyMesh = new THREE.Mesh(bodyGeo, paintMaterial);
    bodyMesh.position.set(0, 0.68, -0.22);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // 3. Seat
    const seatGeo = new THREE.BoxGeometry(0.38, 0.14, 0.78);
    const seat = new THREE.Mesh(seatGeo, blackPlasticMaterial);
    seat.position.set(0, 0.94, -0.15);
    root.add(seat);

    // 4. Front Apron / Cowl
    const cowlGeo = new THREE.BoxGeometry(0.44, 0.65, 0.28);
    const cowl = new THREE.Mesh(cowlGeo, paintMaterial);
    cowl.position.set(0, 0.78, 0.65);
    cowl.rotation.x = -0.2;
    cowl.castShadow = true;
    root.add(cowl);

    // 5. Front Fork & Handlebars
    frontFork = new THREE.Group();
    frontFork.position.set(0, 0.5, 0.75);

    // Fork tubes
    const forkTubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8);
    const leftFork = new THREE.Mesh(forkTubeGeo, chromeMaterial);
    leftFork.position.set(-0.14, 0, 0);
    const rightFork = new THREE.Mesh(forkTubeGeo, chromeMaterial);
    rightFork.position.set(0.14, 0, 0);
    frontFork.add(leftFork, rightFork);

    // Handlebars
    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8);
    barGeo.rotateZ(Math.PI / 2);
    const bars = new THREE.Mesh(barGeo, chromeMaterial);
    bars.position.set(0, 0.58, 0.02);
    frontFork.add(bars);

    // Grips
    const gripGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.15, 8);
    gripGeo.rotateZ(Math.PI / 2);
    const leftGrip = new THREE.Mesh(gripGeo, blackPlasticMaterial);
    leftGrip.position.set(-0.35, 0.58, 0.02);
    const rightGrip = leftGrip.clone();
    rightGrip.position.x = 0.35;
    frontFork.add(leftGrip, rightGrip);

    // Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.1, 0.06, 0.02);
    const leftMirror = new THREE.Mesh(mirrorGeo, blackPlasticMaterial);
    leftMirror.position.set(-0.32, 0.72, 0.06);
    const rightMirror = leftMirror.clone();
    rightMirror.position.x = 0.32;
    frontFork.add(leftMirror, rightMirror);

    // Optional Windshield
    if (customization?.windshield && customization.windshield !== 'none') {
      const wsHeight = customization.windshield === 'touring_clear' ? 0.42 : 0.28;
      const wsGeo = new THREE.PlaneGeometry(0.38, wsHeight);
      wsGeo.rotateX(-0.3);
      const wsMat = new THREE.MeshStandardMaterial({
        color: customization.windshield === 'sport_smoke' ? 0x0f172a : 0xe0f2fe,
        transparent: true,
        opacity: customization.windshield === 'sport_smoke' ? 0.75 : 0.35,
        roughness: 0.1,
        metalness: 0.8,
        side: THREE.DoubleSide,
      });
      const wsMesh = new THREE.Mesh(wsGeo, wsMat);
      wsMesh.position.set(0, 0.76, 0.08);
      frontFork.add(wsMesh);
    }

    // Front Wheel
    frontWheel = createWheel(wheelRadius, wheelWidth);
    frontWheel.position.set(0, -0.15, 0.08);
    frontFork.add(frontWheel);

    root.add(frontFork);

    // Rear Wheel
    rearWheel = createWheel(wheelRadius, wheelWidth);
    rearWheel.position.set(0, 0.35, -0.72);
    root.add(rearWheel);

    // 6. Delivery Box on Rear Rack
    const boxGeo = new THREE.BoxGeometry(0.58, 0.52, 0.54);
    boxMesh = new THREE.Mesh(boxGeo, boxMaterial);
    boxMesh.position.set(0, 1.15, -0.72);
    boxMesh.castShadow = true;
    root.add(boxMesh);

    // 7. Headlight
    const hlGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12);
    hlGeo.rotateX(Math.PI / 2);
    headlightMesh = new THREE.Mesh(hlGeo, emissiveHeadlight);
    headlightMesh.position.set(0, 0.88, 0.78);
    root.add(headlightMesh);

    // 8. Custom Exhaust Pipe
    if (config.type !== 'electric') {
      const exhaustType = customization?.exhaust || 'stock';
      let exMat = chromeMaterial;

      if (exhaustType === 'carbon_race') {
        exMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
      } else if (exhaustType === 'titanium_flame') {
        // Rainbow titanium khò lửa
        exMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.95 });
      }

      const exhaustGeo = new THREE.CylinderGeometry(0.048, 0.062, 0.68, 10);
      exhaustGeo.rotateX(Math.PI / 2);
      exhaustPipe = new THREE.Mesh(exhaustGeo, exMat);
      exhaustPipe.position.set(0.24, 0.32, -0.58);
      exhaustPipe.rotation.y = 0.08;
      root.add(exhaustPipe);

      // Blue flame titanium tip
      if (exhaustType === 'titanium_flame') {
        const tipGeo = new THREE.CylinderGeometry(0.052, 0.064, 0.15, 10);
        tipGeo.rotateX(Math.PI / 2);
        const tipMat = new THREE.MeshStandardMaterial({
          color: 0x818cf8,
          emissive: 0x6366f1,
          emissiveIntensity: 0.8,
        });
        const tipMesh = new THREE.Mesh(tipGeo, tipMat);
        tipMesh.position.set(0.24, 0.32, -0.88);
        root.add(tipMesh);
      }
    }

    // 9. Front Bumper / Crash Cage
    if (customization?.bumper && customization.bumper !== 'none') {
      const bumperBarGeo = new THREE.TorusGeometry(0.32, 0.03, 8, 16, Math.PI);
      const bumperBarMat = new THREE.MeshStandardMaterial({
        color: customization.bumper === 'heavy_bullbar' ? 0xd97706 : 0x0f172a,
        metalness: 0.8,
        roughness: 0.25,
      });
      const bumperMesh = new THREE.Mesh(bumperBarGeo, bumperBarMat);
      bumperMesh.position.set(0, 0.55, 0.72);
      bumperMesh.rotation.x = Math.PI / 2;
      root.add(bumperMesh);
    }

    // 10. Rider Figure (Vietnamese Shipper)
    const riderGroup = new THREE.Group();
    riderGroup.position.set(0, 0.95, -0.1);

    const jacketMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.6,
    });
    const torsoGeo = new THREE.BoxGeometry(0.36, 0.5, 0.25);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.set(0, 0.38, 0);
    torso.rotation.x = 0.15;
    torso.castShadow = true;
    riderGroup.add(torso);

    const helmetGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const helmetMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.3,
      metalness: 0.4,
    });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 0.72, 0.06);
    helmet.castShadow = true;
    riderGroup.add(helmet);

    const visorGeo = new THREE.BoxGeometry(0.22, 0.08, 0.1);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.7, 0.18);
    riderGroup.add(visor);

    const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6);
    armGeo.rotateX(Math.PI / 3.2);

    const leftArm = new THREE.Mesh(armGeo, jacketMat);
    leftArm.position.set(-0.22, 0.42, 0.22);
    leftArm.rotation.z = -0.25;

    const rightArm = new THREE.Mesh(armGeo, jacketMat);
    rightArm.position.set(0.22, 0.42, 0.22);
    rightArm.rotation.z = 0.25;

    riderGroup.add(leftArm, rightArm);
    root.add(riderGroup);

    // 11. Optional Antenna Flag on Rear Rack
    if (customization?.flag && customization.flag !== 'none') {
      const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(0.26, 1.4, -0.95);
      root.add(pole);

      const flagGeo = new THREE.PlaneGeometry(0.35, 0.24);
      let flagMat: THREE.Material;

      if (customization.flag === 'vietnam_flag') {
        // Red flag with gold star
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = 128;
        flagCanvas.height = 80;
        const fctx = flagCanvas.getContext('2d')!;
        fctx.fillStyle = '#da251d';
        fctx.fillRect(0, 0, 128, 80);
        fctx.fillStyle = '#ffff00';
        fctx.font = 'bold 40px sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('★', 64, 54);
        const fTex = new THREE.CanvasTexture(flagCanvas);
        fTex.colorSpace = THREE.SRGBColorSpace;
        flagMat = new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide });
      } else if (customization.flag === 'shipper_vip') {
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = 128;
        flagCanvas.height = 80;
        const fctx = flagCanvas.getContext('2d')!;
        fctx.fillStyle = '#0f172a';
        fctx.fillRect(0, 0, 128, 80);
        fctx.fillStyle = '#f59e0b';
        fctx.font = 'bold 22px sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('VIP 5★', 64, 48);
        const fTex = new THREE.CanvasTexture(flagCanvas);
        fTex.colorSpace = THREE.SRGBColorSpace;
        flagMat = new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide });
      } else {
        // Checkered racing flag
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = 128;
        flagCanvas.height = 80;
        const fctx = flagCanvas.getContext('2d')!;
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0, 0, 128, 80);
        fctx.fillStyle = '#000000';
        for (let x = 0; x < 128; x += 16) {
          for (let y = 0; y < 80; y += 16) {
            if ((x + y) % 32 === 0) fctx.fillRect(x, y, 16, 16);
          }
        }
        const fTex = new THREE.CanvasTexture(flagCanvas);
        fTex.colorSpace = THREE.SRGBColorSpace;
        flagMat = new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide });
      }

      flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(0.44, 1.95, -0.95);
      root.add(flagMesh);
    }
  }

  // 12. Headlight SpotLight Beam
  const beamDist = hlConfig.beamRange;
  const headlightLight = new THREE.SpotLight(hlColor, 2.8, beamDist, Math.PI / 4.8, 0.35, 1.2);
  headlightLight.position.set(0, 0.9, 0.8);
  const target = new THREE.Object3D();
  target.position.set(0, 0.1, 15);
  root.add(target);
  headlightLight.target = target;
  root.add(headlightLight);

  // 13. Neon Underglow Ground Lighting (Realistic soft lighting, no rectangular mesh)
  if (customization?.underglow && customization.underglow !== 'none') {
    const ugOption = UNDERGLOW_OPTIONS.find((u) => u.id === customization.underglow);
    if (ugOption && ugOption.hex !== 'transparent') {
      const ugColor = new THREE.Color(ugOption.hex);
      // Soft PointLight under chassis illuminates the ground naturally
      underglowLight = new THREE.PointLight(ugColor, 2.2, 4.0, 1.8);
      underglowLight.position.set(0, 0.25, 0);
      root.add(underglowLight);
    }
  }

  root.scale.set(config.scale[0], config.scale[1], config.scale[2]);

  return {
    group: root,
    frontWheel,
    rearWheel,
    frontFork,
    headlightMesh,
    bodyMesh,
    boxMesh,
    headlightLight,
    exhaustPipe,
    underglowLight,
    flagMesh,
  };
}
