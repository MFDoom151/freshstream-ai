'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * 1. Apple-Grade Parametric 64x64 Organic Pear BufferGeometry
 * 5-lobed natural carpellary modulation, organic belly slant, concave calyx and stem basin.
 */
export function createOrganicPearGeometry(): THREE.BufferGeometry {
  const vSegments = 64; // vertical slices
  const uSegments = 64; // radial sectors
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= vSegments; i++) {
    const v = i / vSegments; // 0.0 (calyx bottom) to 1.0 (stem top)
    const y = (v - 0.5) * 2.7; // -1.35 to +1.35

    // Realistic, organic pear profile radius curve R(v) — continuously differentiable C1
    let baseR = 0;
    if (v < 0.06) {
      // Calyx bottom cavity indent
      baseR = Math.sin((v / 0.06) * (Math.PI * 0.5)) * 0.42;
    } else if (v < 0.52) {
      // Bulbous lower body (smoothly swells from 0.42 at v=0.06 to peak ~1.27 at v=0.30, tapering to 0.85 at v=0.52)
      const t = (v - 0.06) / 0.46;
      baseR = (0.42 + 0.43 * t) + Math.sin(t * Math.PI) * 0.68 * (1.0 - 0.15 * t);
    } else if (v < 0.72) {
      // Graceful waist transition tapering into the neck (C1 Hermite interpolation from 0.85 down to 0.48)
      const s = (v - 0.52) / 0.20;
      baseR = 0.85 - 0.6026 * s + 0.2691 * s * s - 0.0365 * s * s * s;
    } else if (v < 0.95) {
      // Slender conical neck
      const t = (v - 0.72) / 0.23;
      baseR = THREE.MathUtils.lerp(0.48, 0.28, t);
    } else {
      // Top stem basin indent
      const t = (v - 0.95) / 0.05;
      baseR = THREE.MathUtils.lerp(0.28, 0.12, Math.sin(t * Math.PI * 0.5));
    }

    // Natural belly tilt offset (asymmetry along X)
    const xBellyOffset = Math.sin(v * Math.PI) * 0.07;

    for (let j = 0; j <= uSegments; j++) {
      const u = j / uSegments;
      const angle = u * Math.PI * 2;

      // 5-lobed natural carpel cross-section modulation
      const lobeMod = 1.0 + 0.035 * Math.cos(5 * angle) * (1.0 - v * 0.7);
      // Gentle elliptical variance
      const rX = baseR * lobeMod * 1.02;
      const rZ = baseR * lobeMod * 0.98;

      const px = Math.cos(angle) * rX + xBellyOffset;
      const py = y;
      const pz = Math.sin(angle) * rZ;

      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  // Generate triangle faces
  for (let i = 0; i < vSegments; i++) {
    for (let j = 0; j < uSegments; j++) {
      const a = i * (uSegments + 1) + j;
      const b = (i + 1) * (uSegments + 1) + j;
      const c = (i + 1) * (uSegments + 1) + (j + 1);
      const d = i * (uSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * 2. Curved 3D Leaf Geometry with Central Midrib Crease
 */
export function createCurvedLeafGeometry(): THREE.BufferGeometry {
  const uSegments = 24; // across width
  const vSegments = 32; // along length
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= vSegments; i++) {
    const v = i / vSegments; // 0.0 (base) to 1.0 (tip)
    // Leaf profile width (tear/elliptical shape)
    const maxWidth = Math.sin(v * Math.PI * 0.85) * 0.45;
    // Longitudinal arch: starts upwards, arches gracefully downwards
    const y = Math.sin(v * Math.PI * 0.5) * 0.85;
    const zArch = -Math.pow(v, 1.6) * 0.35;

    for (let j = 0; j <= uSegments; j++) {
      const u = j / uSegments; // 0.0 (left) to 1.0 (right)
      const uCentered = (u - 0.5) * 2.0; // -1.0 to +1.0
      const x = uCentered * maxWidth;

      // Transverse V-crease along midrib (uCentered = 0)
      const midribCrease = (1.0 - Math.abs(uCentered)) * 0.08;
      const z = zArch + midribCrease;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < vSegments; i++) {
    for (let j = 0; j < uSegments; j++) {
      const a = i * (uSegments + 1) + j;
      const b = (i + 1) * (uSegments + 1) + j;
      const c = (i + 1) * (uSegments + 1) + (j + 1);
      const d = i * (uSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * 3. GLSL Vertex Shader for Biological Rot & AI Digital Twin Recovery
 */
export const pearVertexShader = `
  uniform float uTime;
  uniform float uDecay;         // 0.0 (fresh) -> 1.0 (fully rotten)
  uniform float uRestoration;   // 0.0 -> 1.0 (bio-twin time-reversal wave)

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vRotMask;
  varying float vDisplacement;

  // Simplex 3D Noise utilities
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Localized necrotic lesion centers (cellular noise)
    float lesionNoise = snoise(position * 2.4 + vec3(0.0, 0.4, 1.2));
    float rotMask = smoothstep(0.1, 0.7, lesionNoise * 0.6 + (0.5 - uv.y * 0.3));
    vRotMask = rotMask * uDecay;

    // High-frequency epidermal dehydration wrinkles & sunken craters
    float fineWrinkles = snoise(position * 8.5) * 0.04;
    float deepCraters = snoise(position * 4.2) * 0.09;
    float totalDeform = (fineWrinkles + deepCraters * rotMask) * uDecay;

    // 10% volume loss during severe dehydration
    float volumeShrink = 1.0 - (uDecay * 0.10);
    vec3 displacedPos = (position * volumeShrink) - (normal * totalDeform);

    // Biological digital twin restoration sweep (restrained, elegant wave)
    if (uRestoration > 0.001) {
      float wave = sin((position.y * 3.5) - (uTime * 3.0));
      float pulse = smoothstep(0.6, 1.0, wave) * uRestoration * 0.02;
      displacedPos += normal * pulse;
    }

    vPosition = (modelViewMatrix * vec4(displacedPos, 1.0)).xyz;
    vDisplacement = totalDeform;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
  }
`;

/**
 * 4. GLSL Fragment Shader for Bartlett/Asian Dual Tone, Lesions, Mold & Recovery
 */
export const pearFragmentShader = `
  uniform float uTime;
  uniform float uDecay;
  uniform float uRestoration;
  uniform vec3 uKeyLightPos;
  uniform vec3 uFillLightPos;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vRotMask;
  varying float vDisplacement;

  // Procedural 2D hash for micro-lenticel skin pores
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(-vPosition);
    vec3 L1 = normalize(uKeyLightPos - vPosition);
    vec3 L2 = normalize(uFillLightPos - vPosition);

    // 1. Fresh Asian/Bartlett Pear Pigments
    vec3 freshLime = vec3(0.50, 0.74, 0.24);    // Upper neck crisp green
    vec3 freshGolden = vec3(0.92, 0.78, 0.26);  // Lower body golden honey
    vec3 freshBlush = vec3(0.88, 0.42, 0.18);   // Delicate sun-kissed peach

    vec3 baseFresh = mix(freshLime, freshGolden, clamp(1.0 - vUv.y * 0.8, 0.0, 1.0));
    // Sun-kissed angular blush on one flank
    float blushFactor = smoothstep(0.3, 0.8, dot(N, vec3(0.5, 0.3, 0.7)));
    baseFresh = mix(baseFresh, freshBlush, blushFactor * 0.40);

    // Natural micro-lenticels (tiny skin freckles)
    float lenticels = step(0.91, hash21(vUv * 85.0)) * 0.14;
    baseFresh -= vec3(lenticels * 0.25, lenticels * 0.18, 0.0);

    // 2. Necrotic Decay & Mold Pigments
    vec3 haloBrown = vec3(0.38, 0.22, 0.08);      // Browning halo around lesions
    vec3 sunkenNecrotic = vec3(0.14, 0.07, 0.02); // Deep sunken rotten core
    vec3 moldVelvet = vec3(0.88, 0.90, 0.92);     // Velvety grayish-white mycelium fuzz

    // Composite necrotic lesions
    vec3 decayColor = mix(baseFresh, haloBrown, smoothstep(0.15, 0.55, vRotMask));
    decayColor = mix(decayColor, sunkenNecrotic, smoothstep(0.45, 0.85, vRotMask));

    // Velvety mold spores bloom at centers of deep decay
    float moldBloom = smoothstep(0.68, 0.95, vRotMask) * smoothstep(0.4, 0.8, uDecay);
    decayColor = mix(decayColor, moldVelvet, moldBloom * 0.85);

    vec3 albedo = mix(baseFresh, decayColor, uDecay);

    // 3. Apple-Grade PBR Lighting
    // Dual-source diffuse
    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0) * 0.45;
    vec3 diffuse = albedo * (diff1 * vec3(1.0, 0.98, 0.94) + diff2 * vec3(0.82, 0.90, 1.0) + 0.22);

    // Subsurface Scattering (SSS) approximation on fresh tissue
    vec3 sss = vec3(0.14, 0.18, 0.04) * max(0.0, dot(-N, L1) * 0.5 + 0.5) * (1.0 - uDecay);

    // Microfacet Specular Sheen (Fresh = waxy gloss; Rotten = dull matte)
    vec3 H1 = normalize(L1 + V);
    float shininess = mix(36.0, 4.0, uDecay);
    float specStrength = mix(0.38, 0.03, uDecay);
    float spec = pow(max(dot(N, H1), 0.0), shininess) * specStrength;

    // Studio Silhouette Rim
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 rim = vec3(0.98, 0.95, 0.85) * fresnel * mix(0.45, 0.10, uDecay);

    vec3 finalColor = diffuse + sss + spec + rim;

    // 4. Bio-Twin Time-Reversal Sweep (Subtle, elegant golden/mint wavefront)
    if (uRestoration > 0.001) {
      float waveFront = sin(vPosition.y * 5.0 - uTime * 4.0);
      float glow = smoothstep(0.85, 1.0, waveFront) * uRestoration;
      vec3 restorationGlow = vec3(0.10, 0.90, 0.55) * (glow * 0.6 + fresnel * 0.3);
      finalColor += restorationGlow;
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * 5. Smart Insulated Cold-Chain Carton Model
 */
export interface SmartCartonMeshResult {
  group: THREE.Group;
  flapLeft: THREE.Group;
  flapRight: THREE.Group;
  ledIndicator: THREE.Mesh;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

export function createSmartCartonMesh(): SmartCartonMeshResult {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Main carton outer shell
  const bodyGeo = new THREE.BoxGeometry(2.4, 2.0, 2.4);
  geometries.push(bodyGeo);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.15,
  });
  materials.push(bodyMat);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(bodyMesh);

  // Insulated silver reflective interior liner
  const linerGeo = new THREE.BoxGeometry(2.2, 1.8, 2.2);
  geometries.push(linerGeo);
  const linerMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.75,
  });
  materials.push(linerMat);
  const linerMesh = new THREE.Mesh(linerGeo, linerMat);
  linerMesh.position.y = 0.05;
  group.add(linerMesh);

  // Protective cushion foam bed at the bottom
  const foamGeo = new THREE.BoxGeometry(2.1, 0.4, 2.1);
  geometries.push(foamGeo);
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.05,
  });
  materials.push(foamMat);
  const foamMesh = new THREE.Mesh(foamGeo, foamMat);
  foamMesh.position.y = -0.7;
  group.add(foamMesh);

  // Flap Left Group (pivot at x = -1.2, y = 1.0)
  const flapLeft = new THREE.Group();
  flapLeft.position.set(-1.2, 1.0, 0);
  const flapGeo = new THREE.BoxGeometry(1.2, 0.06, 2.38);
  geometries.push(flapGeo);
  const flapMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.1,
  });
  materials.push(flapMat);
  const flapLeftMesh = new THREE.Mesh(flapGeo, flapMat);
  flapLeftMesh.position.set(0.6, 0, 0);
  flapLeft.add(flapLeftMesh);
  group.add(flapLeft);

  // Flap Right Group (pivot at x = 1.2, y = 1.0)
  const flapRight = new THREE.Group();
  flapRight.position.set(1.2, 1.0, 0);
  const flapRightMesh = new THREE.Mesh(flapGeo, flapMat);
  flapRightMesh.position.set(-0.6, 0, 0);
  flapRight.add(flapRightMesh);
  group.add(flapRight);

  // IoT Sensor Puck on carton front face (z = 1.24)
  const puckGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24);
  puckGeo.rotateX(Math.PI / 2);
  geometries.push(puckGeo);
  const puckMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.8,
  });
  materials.push(puckMat);
  const puckMesh = new THREE.Mesh(puckGeo, puckMat);
  puckMesh.position.set(0, 0, 1.24);
  group.add(puckMesh);

  // Mint IoT Indicator LED
  const ledGeo = new THREE.SphereGeometry(0.05, 16, 16);
  geometries.push(ledGeo);
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  materials.push(ledMat);
  const ledIndicator = new THREE.Mesh(ledGeo, ledMat);
  ledIndicator.position.set(0, 0, 1.29);
  group.add(ledIndicator);

  return {
    group,
    flapLeft,
    flapRight,
    ledIndicator,
    geometries,
    materials,
  };
}

/**
 * 6. Eurasian Refrigerated Semi-Trailer Truck Model
 */
export interface ReeferTruckMeshResult {
  group: THREE.Group;
  trailer: THREE.Mesh;
  cabin: THREE.Mesh;
  wheels: THREE.Mesh[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

export function createReeferTruckMesh(): ReeferTruckMeshResult {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const wheels: THREE.Mesh[] = [];

  const trailerLength = 7.2;
  const trailerHeight = 2.5;
  const trailerWidth = 2.3;

  // 1. Semi-Trailer Cargo Box
  const trailerGeo = new THREE.BoxGeometry(trailerLength, trailerHeight, trailerWidth);
  geometries.push(trailerGeo);
  const trailerMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.2,
  });
  materials.push(trailerMat);
  const trailer = new THREE.Mesh(trailerGeo, trailerMat);
  trailer.position.set(-1.1, 0.2, 0);
  group.add(trailer);

  // Dark aerodynamic chassis skirts
  const skirtGeo = new THREE.BoxGeometry(trailerLength * 0.95, 0.35, trailerWidth + 0.04);
  geometries.push(skirtGeo);
  const skirtMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
  });
  materials.push(skirtMat);
  const skirt = new THREE.Mesh(skirtGeo, skirtMat);
  skirt.position.set(-1.1, -1.0, 0);
  group.add(skirt);

  // 2. Thermo King Refrigeration Cooling Unit on front bulkhead
  const reeferUnitGeo = new THREE.BoxGeometry(0.5, 1.3, 1.8);
  geometries.push(reeferUnitGeo);
  const reeferUnitMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.65,
  });
  materials.push(reeferUnitMat);
  const reeferUnit = new THREE.Mesh(reeferUnitGeo, reeferUnitMat);
  reeferUnit.position.set(-1.1 - trailerLength / 2 - 0.25, 0.45, 0);
  group.add(reeferUnit);

  // Status LED on reefer unit
  const reeferLedGeo = new THREE.BoxGeometry(0.05, 0.12, 0.4);
  geometries.push(reeferLedGeo);
  const reeferLedMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.8,
  });
  materials.push(reeferLedMat);
  const reeferLed = new THREE.Mesh(reeferLedGeo, reeferLedMat);
  reeferLed.position.set(-1.1 - trailerLength / 2 - 0.51, 0.85, 0);
  group.add(reeferLed);

  // 3. Tractor Cabin (European Cab-Over Design)
  const cabinGeo = new THREE.BoxGeometry(2.3, 2.5, 2.3);
  geometries.push(cabinGeo);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.85,
  });
  materials.push(cabinMat);
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-1.1 - trailerLength / 2 - 1.65, 0.15, 0);
  group.add(cabin);

  // Aerodynamic roof spoiler
  const spoilerGeo = new THREE.BoxGeometry(1.6, 0.45, 2.2);
  geometries.push(spoilerGeo);
  const spoilerMesh = new THREE.Mesh(spoilerGeo, cabinMat);
  spoilerMesh.position.set(-1.1 - trailerLength / 2 - 1.45, 1.5, 0);
  group.add(spoilerMesh);

  // Curved windshield
  const windshieldGeo = new THREE.BoxGeometry(0.08, 0.95, 2.05);
  geometries.push(windshieldGeo);
  const windshieldMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.88,
  });
  materials.push(windshieldMat);
  const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
  windshield.position.set(-1.1 - trailerLength / 2 - 2.81, 0.65, 0);
  group.add(windshield);

  // Dual LED Headlights
  const headlightGeo = new THREE.BoxGeometry(0.08, 0.18, 0.32);
  geometries.push(headlightGeo);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.5,
  });
  materials.push(headlightMat);
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(-1.1 - trailerLength / 2 - 2.81, -0.6, 0.75);
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(-1.1 - trailerLength / 2 - 2.81, -0.6, -0.75);
  group.add(headlightL);
  group.add(headlightR);

  // 4. Wheels: 6 detailed rubber tires on silver alloy rims
  const wheelTireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 24);
  wheelTireGeo.rotateX(Math.PI / 2);
  geometries.push(wheelTireGeo);
  const wheelTireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
  });
  materials.push(wheelTireMat);

  const wheelRimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.36, 16);
  wheelRimGeo.rotateX(Math.PI / 2);
  geometries.push(wheelRimGeo);
  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.85,
  });
  materials.push(wheelRimMat);

  const wheelPositions: [number, number, number][] = [
    [-1.1 - trailerLength / 2 - 1.8, -0.95, 1.15],
    [-1.1 - trailerLength / 2 - 1.8, -0.95, -1.15],
    [0.9, -0.95, 1.15],
    [0.9, -0.95, -1.15],
    [1.9, -0.95, 1.15],
    [1.9, -0.95, -1.15],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheelGroup = new THREE.Mesh(wheelTireGeo, wheelTireMat);
    const rim = new THREE.Mesh(wheelRimGeo, wheelRimMat);
    wheelGroup.add(rim);
    wheelGroup.position.set(wx, wy, wz);
    group.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  return {
    group,
    trailer,
    cabin,
    wheels,
    geometries,
    materials,
  };
}

/**
 * 7. Pure Mathematical Scrollytelling State Machine
 * Deterministic and 100% reversible across all 5 phases:
 * Phase 1 (0.00 - 0.30): Fresh Pear
 * Phase 2 (0.30 - 0.60): Biological Rot
 * Phase 3 (0.60 - 0.75): AI Digital Twin Intervention & Reversal
 * Phase 4 (0.75 - 0.90): Smart Encapsulation into Insulated Carton
 * Phase 5 (0.90 - 1.00): Eurasian Reefer Semi-Trailer Dispatch
 */
export interface ScrollytellingState {
  phase: 1 | 2 | 3 | 4 | 5;
  phaseProgress: number;
  pearVisible: boolean;
  pearPosition: [number, number, number];
  pearRotation: [number, number, number];
  pearScale: [number, number, number];
  uDecay: number;
  uRestoration: number;
  leafWilting: number;
  cartonVisible: boolean;
  cartonPosition: [number, number, number];
  cartonScale: [number, number, number];
  cartonFlapAngle: number;
  cartonSealed: boolean;
  truckVisible: boolean;
  truckPosition: [number, number, number];
  truckScale: [number, number, number];
  wheelRotation: number;
}

export function computeScrollytellingState(pRaw: number, isDesktop: boolean = true): ScrollytellingState {
  const p = Math.max(0.0, Math.min(1.0, pRaw));
  const xOffset = isDesktop ? 1.8 : 0.0;
  const yOffset = isDesktop ? 0.0 : 0.4;
  const scaleMult = isDesktop ? 1.0 : 0.85;

  if (p < 0.30) {
    // --- PHASE 1: Fresh Pear (0.00 -> 0.30) ---
    const norm = p / 0.30;
    return {
      phase: 1,
      phaseProgress: norm,
      pearVisible: true,
      pearPosition: [xOffset, yOffset, 0.0],
      pearRotation: [0.0, norm * 1.2, 0.0],
      pearScale: [scaleMult, scaleMult, scaleMult],
      uDecay: 0.0,
      uRestoration: 0.0,
      leafWilting: 0.0,
      cartonVisible: false,
      cartonPosition: [xOffset, -10.0, 0.0],
      cartonScale: [0.001, 0.001, 0.001],
      cartonFlapAngle: 1.3,
      cartonSealed: false,
      truckVisible: false,
      truckPosition: [20.0, -1.0, -5.0],
      truckScale: [0.001, 0.001, 0.001],
      wheelRotation: 0.0,
    };
  } else if (p < 0.60) {
    // --- PHASE 2: Biological Rot Progression (0.30 -> 0.60) ---
    const norm = (p - 0.30) / 0.30;
    return {
      phase: 2,
      phaseProgress: norm,
      pearVisible: true,
      pearPosition: [xOffset, yOffset - norm * 0.15, 0.0],
      pearRotation: [norm * 0.25, 1.2 + norm * 1.1, norm * 0.1],
      pearScale: [
        scaleMult * (1.0 - norm * 0.08),
        scaleMult * (1.0 - norm * 0.10),
        scaleMult * (1.0 - norm * 0.08),
      ],
      uDecay: norm,
      uRestoration: 0.0,
      leafWilting: norm,
      cartonVisible: false,
      cartonPosition: [xOffset, -10.0, 0.0],
      cartonScale: [0.001, 0.001, 0.001],
      cartonFlapAngle: 1.3,
      cartonSealed: false,
      truckVisible: false,
      truckPosition: [20.0, -1.0, -5.0],
      truckScale: [0.001, 0.001, 0.001],
      wheelRotation: 0.0,
    };
  } else if (p < 0.75) {
    // --- PHASE 3: AI Digital Twin Recovery (0.60 -> 0.75) ---
    const norm = (p - 0.60) / 0.15;
    const decayRemaining = 1.0 - norm;
    return {
      phase: 3,
      phaseProgress: norm,
      pearVisible: true,
      pearPosition: [xOffset, yOffset - decayRemaining * 0.15, 0.0],
      pearRotation: [decayRemaining * 0.25, 2.3 + norm * 1.5, 0.0],
      pearScale: [
        scaleMult * (0.92 + norm * 0.08),
        scaleMult * (0.90 + norm * 0.10),
        scaleMult * (0.92 + norm * 0.08),
      ],
      uDecay: decayRemaining,
      uRestoration: Math.sin(norm * Math.PI),
      leafWilting: decayRemaining,
      cartonVisible: false,
      cartonPosition: [xOffset, -10.0, 0.0],
      cartonScale: [0.001, 0.001, 0.001],
      cartonFlapAngle: 1.3,
      cartonSealed: false,
      truckVisible: false,
      truckPosition: [20.0, -1.0, -5.0],
      truckScale: [0.001, 0.001, 0.001],
      wheelRotation: 0.0,
    };
  } else if (p < 0.90) {
    // --- PHASE 4: Packaging into Smart Insulated Carton (0.75 -> 0.90) ---
    const norm = (p - 0.75) / 0.15;
    const cartonRise = THREE.MathUtils.lerp(-4.5, -0.2, Math.min(1.0, norm * 1.4));
    const pearLower = THREE.MathUtils.lerp(0.0, -0.4, Math.min(1.0, norm * 1.4));
    
    // Flaps open until norm > 0.5, then fold shut smoothly
    let flapAngle = 1.3;
    let sealed = false;
    if (norm > 0.5) {
      const closeT = (norm - 0.5) / 0.5;
      flapAngle = (1.0 - closeT) * 1.3;
      sealed = closeT >= 0.85;
    }

    return {
      phase: 4,
      phaseProgress: norm,
      pearVisible: norm < 0.85,
      pearPosition: [xOffset, yOffset + pearLower, 0.0],
      pearRotation: [0.0, 3.8 + norm * 0.5, 0.0],
      pearScale: [scaleMult * 0.85, scaleMult * 0.85, scaleMult * 0.85],
      uDecay: 0.0,
      uRestoration: 0.0,
      leafWilting: 0.0,
      cartonVisible: true,
      cartonPosition: [xOffset, yOffset + cartonRise, 0.0],
      cartonScale: [scaleMult, scaleMult, scaleMult],
      cartonFlapAngle: flapAngle,
      cartonSealed: sealed,
      truckVisible: false,
      truckPosition: [20.0, -1.0, -5.0],
      truckScale: [0.001, 0.001, 0.001],
      wheelRotation: 0.0,
    };
  } else {
    // --- PHASE 5: Eurasian Reefer Semi-Trailer Dispatch (0.90 -> 1.00) ---
    const norm = (p - 0.90) / 0.10;
    
    // Carton slides into truck cargo bay in first 40% of phase 5
    const cartonInTruck = norm < 0.40;
    const cartonSlideX = xOffset - norm * 1.5;
    const cartonSlideZ = -norm * 1.2;

    // Truck positioning & driving acceleration along highway corridor
    let truckX = xOffset;
    let truckZ = -1.2;
    let wheelRot = 0.0;

    if (norm < 0.30) {
      // Truck pulling in from right into framing position
      const arriveT = norm / 0.30;
      truckX = THREE.MathUtils.lerp(xOffset + 4.0, xOffset, arriveT);
      wheelRot = (xOffset + 4.0 - truckX) * 2.2;
    } else {
      // Truck accelerates along highway corridor into perspective distance, remaining clearly visible in frame
      const driveT = (norm - 0.30) / 0.70;
      const dist = driveT * 1.5;
      truckX = xOffset - dist * 0.8;
      truckZ = -1.2 - dist * 1.0;
      wheelRot = 8.8 + dist * 3.5;
    }

    return {
      phase: 5,
      phaseProgress: norm,
      pearVisible: false,
      pearPosition: [xOffset, -10.0, 0.0],
      pearRotation: [0.0, 0.0, 0.0],
      pearScale: [0.001, 0.001, 0.001],
      uDecay: 0.0,
      uRestoration: 0.0,
      leafWilting: 0.0,
      cartonVisible: cartonInTruck,
      cartonPosition: [cartonSlideX, yOffset - 0.2, cartonSlideZ],
      cartonScale: [scaleMult * 0.75, scaleMult * 0.75, scaleMult * 0.75],
      cartonFlapAngle: 0.0,
      cartonSealed: true,
      truckVisible: true,
      truckPosition: [truckX, yOffset - 0.8, truckZ],
      truckScale: [scaleMult * 0.85, scaleMult * 0.85, scaleMult * 0.85],
      wheelRotation: wheelRot,
    };
  }
}

/**
 * 8. Full-Viewport WebGL Component
 */
export interface PearScrollytellingProps {
  scrollProgress: number; // 0.0 to 1.0
  onProgressChange?: (progress: number) => void;
}

export const PearScrollytelling: React.FC<PearScrollytellingProps> = ({
  scrollProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetProgressRef = useRef<number>(scrollProgress);
  const renderProgressRef = useRef<number>(scrollProgress);

  // Synchronize target progress
  useEffect(() => {
    targetProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Viewport dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 2. WebGL Renderer with performance limits and preserved drawing buffer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Apple-Grade Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf1f5f9, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(5.0, 6.0, 5.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    fillLight.position.set(-5.0, -2.0, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa7f3d0, 1.4);
    rimLight.position.set(0.0, 4.0, -4.0);
    scene.add(rimLight);

    // 4. Geometry & Meshes
    const allGeometries: THREE.BufferGeometry[] = [];
    const allMaterials: THREE.Material[] = [];

    // Pear Group
    const pearGroup = new THREE.Group();
    const pearGeo = createOrganicPearGeometry();
    allGeometries.push(pearGeo);

    const pearShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDecay: { value: 0 },
        uRestoration: { value: 0 },
        uKeyLightPos: { value: keyLight.position },
        uFillLightPos: { value: fillLight.position },
      },
      vertexShader: pearVertexShader,
      fragmentShader: pearFragmentShader,
    });
    allMaterials.push(pearShaderMat);

    const pearMesh = new THREE.Mesh(pearGeo, pearShaderMat);
    pearGroup.add(pearMesh);

    // Stem: Catmull-Rom spline with fibrous woody material
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.03, 1.28, -0.01),
      new THREE.Vector3(0.06, 1.50, 0.02),
      new THREE.Vector3(0.12, 1.70, 0.07),
      new THREE.Vector3(0.22, 1.88, 0.13),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.045, 10, false);
    allGeometries.push(stemGeo);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e16,
      roughness: 0.92,
      metalness: 0.08,
    });
    allMaterials.push(stemMat);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    pearGroup.add(stemMesh);

    // Leaf: Double-curved 3D leaf with midrib crease
    const leafGeo = createCurvedLeafGeometry();
    allGeometries.push(leafGeo);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    allMaterials.push(leafMat);
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.position.set(0.10, 1.62, 0.06);
    leafMesh.rotation.set(0.3, 0.7, -0.4);
    pearGroup.add(leafMesh);

    scene.add(pearGroup);

    // 5. Smart Insulated Carton
    const cartonObj = createSmartCartonMesh();
    allGeometries.push(...cartonObj.geometries);
    allMaterials.push(...cartonObj.materials);
    scene.add(cartonObj.group);

    // 6. Eurasian Refrigerated Semi-Trailer Truck
    const truckObj = createReeferTruckMesh();
    allGeometries.push(...truckObj.geometries);
    allMaterials.push(...truckObj.materials);
    scene.add(truckObj.group);

    // 7. Animation & Render Loop with Exponential Moving Average Damping
    let animationFrameId: number;
    const timer = new THREE.Timer();

    const animate = (timestamp?: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if (timestamp !== undefined) {
        timer.update(timestamp);
      } else {
        timer.update();
      }
      const elapsedTime = timer.getElapsed();

      // Exponential moving average damping: silky 60fps inertia
      const targetP = targetProgressRef.current;
      renderProgressRef.current += (targetP - renderProgressRef.current) * 0.08;
      const currentP = renderProgressRef.current;

      const isDesktop = window.innerWidth >= 1024;
      const state = computeScrollytellingState(currentP, isDesktop);

      // Update shader uniforms
      pearShaderMat.uniforms.uTime.value = elapsedTime;
      pearShaderMat.uniforms.uDecay.value = state.uDecay;
      pearShaderMat.uniforms.uRestoration.value = state.uRestoration;

      // Update Pear Mesh Group
      pearGroup.visible = state.pearVisible;
      if (state.pearVisible) {
        // Natural hovering float
        const hoverFloat = Math.sin(elapsedTime * 1.2) * 0.08;
        pearGroup.position.set(
          state.pearPosition[0],
          state.pearPosition[1] + hoverFloat,
          state.pearPosition[2]
        );
        pearGroup.rotation.set(
          state.pearRotation[0],
          state.pearRotation[1],
          state.pearRotation[2]
        );
        pearGroup.scale.set(
          state.pearScale[0],
          state.pearScale[1],
          state.pearScale[2]
        );

        // Dynamic Leaf Wilting
        const wilt = state.leafWilting;
        leafMesh.rotation.set(0.3 + wilt * 0.7, 0.7 - wilt * 0.3, -0.4 - wilt * 0.5);
        leafMesh.scale.set(1.0 - wilt * 0.25, 1.0 - wilt * 0.3, 1.0 - wilt * 0.2);
        leafMat.color.lerpColors(new THREE.Color(0x16a34a), new THREE.Color(0x5a481c), wilt);
      }

      // Update Smart Carton
      cartonObj.group.visible = state.cartonVisible;
      if (state.cartonVisible) {
        cartonObj.group.position.set(
          state.cartonPosition[0],
          state.cartonPosition[1],
          state.cartonPosition[2]
        );
        cartonObj.group.scale.set(
          state.cartonScale[0],
          state.cartonScale[1],
          state.cartonScale[2]
        );

        // Animate flaps
        cartonObj.flapLeft.rotation.z = state.cartonFlapAngle;
        cartonObj.flapRight.rotation.z = -state.cartonFlapAngle;

        // LED Indicator status
        const ledMat = cartonObj.ledIndicator.material as THREE.MeshStandardMaterial;
        if (state.cartonSealed) {
          ledMat.emissiveIntensity = 1.2;
          ledMat.color.setHex(0x10b981);
        } else {
          ledMat.emissiveIntensity = 0.3;
          ledMat.color.setHex(0x0284c7);
        }
      }

      // Update Truck
      truckObj.group.visible = state.truckVisible;
      if (state.truckVisible) {
        truckObj.group.position.set(
          state.truckPosition[0],
          state.truckPosition[1],
          state.truckPosition[2]
        );
        truckObj.group.scale.set(
          state.truckScale[0],
          state.truckScale[1],
          state.truckScale[2]
        );
        truckObj.group.rotation.set(0.0, 0.15, 0.0);

        // Rotate all 6 wheels with travel distance
        truckObj.wheels.forEach((wheel) => {
          wheel.rotation.z = state.wheelRotation;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Viewport Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 9. Comprehensive WebGL Lifecycle Disposal & Teardown
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      // Cleanly dispose all geometries
      allGeometries.forEach((geo) => geo.dispose());

      // Cleanly dispose all materials
      allMaterials.forEach((mat) => mat.dispose());

      // Force WebGL context release
      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 w-screen h-screen overflow-hidden pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
};

export default PearScrollytelling;
