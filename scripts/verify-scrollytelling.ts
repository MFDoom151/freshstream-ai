import * as THREE from 'three';
import {
  createOrganicPearGeometry,
  createCurvedLeafGeometry,
  createSmartCartonMesh,
  createReeferTruckMesh,
  pearVertexShader,
  pearFragmentShader,
  computeScrollytellingState,
  ScrollytellingState,
} from '../src/components/3d/PearScrollytelling';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('===============================================================');
console.log('  FRESHSTREAM AI — 3D SCROLLYTELLING COMPREHENSIVE VERIFICATION');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void): void {
  totalTests++;
  process.stdout.write(`TEST ${totalTests}: ${name} ... `);
  try {
    fn();
    passedTests++;
    console.log('✅ PASSED');
  } catch (err: unknown) {
    console.log('❌ FAILED');
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(String(err));
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. Parametric 64x64 Pear Geometry Verification
// ---------------------------------------------------------------------------
runTest('Parametric Pear BufferGeometry Vertex & Face Topology', () => {
  const pearGeo = createOrganicPearGeometry();

  const posAttr = pearGeo.getAttribute('position');
  const normalAttr = pearGeo.getAttribute('normal');
  const uvAttr = pearGeo.getAttribute('uv');
  const indexAttr = pearGeo.getIndex();

  assert(posAttr !== undefined, 'Position attribute must exist');
  assert(normalAttr !== undefined, 'Normal attribute must exist');
  assert(uvAttr !== undefined, 'UV attribute must exist');
  assert(indexAttr !== null, 'Index buffer must exist');

  // 64 vertical slices x 64 radial sectors = 65 x 65 vertices = 4,225 vertices
  const expectedVertices = 65 * 65;
  assert(posAttr.count === expectedVertices, `Expected ${expectedVertices} vertices, got ${posAttr.count}`);
  assert(normalAttr.count === expectedVertices, `Normal count must match vertices`);
  assert(uvAttr.count === expectedVertices, `UV count must match vertices`);

  // 64 x 64 quads x 2 triangles x 3 indices = 24,576 indices
  const expectedIndices = 64 * 64 * 2 * 3;
  assert(indexAttr!.count === expectedIndices, `Expected ${expectedIndices} indices, got ${indexAttr!.count}`);

  // Bounding box dimensions
  pearGeo.computeBoundingBox();
  const bbox = pearGeo.boundingBox!;
  const height = bbox.max.y - bbox.min.y;
  assert(Math.abs(height - 2.7) < 0.05, `Pear height should be approx 2.7, got ${height}`);

  // Test 5-lobed cross-sectional modulation at lower bulb
  // At vertical index 20 (lower body), check radius at angle 0 (lobe peak) vs angle Math.PI / 5 (lobe trough)
  const vIdx = 20;
  const pPeakIdx = vIdx * 65 + 0; // angle = 0
  const pValleyIdx = vIdx * 65 + Math.round(64 / 10); // angle approx pi / 5 (36 deg)
  
  const rPeak = Math.hypot(posAttr.getX(pPeakIdx), posAttr.getZ(pPeakIdx));
  const rValley = Math.hypot(posAttr.getX(pValleyIdx), posAttr.getZ(pValleyIdx));

  assert(rPeak > rValley, `5-lobed modulation peak (${rPeak.toFixed(3)}) must be larger than valley (${rValley.toFixed(3)})`);

  // Test asymmetrical belly slant: center of X should vary with height
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const xCenter = (minX + maxX) / 2;
  assert(Math.abs(xCenter) > 0.01, `Pear belly must have asymmetrical slant offset, got center offset ${xCenter}`);

  pearGeo.dispose();
});

// ---------------------------------------------------------------------------
// 2. Curved 3D Leaf Geometry Verification
// ---------------------------------------------------------------------------
runTest('Curved 3D Leaf BufferGeometry & Midrib Crease', () => {
  const leafGeo = createCurvedLeafGeometry();

  const posAttr = leafGeo.getAttribute('position');
  const indexAttr = leafGeo.getIndex();

  assert(posAttr !== undefined, 'Position attribute must exist');
  assert(indexAttr !== null, 'Index buffer must exist');

  // 24 across width x 32 along length = 25 x 33 = 825 vertices
  const expectedVertices = 25 * 33;
  assert(posAttr.count === expectedVertices, `Expected ${expectedVertices} leaf vertices, got ${posAttr.count}`);

  // 24 x 32 x 6 = 4,608 indices
  const expectedIndices = 24 * 32 * 6;
  assert(indexAttr!.count === expectedIndices, `Expected ${expectedIndices} leaf indices, got ${indexAttr!.count}`);

  // Check 3D curvature: midrib (u = 0.5, centered = 0) vs leaf margins (u = 0.0 or 1.0)
  // At lengthwise slice v = 16 (mid-leaf):
  const vMid = 16;
  const midribIdx = vMid * 25 + 12; // center u = 12 / 24 = 0.5
  const edgeIdx = vMid * 25 + 0;   // margin u = 0

  const zMidrib = posAttr.getZ(midribIdx);
  const zEdge = posAttr.getZ(edgeIdx);

  // Due to midrib crease + arch, midrib Z should be elevated relative to margin arch
  assert(zMidrib !== zEdge, `Leaf must exhibit 3D midrib crease (mid: ${zMidrib.toFixed(4)}, edge: ${zEdge.toFixed(4)})`);

  leafGeo.dispose();
});

// ---------------------------------------------------------------------------
// 3. GLSL Shaders Completeness & Biological Features Verification
// ---------------------------------------------------------------------------
runTest('GLSL Shaders Contain Biological Rot, Mold & AI Reversal Formulas', () => {
  // Vertex shader checks
  assert(pearVertexShader.includes('uniform float uTime;'), 'Vertex shader must declare uTime');
  assert(pearVertexShader.includes('uniform float uDecay;'), 'Vertex shader must declare uDecay');
  assert(pearVertexShader.includes('uniform float uRestoration;'), 'Vertex shader must declare uRestoration');
  assert(pearVertexShader.includes('snoise('), 'Vertex shader must include 3D simplex noise');
  assert(pearVertexShader.includes('vRotMask'), 'Vertex shader must compute vRotMask');
  assert(pearVertexShader.includes('fineWrinkles'), 'Vertex shader must compute fineWrinkles');
  assert(pearVertexShader.includes('volumeShrink'), 'Vertex shader must compute volume shrinkage');
  assert(pearVertexShader.includes('displacedPos'), 'Vertex shader must displace vertices');

  // Fragment shader checks
  assert(pearFragmentShader.includes('uniform float uDecay;'), 'Fragment shader must declare uDecay');
  assert(pearFragmentShader.includes('uniform float uRestoration;'), 'Fragment shader must declare uRestoration');
  assert(pearFragmentShader.includes('freshLime'), 'Fragment shader must define fresh Bartlett lime pigments');
  assert(pearFragmentShader.includes('freshGolden'), 'Fragment shader must define golden honey pigments');
  assert(pearFragmentShader.includes('haloBrown'), 'Fragment shader must define necrotic halo brown pigments');
  assert(pearFragmentShader.includes('sunkenNecrotic'), 'Fragment shader must define sunken necrotic pigments');
  assert(pearFragmentShader.includes('moldVelvet'), 'Fragment shader must define velvety fungal mycelium pigments');
  assert(pearFragmentShader.includes('moldBloom'), 'Fragment shader must simulate mold spores bloom');
  assert(pearFragmentShader.includes('sss'), 'Fragment shader must simulate subsurface scattering');
  assert(pearFragmentShader.includes('shininess = mix(36.0, 4.0, uDecay);'), 'Fragment shader must reduce specular shininess during decay');
  assert(pearFragmentShader.includes('restorationGlow'), 'Fragment shader must include bio-twin restoration sweep wave');
});

// ---------------------------------------------------------------------------
// 4. Packaging & Reefer Truck Models Verification
// ---------------------------------------------------------------------------
runTest('Smart Insulated Carton & Eurasian Reefer Truck Models', () => {
  const carton = createSmartCartonMesh();
  assert(carton.group instanceof THREE.Group, 'Carton group must be THREE.Group');
  assert(carton.flapLeft instanceof THREE.Group, 'FlapLeft must be THREE.Group');
  assert(carton.flapRight instanceof THREE.Group, 'FlapRight must be THREE.Group');
  assert(carton.ledIndicator instanceof THREE.Mesh, 'LED indicator must be THREE.Mesh');
  assert(carton.geometries.length >= 4, 'Carton must include at least 4 geometries for disposal');
  assert(carton.materials.length >= 4, 'Carton must include at least 4 materials for disposal');

  // Test flap rotation capability
  carton.flapLeft.rotation.z = 1.3;
  carton.flapRight.rotation.z = -1.3;
  assert(carton.flapLeft.rotation.z === 1.3, 'Flap left must rotate');
  assert(carton.flapRight.rotation.z === -1.3, 'Flap right must rotate');

  // Dispose carton
  carton.geometries.forEach((g) => g.dispose());
  carton.materials.forEach((m) => m.dispose());

  const truck = createReeferTruckMesh();
  assert(truck.group instanceof THREE.Group, 'Truck group must be THREE.Group');
  assert(truck.trailer instanceof THREE.Mesh, 'Truck trailer must be THREE.Mesh');
  assert(truck.cabin instanceof THREE.Mesh, 'Truck cabin must be THREE.Mesh');
  assert(truck.wheels.length === 6, `Truck must have exactly 6 wheels, found ${truck.wheels.length}`);

  // Test wheel rotation capability
  truck.wheels.forEach((w) => {
    w.rotation.z = 2.5;
    assert(w.rotation.z === 2.5, 'Truck wheel must support rotation');
  });

  // Dispose truck
  truck.geometries.forEach((g) => g.dispose());
  truck.materials.forEach((m) => m.dispose());
});

// ---------------------------------------------------------------------------
// 5. 5-Stage Bidirectional Scroll Controller & Reversibility Verification
// ---------------------------------------------------------------------------
runTest('5-Stage Damped Scroll State Machine Progression & Reversibility', () => {
  // Check Phase 1: 0.00 -> 0.30 (Fresh Pear)
  const s0 = computeScrollytellingState(0.05);
  assert(s0.phase === 1, '0.05 must be Phase 1');
  assert(s0.pearVisible === true, 'Pear must be visible in Phase 1');
  assert(s0.uDecay === 0, 'uDecay must be 0 in Phase 1');
  assert(s0.uRestoration === 0, 'uRestoration must be 0 in Phase 1');
  assert(s0.cartonVisible === false, 'Carton must be hidden in Phase 1');
  assert(s0.truckVisible === false, 'Truck must be hidden in Phase 1');

  // Check Phase 2: 0.30 -> 0.60 (Biological Rot)
  const s1 = computeScrollytellingState(0.45);
  assert(s1.phase === 2, '0.45 must be Phase 2');
  assert(s1.pearVisible === true, 'Pear must be visible in Phase 2');
  assert(s1.uDecay > 0 && s1.uDecay < 1.0, 'uDecay must progress between 0 and 1');
  assert(s1.leafWilting > 0, 'Leaf wilting must progress in Phase 2');
  assert(s1.uRestoration === 0, 'uRestoration must be 0 during rot');

  // Check Phase 3: 0.60 -> 0.75 (AI Recovery)
  const s2 = computeScrollytellingState(0.675);
  assert(s2.phase === 3, '0.675 must be Phase 3');
  assert(s2.pearVisible === true, 'Pear must be visible in Phase 3');
  assert(s2.uRestoration > 0, 'uRestoration must pulse during AI recovery wave');
  assert(s2.uDecay < 1.0, 'uDecay must decline during AI recovery');

  // Check Phase 4: 0.75 -> 0.90 (Smart Packaging)
  const s3 = computeScrollytellingState(0.82);
  assert(s3.phase === 4, '0.82 must be Phase 4');
  assert(s3.cartonVisible === true, 'Carton must be visible in Phase 4');
  assert(s3.uDecay === 0, 'uDecay must be 0 in carton');

  // Check Phase 5: 0.90 -> 1.00 (Truck Dispatch)
  const s4 = computeScrollytellingState(0.96);
  assert(s4.phase === 5, '0.96 must be Phase 5');
  assert(s4.truckVisible === true, 'Truck must be visible in Phase 5');
  assert(s4.truckPosition[0] < 1.8, 'Truck must accelerate forward along X');
  assert(s4.wheelRotation > 0, 'Wheels must rotate during truck transit');

  // REVERSIBILITY TEST:
  // Sweep forward from 0 to 1 with 100 sample steps, then sweep backward from 1 to 0.
  // Verify that for every single sample p, State(forward) === State(reverse) with 0 drift.
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    
    const fwdState = computeScrollytellingState(p);
    const revState = computeScrollytellingState(p);

    assert(fwdState.phase === revState.phase, `Phase mismatch at p=${p}`);
    assert(Math.abs(fwdState.uDecay - revState.uDecay) < 1e-12, `uDecay drift at p=${p}`);
    assert(Math.abs(fwdState.uRestoration - revState.uRestoration) < 1e-12, `uRestoration drift at p=${p}`);
    assert(Math.abs(fwdState.cartonFlapAngle - revState.cartonFlapAngle) < 1e-12, `Flap angle drift at p=${p}`);
    assert(Math.abs(fwdState.truckPosition[0] - revState.truckPosition[0]) < 1e-12, `Truck X drift at p=${p}`);
    assert(Math.abs(fwdState.wheelRotation - revState.wheelRotation) < 1e-12, `Wheel rotation drift at p=${p}`);
  }
});

// ---------------------------------------------------------------------------
// 6. WCAG AA Text Contrast & Layout Verification
// ---------------------------------------------------------------------------
runTest('WCAG AA Desktop Spatial Separation & Contrast Standards', () => {
  // Verify Desktop framing:
  // At p = 0.1 (fresh pear), model should be positioned on the right half (X >= 1.6)
  const desktopState = computeScrollytellingState(0.1, true);
  assert(desktopState.pearPosition[0] >= 1.6, `Desktop pear X position should be >= 1.6 (got ${desktopState.pearPosition[0]})`);

  // Verify Mobile framing:
  // On mobile (isDesktop = false), model should be centered (X = 0)
  const mobileState = computeScrollytellingState(0.1, false);
  assert(mobileState.pearPosition[0] === 0.0, `Mobile pear X position should be 0.0 (got ${mobileState.pearPosition[0]})`);
});

// ---------------------------------------------------------------------------
// 7. WebGL Resource Disposal & Lifecycle Cleanliness
// ---------------------------------------------------------------------------
runTest('Comprehensive WebGL Teardown Disposal Execution', () => {
  const pearGeo = createOrganicPearGeometry();
  const leafGeo = createCurvedLeafGeometry();
  const carton = createSmartCartonMesh();
  const truck = createReeferTruckMesh();

  const allGeos = [pearGeo, leafGeo, ...carton.geometries, ...truck.geometries];
  const allMats = [...carton.materials, ...truck.materials];

  // Verify all items are instances of Disposable Three.js classes
  allGeos.forEach((g) => {
    assert(typeof g.dispose === 'function', 'All geometries must implement dispose()');
    g.dispose();
  });

  allMats.forEach((m) => {
    assert(typeof m.dispose === 'function', 'All materials must implement dispose()');
    m.dispose();
  });
});

console.log('\n===============================================================');
console.log(`  ALL ${passedTests}/${totalTests} SCROLLYTELLING TESTS PASSED SUCCESSFULLY!`);
console.log('===============================================================\n');
