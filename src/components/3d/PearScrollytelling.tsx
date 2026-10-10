'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PearScrollytellingProps {
  scrollProgress: number; // 0.0 to 1.0
  onProgressChange?: (progress: number) => void;
}

export const PearScrollytelling: React.FC<PearScrollytellingProps> = ({
  scrollProgress,
  onProgressChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const progressRef = useRef<number>(scrollProgress);
  const [interactiveProgress, setInteractiveProgress] = useState<number>(scrollProgress);
  const isUserScrubbing = useRef<boolean>(false);

  // Sync ref with prop if not scrubbing manually
  useEffect(() => {
    if (!isUserScrubbing.current) {
      progressRef.current = scrollProgress;
      setInteractiveProgress(scrollProgress);
    }
  }, [scrollProgress]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.0);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 2.5);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 4. Procedural Pear Geometry
    // Revolve a classic pear curve: wide bottom sphere tapering up to narrow neck
    const pearPoints: THREE.Vector2[] = [];
    const segments = 42;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = (t - 0.5) * 2.5; // -1.25 to +1.25
      // Profile function: bulbous at bottom, waist in middle, tapered neck at top
      let r = 0;
      if (t < 0.6) {
        // Bottom bulb
        const bt = t / 0.6;
        r = Math.sin(bt * Math.PI) * 1.15 * Math.pow(1.0 - t * 0.3, 0.5);
        if (t < 0.08) {
          // Bottom indent / calyx dimple
          r = Math.sin((t / 0.08) * (Math.PI * 0.5)) * 0.45;
        }
      } else {
        // Top neck
        const nt = (t - 0.6) / 0.4;
        r = (0.78 * (1.0 - nt * 0.65)) * Math.cos(nt * 0.5);
        if (t > 0.96) {
          // Top stem dimple
          r *= (1.0 - (t - 0.96) / 0.04 * 0.5);
        }
      }
      pearPoints.push(new THREE.Vector2(Math.max(0.01, r), y));
    }
    const pearGeometry = new THREE.LatheGeometry(pearPoints, 64);
    pearGeometry.computeVertexNormals();

    // 5. Custom GLSL Shader for Biological Pear Decay & Reversal
    const pearShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDecay: { value: 0 },         // 0.0 (fresh) -> 1.0 (rotten)
        uRestoration: { value: 0 },   // 0.0 -> 1.0 (bio-twin hologram restoration pulse)
        uLightPos: { value: new THREE.Vector3(4, 5, 5) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uDecay;
        uniform float uRestoration;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vDisplacement;

        // Simplex Noise 3D helper
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
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
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          // Compute biological decay deformation: wrinkling, caving-in, desiccating
          float nRough = snoise(position * 3.5 + vec3(0.0, 0.0, 1.2));
          float nFolds = snoise(position * 7.0);
          float decayDeform = (nRough * 0.16 + nFolds * 0.08) * uDecay;
          
          // Shrinkage towards core when rotten
          float shrink = 1.0 - (uDecay * 0.12);
          
          vec3 displacedPos = (position * shrink) - (normal * decayDeform);
          
          // Bio-twin holographic quantum scan pulse
          if (uRestoration > 0.01) {
            float scanPulse = sin(position.y * 12.0 - uTime * 3.5);
            displacedPos += normal * (scanPulse * 0.015 * uRestoration);
          }

          vPosition = (modelViewMatrix * vec4(displacedPos, 1.0)).xyz;
          vDisplacement = decayDeform;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uDecay;
        uniform float uRestoration;
        uniform vec3 uLightPos;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vDisplacement;

        // Simple 2D procedural noise for skin pores
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(-vPosition);
          vec3 lightDir = normalize(uLightPos - vPosition);

          // 1. Fresh Pear Colors (Bartlett / Asian golden-green with blush)
          vec3 freshLime = vec3(0.52, 0.79, 0.22);
          vec3 freshGold = vec3(0.88, 0.78, 0.28);
          vec3 blushRed = vec3(0.86, 0.38, 0.20);
          
          // Gradient based on height and sunlight angle
          float heightFactor = clamp(vUv.y, 0.0, 1.0);
          vec3 freshBase = mix(freshLime, freshGold, heightFactor);
          float blush = smoothstep(0.4, 0.9, dot(normal, vec3(0.6, 0.3, 0.7))) * (1.0 - heightFactor * 0.5);
          freshBase = mix(freshBase, blushRed, blush * 0.45);

          // Micro pores (lenticels) on fresh skin
          float pores = step(0.92, hash(vUv * 90.0)) * 0.12;
          freshBase -= vec3(pores * 0.3, pores * 0.2, 0.0);

          // 2. Rotten Pear Colors (Necrotic brown, black fungal bruising, grayish mold spores)
          vec3 bruiseBrown = vec3(0.38, 0.22, 0.09);
          vec3 deepRot = vec3(0.14, 0.07, 0.03);
          vec3 moldSpore = vec3(0.45, 0.56, 0.50);

          // Rot distribution mask
          float rotMask = clamp(vDisplacement * 6.0 + (1.0 - heightFactor) * 0.5 + hash(vUv * 18.0) * 0.3, 0.0, 1.0);
          rotMask = smoothstep(0.15, 0.85, rotMask * uDecay * 1.4);

          vec3 rottenColor = mix(freshBase, bruiseBrown, uDecay);
          rottenColor = mix(rottenColor, deepRot, rotMask);
          
          // Fungal fuzzy bloom patches
          float moldPatch = smoothstep(0.65, 0.95, hash(vUv * 28.0) + rotMask * 0.6) * uDecay;
          rottenColor = mix(rottenColor, moldSpore, moldPatch * 0.75);

          // 3. Diffuse & Specular Lighting
          float diff = max(dot(normal, lightDir), 0.0);
          vec3 halfDir = normalize(lightDir + viewDir);
          
          // Fresh pear has soft waxy specular sheen; rotten becomes dull/matte
          float shininess = mix(32.0, 4.0, uDecay);
          float specIntensity = mix(0.35, 0.04, uDecay);
          float spec = pow(max(dot(normal, halfDir), 0.0), shininess) * specIntensity;

          // Subtle subsurface scattering simulation
          vec3 sss = vec3(0.12, 0.18, 0.04) * max(0.0, dot(-normal, lightDir) * 0.5 + 0.5) * (1.0 - uDecay);

          // Fresnel cyber rim
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
          vec3 rimColor = mix(vec3(0.1, 0.8, 0.4), vec3(0.2, 0.1, 0.05), uDecay);

          vec3 finalColor = (rottenColor * (diff + 0.25) + sss + spec) + (rimColor * fresnel * 0.4);

          // 4. Bio-Twin Digital Reconstruction & Holo Mesh Pulse
          if (uRestoration > 0.01) {
            float scanWave = sin(vPosition.y * 18.0 - uTime * 4.0);
            float scanIntensity = smoothstep(0.85, 1.0, scanWave);
            
            // Emerald holographic grid lines
            vec3 holoGlow = vec3(0.06, 0.95, 0.62) * (scanIntensity * 1.8 + fresnel * 0.8);
            finalColor = mix(finalColor, finalColor + holoGlow, uRestoration * 0.85);
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    // Pear Mesh Group
    const pearGroup = new THREE.Group();
    const pearMesh = new THREE.Mesh(pearGeometry, pearShaderMaterial);
    pearGroup.add(pearMesh);

    // Stem: Curved wood cylinder at top
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(0.06, 1.55, 0.04),
      new THREE.Vector3(0.18, 1.85, 0.12),
    ]);
    const stemGeometry = new THREE.TubeGeometry(stemCurve, 16, 0.045, 8, false);
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2e16,
      roughness: 0.9,
      metalness: 0.1,
    });
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    pearGroup.add(stemMesh);

    // Leaf: Organic curved petal attached to stem
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.22, 0.25, 0.35, 0.7);
    leafShape.quadraticCurveTo(0.12, 0.55, 0, 0.4);
    leafShape.quadraticCurveTo(-0.12, 0.55, -0.35, 0.7);
    leafShape.quadraticCurveTo(-0.22, 0.25, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.position.set(0.12, 1.65, 0.08);
    leafMesh.rotation.set(0.4, 0.8, -0.5);
    leafMesh.scale.set(0.7, 0.7, 0.7);
    pearGroup.add(leafMesh);

    scene.add(pearGroup);

    // 6. Smart Reefer Insulation Crate (Box)
    const crateGroup = new THREE.Group();
    const crateSize = 2.8;
    const crateBodyGeo = new THREE.BoxGeometry(crateSize, crateSize * 0.9, crateSize);
    const crateBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Navy slate
      roughness: 0.3,
      metalness: 0.8,
    });
    const crateBody = new THREE.Mesh(crateBodyGeo, crateBodyMat);
    crateGroup.add(crateBody);

    // Edge Protectors & Gaskets
    const edgeGeo = new THREE.BoxGeometry(crateSize + 0.06, 0.08, crateSize + 0.06);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald neon gasket
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });
    const edgeTop = new THREE.Mesh(edgeGeo, edgeMat);
    edgeTop.position.y = (crateSize * 0.9) / 2;
    crateGroup.add(edgeTop);

    // Crate Lid (Opens and closes smoothly)
    const lidGeo = new THREE.BoxGeometry(crateSize + 0.04, 0.2, crateSize + 0.04);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.7,
    });
    const crateLid = new THREE.Mesh(lidGeo, lidMat);
    crateLid.position.set(0, (crateSize * 0.9) / 2 + 0.1, 0);
    crateGroup.add(crateLid);

    // Initial state: crate hidden below screen
    crateGroup.position.set(0, -10, 0);
    crateGroup.scale.set(0.001, 0.001, 0.001);
    scene.add(crateGroup);

    // 7. Refrigerated Cargo Truck (Reefer Semi-Trailer)
    const truckGroup = new THREE.Group();

    // Trailer Box
    const trailerLength = 6.2;
    const trailerHeight = 2.4;
    const trailerWidth = 2.2;
    const trailerGeo = new THREE.BoxGeometry(trailerLength, trailerHeight, trailerWidth);
    const trailerMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.2,
      metalness: 0.7,
    });
    const trailer = new THREE.Mesh(trailerGeo, trailerMat);
    trailer.position.set(-1.0, 0, 0);
    truckGroup.add(trailer);

    // Reefer Cooling Unit (Mounted on front bulkhead)
    const reeferUnitGeo = new THREE.BoxGeometry(0.5, 1.2, 1.6);
    const reeferUnitMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    const reeferUnit = new THREE.Mesh(reeferUnitGeo, reeferUnitMat);
    reeferUnit.position.set(-1.0 - trailerLength / 2 - 0.25, 0.3, 0);
    truckGroup.add(reeferUnit);

    // Truck Cabin (Front)
    const cabinGeo = new THREE.BoxGeometry(2.2, 2.2, 2.1);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green cab
      roughness: 0.3,
      metalness: 0.6,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-1.0 - trailerLength / 2 - 1.5, -0.1, 0);
    truckGroup.add(cabin);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(0.1, 0.9, 1.8);
    const windshieldMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.1,
      metalness: 0.9,
    });
    const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
    windshield.position.set(-1.0 - trailerLength / 2 - 2.56, 0.35, 0);
    truckGroup.add(windshield);

    // Headlights
    const lightGeo = new THREE.BoxGeometry(0.1, 0.2, 0.3);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 3.0,
    });
    const leftLight = new THREE.Mesh(lightGeo, lightMat);
    leftLight.position.set(-1.0 - trailerLength / 2 - 2.56, -0.6, 0.65);
    const rightLight = new THREE.Mesh(lightGeo, lightMat);
    rightLight.position.set(-1.0 - trailerLength / 2 - 2.56, -0.6, -0.65);
    truckGroup.add(leftLight);
    truckGroup.add(rightLight);

    // Wheels (8 wheels)
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 24);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
    });

    const wheelPositions = [
      [-1.0 - trailerLength / 2 - 1.6, -1.2, 1.1],
      [-1.0 - trailerLength / 2 - 1.6, -1.2, -1.1],
      [1.0, -1.2, 1.1],
      [1.0, -1.2, -1.1],
      [1.9, -1.2, 1.1],
      [1.9, -1.2, -1.1],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      truckGroup.add(wheel);
    });

    // Initial state: truck off-screen
    truckGroup.position.set(20, -1.0, -5);
    truckGroup.scale.set(0.001, 0.001, 0.001);
    scene.add(truckGroup);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const p = progressRef.current;

      pearShaderMaterial.uniforms.uTime.value = elapsedTime;

      // STAGE LOGIC BASED ON SCROLL PROGRESS (0.0 to 1.0)
      if (p < 0.22) {
        // --- PHASE 1: Fresh Pristine Pear (0.00 -> 0.22) ---
        // Floating fresh pear, subtle organic wobble
        pearShaderMaterial.uniforms.uDecay.value = 0.0;
        pearShaderMaterial.uniforms.uRestoration.value = 0.0;

        pearGroup.visible = true;
        pearGroup.position.set(1.5, Math.sin(elapsedTime * 1.2) * 0.15, 0);
        pearGroup.rotation.y = elapsedTime * 0.4;
        pearGroup.rotation.z = Math.sin(elapsedTime * 0.8) * 0.08;
        pearGroup.scale.set(1.0, 1.0, 1.0);

        crateGroup.visible = false;
        truckGroup.visible = false;
      } 
      else if (p >= 0.22 && p < 0.65) {
        // --- PHASE 2: Spoilage & Thermal Decay (0.22 -> 0.65) ---
        // Pear rots, bruises, caves in and shrivels
        const decayNorm = (p - 0.22) / (0.65 - 0.22);
        pearShaderMaterial.uniforms.uDecay.value = Math.min(1.0, decayNorm * 1.1);
        pearShaderMaterial.uniforms.uRestoration.value = 0.0;

        pearGroup.visible = true;
        // Agitated, uneasy shuddering motion as it decays
        const jitter = Math.sin(elapsedTime * 14.0) * 0.02 * decayNorm;
        pearGroup.position.set(1.5 + jitter, Math.sin(elapsedTime * 0.8) * 0.1 - decayNorm * 0.2, 0);
        pearGroup.rotation.y = 0.8 + decayNorm * 1.2 + jitter * 2.0;
        pearGroup.rotation.x = decayNorm * 0.35;
        pearGroup.scale.set(1.0 - decayNorm * 0.15, 1.0 - decayNorm * 0.18, 1.0 - decayNorm * 0.15);

        crateGroup.visible = false;
        truckGroup.visible = false;
      } 
      else if (p >= 0.65 && p < 0.82) {
        // --- PHASE 3: AI Digital Twin Intervention & Reversal (0.65 -> 0.82) ---
        // Reverse decay! Holographic scan restores pear back to 100% fresh
        const restoreNorm = (p - 0.65) / (0.82 - 0.65);
        pearShaderMaterial.uniforms.uDecay.value = Math.max(0.0, 1.0 - restoreNorm * 1.2);
        pearShaderMaterial.uniforms.uRestoration.value = Math.sin(restoreNorm * Math.PI) * 1.0;

        pearGroup.visible = true;
        pearGroup.position.set(1.5 * (1.0 - restoreNorm * 0.5), 0, 0);
        pearGroup.rotation.y = elapsedTime * 1.5;
        pearGroup.rotation.x = 0;
        const currentScale = 0.85 + restoreNorm * 0.15;
        pearGroup.scale.set(currentScale, currentScale, currentScale);

        crateGroup.visible = false;
        truckGroup.visible = false;
      } 
      else if (p >= 0.82 && p < 0.92) {
        // --- PHASE 4: Packaging into Smart Insulated Crate (0.82 -> 0.92) ---
        // Fresh pear drops inside the high-tech crate, lid seals
        const packNorm = (p - 0.82) / (0.92 - 0.82);
        pearShaderMaterial.uniforms.uDecay.value = 0.0;
        pearShaderMaterial.uniforms.uRestoration.value = 0.0;

        crateGroup.visible = true;
        // Crate animates up to center
        const crateY = THREE.MathUtils.lerp(-4.0, 0.0, Math.min(1.0, packNorm * 1.5));
        const crateScale = THREE.MathUtils.lerp(0.2, 1.0, Math.min(1.0, packNorm * 1.5));
        crateGroup.position.set(0, crateY, 0);
        crateGroup.scale.set(crateScale, crateScale, crateScale);
        crateGroup.rotation.y = packNorm * 0.8;

        // Pear lowers into crate
        pearGroup.visible = packNorm < 0.75;
        pearGroup.position.set(0, 1.2 - packNorm * 1.8, 0);
        pearGroup.scale.set(0.65, 0.65, 0.65);

        // Lid closes when pear is inside
        if (packNorm > 0.55) {
          const lidClose = (packNorm - 0.55) / 0.45;
          crateLid.position.y = (crateSize * 0.9) / 2 + 0.1 + (1.0 - lidClose) * 1.5;
          crateLid.rotation.x = (1.0 - lidClose) * 0.8;
        } else {
          crateLid.position.y = (crateSize * 0.9) / 2 + 1.6;
          crateLid.rotation.x = 0.8;
        }

        truckGroup.visible = false;
      } 
      else {
        // --- PHASE 5: Loading into Reefer Truck & Dispatch (0.92 -> 1.00) ---
        // Sealed crate slides into truck, truck doors shut, truck drives off!
        const dispatchNorm = (p - 0.92) / (1.00 - 0.92);
        pearGroup.visible = false;

        crateGroup.visible = dispatchNorm < 0.45;
        if (crateGroup.visible) {
          crateGroup.scale.set(0.5, 0.5, 0.5);
          crateGroup.position.set(-1.0 + dispatchNorm * 2.0, -0.2, -1.0 - dispatchNorm * 3.0);
        }

        truckGroup.visible = true;
        truckGroup.scale.set(0.85, 0.85, 0.85);

        // Truck arrives, seals, then accelerates forward along highway
        if (dispatchNorm < 0.3) {
          // Truck arriving into frame
          const arrive = dispatchNorm / 0.3;
          truckGroup.position.set(8.0 - arrive * 8.0, -0.6, -1.5);
          truckGroup.rotation.y = Math.PI * 0.05;
        } else {
          // Truck speeding away into distance
          const speed = (dispatchNorm - 0.3) / 0.7;
          const dist = Math.pow(speed, 2.2) * 28.0;
          truckGroup.position.set(-dist, -0.6, -1.5 - dist * 0.8);
          truckGroup.rotation.y = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      pearGeometry.dispose();
      pearShaderMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Update progress directly via interactive scrubber
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    isUserScrubbing.current = true;
    progressRef.current = val;
    setInteractiveProgress(val);
    if (onProgressChange) {
      onProgressChange(val);
    }
  };

  const handleScrubEnd = () => {
    isUserScrubbing.current = false;
  };

  // Stage details for HUD overlay
  const getStageInfo = (p: number) => {
    if (p < 0.22) {
      return {
        stage: '01 / HARVEST',
        title: 'Fresh Agricultural Asset',
        bhi: '99.8%',
        temp: '+0.8°C [OPTIMAL]',
        ethanol: '2.4 ppm',
        status: 'Pristine Asian Pear (Pyrus pyrifolia) • Baseline Shelf-Life: 30 Days',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        badge: 'ACTIVE PRESERVATION',
      };
    } else if (p < 0.65) {
      const decayPct = ((p - 0.22) / (0.65 - 0.22) * 100).toFixed(0);
      return {
        stage: '02 / TEMPERATURE EXCURSION',
        title: 'Biological Rot & Decay Active',
        bhi: `${Math.max(12, 100 - parseInt(decayPct))}%`,
        temp: `+${(2.0 + parseInt(decayPct) * 0.25).toFixed(1)}°C [CRITICAL HEAT]`,
        ethanol: `${(4.0 + parseInt(decayPct) * 0.45).toFixed(1)} ppm`,
        status: `Reefer Failure • Pectin Hydrolysis • Microbial Spoilage (${decayPct}% decayed)`,
        color: 'text-rose-400',
        borderColor: 'border-rose-500/50',
        badge: 'CRITICAL SPOILAGE RISK',
      };
    } else if (p < 0.82) {
      return {
        stage: '03 / AI TWIN INTERVENTION',
        title: 'Quantum Bio-Twin Time Reversal',
        bhi: '98.5% [RECOVERED]',
        temp: '+1.2°C [STABILIZED]',
        ethanol: '3.1 ppm',
        status: 'Arrhenius Kinetics Halted Decay • Respiration Quenched • 100% Quality Restored',
        color: 'text-cyan-400',
        borderColor: 'border-cyan-500/40',
        badge: 'BIO-TWIN PROTECTED',
      };
    } else if (p < 0.92) {
      return {
        stage: '04 / SMART ENCAPSULATION',
        title: 'Sealing in FreshStream Crate',
        bhi: '100.0%',
        temp: '+0.5°C [PULSE-COOLED]',
        ethanol: '2.2 ppm',
        status: 'Airtight Insulated Reefer Crate • CA Nitrogen Atmosphere • Sealed Lock',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        badge: 'CONTAINER SEALED',
      };
    } else {
      return {
        stage: '05 / AUTONOMOUS DISPATCH',
        title: 'Reefer Truck En Route',
        bhi: '100.0%',
        temp: '+1.0°C [DCSA MONITORED]',
        ethanol: '2.0 ppm',
        status: 'Dispatched via Trans-Caspian Corridor • Next Hub: Port Kuryk (Day 1 / 18)',
        color: 'text-indigo-400',
        borderColor: 'border-indigo-500/40',
        badge: 'IN TRANSIT',
      };
    }
  };

  const stage = getStageInfo(interactiveProgress);

  return (
    <div className="relative w-full h-[650px] sm:h-[750px] md:h-[850px] overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: Real-time Biological Twin Telemetry Overlay */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none z-10">
        <div className={`p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border ${stage.borderColor} shadow-xl max-w-md`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">
              {stage.stage}
            </span>
            <span className="text-slate-600">•</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/80 ${stage.color}`}>
              {stage.badge}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {stage.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {stage.status}
          </p>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-400">HEALTH INDEX</span>
            <span className={`text-base sm:text-lg font-mono font-extrabold ${stage.color}`}>
              {stage.bhi}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-400">CORE TEMP</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-cyan-300">
              {stage.temp}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-400">VOC ETHANOL</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
              {stage.ethanol}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Scroller & Story Controller */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-20 pointer-events-auto">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Scroll down or drag timeline to scrub decay & truck dispatch:
            </span>
            <span className="font-mono text-slate-400 font-bold">
              {(interactiveProgress * 100).toFixed(0)}%
            </span>
          </div>

          {/* Timeline Range Scrubber */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.002"
            value={interactiveProgress}
            onChange={handleScrub}
            onMouseUp={handleScrubEnd}
            onTouchEnd={handleScrubEnd}
            aria-label="3D Decay Scrollytelling Progress"
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-all"
          />

          {/* Story Chapter Markers */}
          <div className="grid grid-cols-5 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            <button 
              type="button"
              onClick={() => { progressRef.current = 0.05; setInteractiveProgress(0.05); }}
              className={`text-left hover:text-emerald-400 transition-colors ${interactiveProgress < 0.22 ? 'text-emerald-400 font-bold' : ''}`}
            >
              1. Fresh Pear
            </button>
            <button 
              type="button"
              onClick={() => { progressRef.current = 0.45; setInteractiveProgress(0.45); }}
              className={`text-center hover:text-rose-400 transition-colors ${interactiveProgress >= 0.22 && interactiveProgress < 0.65 ? 'text-rose-400 font-bold' : ''}`}
            >
              2. Biological Rot
            </button>
            <button 
              type="button"
              onClick={() => { progressRef.current = 0.72; setInteractiveProgress(0.72); }}
              className={`text-center hover:text-cyan-400 transition-colors ${interactiveProgress >= 0.65 && interactiveProgress < 0.82 ? 'text-cyan-400 font-bold' : ''}`}
            >
              3. AI Reversal
            </button>
            <button 
              type="button"
              onClick={() => { progressRef.current = 0.86; setInteractiveProgress(0.86); }}
              className={`text-center hover:text-emerald-400 transition-colors ${interactiveProgress >= 0.82 && interactiveProgress < 0.92 ? 'text-emerald-400 font-bold' : ''}`}
            >
              4. Smart Crate
            </button>
            <button 
              type="button"
              onClick={() => { progressRef.current = 0.98; setInteractiveProgress(0.98); }}
              className={`text-right hover:text-indigo-400 transition-colors ${interactiveProgress >= 0.92 ? 'text-indigo-400 font-bold' : ''}`}
            >
              5. Truck Departs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
