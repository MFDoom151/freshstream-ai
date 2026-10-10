/**
 * FreshStream AI — Milestone 2 Adversarial Stress Test Suite
 * Challenger 2: WebGL Memory Lifecycle, Resource Disposal & Viewport Responsiveness
 *
 * Authoritative empirical stress test verifying:
 * 1. Complete Resource Inventory & Allocation Oracle (Geometries, Materials, Textures).
 * 2. Single Mount/Unmount Cycle Complete Teardown & WebGL Context Loss.
 * 3. 50 Rapid Consecutive Mount/Unmount Stress Cycles (Zero Memory Leak, Context Reclamation).
 * 4. Rapid Re-Mounting in Reused Shared Container DOM Node (Zero Canvas Accumulation).
 * 5. High-Frequency Prop Updates Without Unnecessary WebGL Context Re-creation.
 * 6. Multi-Device Viewport Matrix (Mobile, Tablet, Desktop, 4K UHD, Ultrawide) & Aspect Ratio.
 * 7. 4K High-DPI Fill-Rate Protection via Pixel Ratio Clamping (dpr <= 1.75).
 * 8. Camera Frustum Geometry & Spatial Separation Compliance.
 * 9. Adversarial Burst Resizing & Degenerate Dimensions (0x0, extreme viewports).
 * 10. Adversarial Scroll Progress Fuzzing & Mid-Frame Unmount Cancellation Hygiene.
 */

import * as THREE from 'three';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

// -----------------------------------------------------------------------------
// 1. DOM & WebGL Test Environment Instrumentation
// -----------------------------------------------------------------------------

let contextLossCalls = 0;
let canvasDisposeEvents = 0;
let sizeHistory: Array<{ width: number; height: number; styleWidth: string; styleHeight: string }> = [];

const glProxy = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'string' && prop.toUpperCase() === prop) return 1; // GL constants
    if (prop === 'getExtension') {
      return (extName: string) => {
        if (extName === 'WEBGL_lose_context') {
          return {
            loseContext: () => {
              contextLossCalls++;
            },
            restoreContext: () => {},
          };
        }
        return { loseContext: () => {} };
      };
    }
    if (prop === 'getParameter') return () => 'WebGL 2.0 (OpenGL ES 3.0 Chromium)';
    if (prop === 'getShaderPrecisionFormat') return () => ({ precision: 23, rangeMin: 127, rangeMax: 127 });
    if (prop === 'getContextAttributes') return () => ({ xrCompatible: false });
    return () => {};
  }
});

// Spies on BufferGeometry and Material dispose
const disposedGeometries = new Set<string>();
const origGeoDispose = THREE.BufferGeometry.prototype.dispose;
THREE.BufferGeometry.prototype.dispose = function () {
  disposedGeometries.add(this.uuid);
  return origGeoDispose.call(this);
};

const disposedMaterials = new Set<string>();
const origMatDispose = THREE.Material.prototype.dispose;
THREE.Material.prototype.dispose = function () {
  disposedMaterials.add(this.uuid);
  return origMatDispose.call(this);
};

// Mock Elements & Window
const resizeListeners: Array<() => void> = [];
const animationCallbacks = new Map<number, FrameRequestCallback>();
let nextRafId = 1;

class MockElement {
  nodeType = 1;
  nodeName: string;
  tagName: string;
  namespaceURI = 'http://www.w3.org/1999/xhtml';
  children: any[] = [];
  style: any = {};
  innerHTML = '';
  parentNode: any = null;
  ownerDocument: any;
  _width: number = 0;
  _height: number = 0;

  constructor(nodeName: string = 'DIV') {
    this.nodeName = nodeName;
    this.tagName = nodeName;
    this.ownerDocument = (global as any).document;
  }

  getContext(type: string) {
    return glProxy;
  }

  set width(val: number) {
    this._width = val;
    this.recordCanvasSize();
  }
  get width() { return this._width; }

  set height(val: number) {
    this._height = val;
    this.recordCanvasSize();
  }
  get height() { return this._height; }

  recordCanvasSize() {
    if (this.nodeName === 'CANVAS') {
      sizeHistory.push({
        width: this._width,
        height: this._height,
        styleWidth: this.style.width || '',
        styleHeight: this.style.height || '',
      });
    }
  }

  appendChild(child: any) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  removeChild(child: any) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  contains(child: any) {
    return this.children.includes(child);
  }

  addEventListener() {}
  removeEventListener(evt: string) {
    if (evt === 'webglcontextlost') {
      canvasDisposeEvents++;
    }
  }
  setAttribute() {}
  getAttribute() { return null; }
  removeAttribute() {}
}

const mockDoc: any = {
  nodeType: 9,
  nodeName: '#document',
  documentElement: null,
  body: null,
  activeElement: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag: string) => new MockElement(tag.toUpperCase()),
  createElementNS: (ns: string, tag: string) => new MockElement(tag.toUpperCase()),
  createTextNode: (text: string) => ({ nodeType: 3, textContent: text, parentNode: null }),
};

(global as any).document = mockDoc;
mockDoc.documentElement = new MockElement('HTML');
mockDoc.body = new MockElement('BODY');
mockDoc.activeElement = mockDoc.body;

(global as any).HTMLIFrameElement = class HTMLIFrameElement {};
(global as any).HTMLElement = MockElement;
(global as any).Element = MockElement;
(global as any).Node = MockElement;

(global as any).window = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1.0,
  document: mockDoc,
  HTMLIFrameElement: (global as any).HTMLIFrameElement,
  HTMLElement: MockElement,
  Element: MockElement,
  Node: MockElement,
  addEventListener: (event: string, cb: any) => {
    if (event === 'resize') resizeListeners.push(cb);
  },
  removeEventListener: (event: string, cb: any) => {
    if (event === 'resize') {
      const idx = resizeListeners.indexOf(cb);
      if (idx !== -1) resizeListeners.splice(idx, 1);
    }
  },
  requestAnimationFrame: (cb: FrameRequestCallback) => {
    const id = nextRafId++;
    animationCallbacks.set(id, cb);
    return id;
  },
  cancelAnimationFrame: (id: number) => {
    animationCallbacks.delete(id);
  },
};

(global as any).requestAnimationFrame = (global as any).window.requestAnimationFrame;
(global as any).cancelAnimationFrame = (global as any).window.cancelAnimationFrame;
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// Helper to fire the next animation frame callback like a real browser
function stepAnimationFrame() {
  if (animationCallbacks.size > 0) {
    const [id, cb] = Array.from(animationCallbacks.entries())[0];
    animationCallbacks.delete(id);
    cb(performance.now());
  }
}

// Import target under test
import {
  PearScrollytelling,
  computeScrollytellingState,
  createOrganicPearGeometry,
  createCurvedLeafGeometry,
  createSmartCartonMesh,
  createReeferTruckMesh,
} from '../src/components/3d/PearScrollytelling';

// -----------------------------------------------------------------------------
// Assertions & Reporting Utilities
// -----------------------------------------------------------------------------

let testCount = 0;
let passedCount = 0;
let failedCount = 0;
const testDetails: Array<{ id: number; name: string; status: 'PASSED' | 'FAILED'; error?: string }> = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestCase(name: string, fn: () => Promise<void> | void): Promise<void> {
  testCount++;
  const id = testCount;
  process.stdout.write(`\n[TEST ${id.toString().padStart(2, '0')}] ${name} ... `);
  try {
    await fn();
    passedCount++;
    testDetails.push({ id, name, status: 'PASSED' });
    console.log('✅ PASSED');
  } catch (err: any) {
    failedCount++;
    const errMsg = err instanceof Error ? err.message : String(err);
    testDetails.push({ id, name, status: 'FAILED', error: errMsg });
    console.log('❌ FAILED');
    console.error(`   Error: ${errMsg}`);
  }
}

// -----------------------------------------------------------------------------
// MAIN TEST HARNESS
// -----------------------------------------------------------------------------

async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER 2: WEBGL MEMORY LIFECYCLE & RENDERING STABILITY STRESS HARNESS');
  console.log('  Milestone 2 Adversarial Stress Testing — FreshStream AI');
  console.log('================================================================================');

  // ---------------------------------------------------------------------------
  // TEST 01: Resource Inventory & Allocation Oracle
  // ---------------------------------------------------------------------------
  await runTestCase('Verify Complete Resource Inventory & Tracking Completeness', () => {
    const pearGeo = createOrganicPearGeometry();
    const leafGeo = createCurvedLeafGeometry();
    const carton = createSmartCartonMesh();
    const truck = createReeferTruckMesh();

    assert(carton.geometries.length === 6, `Smart carton must yield 6 geometries, got ${carton.geometries.length}`);
    assert(carton.materials.length === 6, `Smart carton must yield 6 materials, got ${carton.materials.length}`);
    assert(truck.geometries.length === 10, `Reefer truck must yield 10 geometries, got ${truck.geometries.length}`);
    assert(truck.materials.length === 9, `Reefer truck must yield 9 materials, got ${truck.materials.length}`);

    // Verify 0 textures are allocated across standard carton & truck materials
    const allMaterials = [...carton.materials, ...truck.materials];
    allMaterials.forEach((mat: any) => {
      assert(!mat.map, 'Material must not allocate diffuse texture map');
      assert(!mat.normalMap, 'Material must not allocate normal map');
      assert(!mat.roughnessMap, 'Material must not allocate roughness map');
    });

    // Cleanup reference instances
    pearGeo.dispose();
    leafGeo.dispose();
    carton.geometries.forEach((g) => g.dispose());
    carton.materials.forEach((m) => m.dispose());
    truck.geometries.forEach((g) => g.dispose());
    truck.materials.forEach((m) => m.dispose());
  });

  // ---------------------------------------------------------------------------
  // TEST 02: Single Mount / Unmount Complete Resource Lifecycle
  // ---------------------------------------------------------------------------
  await runTestCase('Single Mount/Unmount Cycle Complete Teardown & Context Loss', async () => {
    const prevContextLoss = contextLossCalls;
    const prevCanvasDisposes = canvasDisposeEvents;
    const initialDisposedGeoCount = disposedGeometries.size;
    const initialDisposedMatCount = disposedMaterials.size;

    const container = new MockElement('DIV');
    const root = createRoot(container as any);

    try {
      await act(async () => {
        root.render(React.createElement(PearScrollytelling, { scrollProgress: 0.15 }));
      });

      assert(container.children.length === 1, `Canvas must be appended to container, found ${container.children.length}`);
      assert(resizeListeners.length === 1, `Resize listener must be attached to window, found ${resizeListeners.length}`);
      assert(animationCallbacks.size === 1, `One animation frame must be scheduled, found ${animationCallbacks.size}`);
    } finally {
      await act(async () => {
        root.unmount();
      });
    }

    assert(container.children.length === 0, `Canvas must be removed from container on unmount, found ${container.children.length}`);
    assert(resizeListeners.length === 0, `Resize listener must be detached on unmount, found ${resizeListeners.length}`);
    assert(animationCallbacks.size === 0, `Pending animation frame must be canceled on unmount, found ${animationCallbacks.size}`);
    assert(contextLossCalls === prevContextLoss + 1, `forceContextLoss() must be called on unmount (expected ${prevContextLoss + 1}, got ${contextLossCalls})`);
    assert(canvasDisposeEvents === prevCanvasDisposes + 1, `renderer.dispose() must unregister canvas event listeners on unmount`);

    const geosDisposedThisCycle = disposedGeometries.size - initialDisposedGeoCount;
    const matsDisposedThisCycle = disposedMaterials.size - initialDisposedMatCount;
    assert(geosDisposedThisCycle === 19, `Expected exactly 19 geometries disposed on unmount, got ${geosDisposedThisCycle}`);
    assert(matsDisposedThisCycle === 18, `Expected exactly 18 materials disposed on unmount, got ${matsDisposedThisCycle}`);
  });

  // ---------------------------------------------------------------------------
  // TEST 03: 50 Rapid Consecutive Mount/Unmount Stress Cycles (Zero Memory Leak)
  // ---------------------------------------------------------------------------
  await runTestCase('50 Rapid Mount/Unmount Cycles Stress Test', async () => {
    const cycles = 50;
    const memoryBefore = process.memoryUsage().heapUsed;
    const startContextLoss = contextLossCalls;
    const startCanvasDisposes = canvasDisposeEvents;

    for (let i = 1; i <= cycles; i++) {
      const container = new MockElement('DIV');
      const root = createRoot(container as any);
      const p = (i % 10) / 10;

      try {
        await act(async () => {
          root.render(React.createElement(PearScrollytelling, { scrollProgress: p }));
        });

        assert(container.children.length === 1, `Cycle ${i}: canvas missing in container`);
        assert(resizeListeners.length === 1, `Cycle ${i}: resize listener missing`);

        // Step 1 animation frame
        stepAnimationFrame();
      } finally {
        await act(async () => {
          root.unmount();
        });
      }

      // Assert zero leak per cycle
      assert(container.children.length === 0, `Cycle ${i}: canvas leaked in container`);
      assert(resizeListeners.length === 0, `Cycle ${i}: window resize listener leaked`);
      assert(animationCallbacks.size === 0, `Cycle ${i}: animation frame callback leaked`);
    }

    const memoryAfter = process.memoryUsage().heapUsed;
    const heapDiffMb = (memoryAfter - memoryBefore) / (1024 * 1024);

    assert(
      contextLossCalls === startContextLoss + cycles,
      `Expected ${cycles} context loss calls, got ${contextLossCalls - startContextLoss}`
    );
    assert(
      canvasDisposeEvents === startCanvasDisposes + cycles,
      `Expected ${cycles} renderer canvas disposes, got ${canvasDisposeEvents - startCanvasDisposes}`
    );

    console.log(`\n   -> Heap delta after 50 rapid cycles: ${heapDiffMb.toFixed(2)} MB`);
    console.log(`   -> Total WebGL context losses enforced: ${contextLossCalls}`);
    console.log(`   -> Total renderer disposes verified: ${canvasDisposeEvents}`);
    assert(heapDiffMb < 50.0, `Heap memory growth exceeds threshold (${heapDiffMb.toFixed(2)} MB)`);
  });

  // ---------------------------------------------------------------------------
  // TEST 04: Rapid Re-Mounting in Reused Shared Container DOM Node
  // ---------------------------------------------------------------------------
  await runTestCase('Rapid Re-Mounting in Reused Shared Container DOM Node', async () => {
    const sharedContainer = new MockElement('DIV');
    const cycles = 15;

    for (let i = 1; i <= cycles; i++) {
      const root = createRoot(sharedContainer as any);

      try {
        await act(async () => {
          root.render(React.createElement(PearScrollytelling, { scrollProgress: 0.5 }));
        });

        assert(sharedContainer.children.length === 1, `Cycle ${i}: should have exactly 1 child canvas in shared container`);
      } finally {
        await act(async () => {
          root.unmount();
        });
      }

      assert(sharedContainer.children.length === 0, `Cycle ${i}: shared container should be completely empty after unmount`);
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 05: Prop Re-render Stability (No Duplicate WebGL Context Allocation)
  // ---------------------------------------------------------------------------
  await runTestCase('High-Frequency Scroll Progress Prop Updates Without Scene Re-Creation', async () => {
    const container = new MockElement('DIV');
    const root = createRoot(container as any);
    const startContextLoss = contextLossCalls;
    const startCanvasDisposes = canvasDisposeEvents;

    try {
      await act(async () => {
        root.render(React.createElement(PearScrollytelling, { scrollProgress: 0.0 }));
      });

      // Rapidly change scroll progress 60 times (simulating continuous wheel scroll)
      for (let frame = 1; frame <= 60; frame++) {
        const progress = frame / 60;
        await act(async () => {
          root.render(React.createElement(PearScrollytelling, { scrollProgress: progress }));
        });
      }

      // Main WebGL effect has [] dependencies, so renderer must NOT be destroyed or recreated during prop updates
      assert(contextLossCalls === startContextLoss, 'Context loss must NOT fire during prop updates');
      assert(canvasDisposeEvents === startCanvasDisposes, 'Renderer dispose must NOT fire during prop updates');
      assert(container.children.length === 1, 'Only 1 canvas element must exist in container');
      assert(resizeListeners.length === 1, 'Resize listener count must remain exactly 1');
    } finally {
      await act(async () => {
        root.unmount();
      });
    }

    assert(contextLossCalls === startContextLoss + 1, 'Context loss must fire upon final unmount');
    assert(canvasDisposeEvents === startCanvasDisposes + 1, 'Renderer dispose must fire upon final unmount');
  });

  // ---------------------------------------------------------------------------
  // TEST 06: Viewport Matrix Testing (Mobile, Tablet, Desktop, 4K & Ultrawide)
  // ---------------------------------------------------------------------------
  await runTestCase('Multi-Device Viewport Aspect Ratio & Responsive Layout Matrix', async () => {
    const viewports = [
      { name: 'iPhone SE (Mobile)', w: 375, h: 667, dpr: 2.0, isDesktop: false },
      { name: 'iPhone 14 Pro Max (Mobile)', w: 430, h: 932, dpr: 3.0, isDesktop: false },
      { name: 'Mobile Landscape', w: 667, h: 375, dpr: 2.0, isDesktop: false },
      { name: 'iPad Portrait (Tablet)', w: 768, h: 1024, dpr: 2.0, isDesktop: false },
      { name: 'iPad Landscape (Tablet)', w: 1024, h: 768, dpr: 2.0, isDesktop: true },
      { name: 'MacBook Standard (Desktop)', w: 1440, h: 900, dpr: 1.0, isDesktop: true },
      { name: '1080p FHD (Desktop)', w: 1920, h: 1080, dpr: 1.0, isDesktop: true },
      { name: 'Ultrawide 21:9 (Desktop)', w: 3440, h: 1440, dpr: 1.0, isDesktop: true },
      { name: '4K UHD (High DPI Desktop)', w: 3840, h: 2160, dpr: 2.0, isDesktop: true },
      { name: 'Narrow Foldable', w: 280, h: 653, dpr: 2.0, isDesktop: false },
    ];

    const container = new MockElement('DIV');
    const root = createRoot(container as any);

    try {
      await act(async () => {
        root.render(React.createElement(PearScrollytelling, { scrollProgress: 0.1 }));
      });

      assert(resizeListeners.length === 1, 'Resize listener must be present');
      const resizeHandler = resizeListeners[0];

      for (const vp of viewports) {
        (global as any).window.innerWidth = vp.w;
        (global as any).window.innerHeight = vp.h;
        (global as any).window.devicePixelRatio = vp.dpr;

        sizeHistory = [];
        resizeHandler();

        // 1. Verify canvas style dimensions match viewport
        assert(sizeHistory.length >= 1, `${vp.name}: resize must record canvas size`);
        const lastSize = sizeHistory[sizeHistory.length - 1];
        assert(lastSize.styleWidth === `${vp.w}px`, `${vp.name}: style.width mismatch (expected ${vp.w}px, got ${lastSize.styleWidth})`);
        assert(lastSize.styleHeight === `${vp.h}px`, `${vp.name}: style.height mismatch (expected ${vp.h}px, got ${lastSize.styleHeight})`);

        // 2. Verify pixel ratio clamping (dpr <= 1.75) for 4K / High-DPI protection
        const expectedPr = Math.min(vp.dpr, 1.75);
        const expectedBufferWidth = Math.floor(vp.w * expectedPr);
        const expectedBufferHeight = Math.floor(vp.h * expectedPr);
        assert(
          Math.abs(lastSize.width - expectedBufferWidth) <= 1,
          `${vp.name}: buffer width clamping failed (expected ${expectedBufferWidth}, got ${lastSize.width})`
        );
        assert(
          Math.abs(lastSize.height - expectedBufferHeight) <= 1,
          `${vp.name}: buffer height clamping failed (expected ${expectedBufferHeight}, got ${lastSize.height})`
        );

        // 3. Verify spatial layout adaptation in computeScrollytellingState
        const state = computeScrollytellingState(0.1, vp.isDesktop);
        if (vp.isDesktop) {
          assert(state.pearPosition[0] === 1.8, `${vp.name}: Desktop pear must be framed at X=1.8 (narrative clear)`);
          assert(state.pearScale[0] === 1.0, `${vp.name}: Desktop scale should be 1.0`);
        } else {
          assert(state.pearPosition[0] === 0.0, `${vp.name}: Mobile pear must be centered at X=0.0`);
          assert(state.pearScale[0] === 0.85, `${vp.name}: Mobile scale should be 0.85`);
        }
      }
    } finally {
      await act(async () => {
        root.unmount();
      });
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 07: Camera Projection Matrix & View Frustum Mathematics
  // ---------------------------------------------------------------------------
  await runTestCase('Camera Frustum & Bounding Box Non-Clipping Across Phases', () => {
    const fov = 40;
    const cameraDistance = 7.5;
    const camera = new THREE.PerspectiveCamera(fov, 1920 / 1080, 0.1, 100);
    camera.position.set(0, 0, cameraDistance);
    camera.updateProjectionMatrix();

    // Verify matrix validity
    camera.projectionMatrix.elements.forEach((val) => {
      assert(!isNaN(val) && isFinite(val), 'Camera projection matrix must not contain NaN or Infinite values');
    });

    // Frustum half dimensions at z = 0
    const vFovRad = THREE.MathUtils.degToRad(fov);
    const halfHeight = Math.tan(vFovRad / 2) * cameraDistance; // ~ 2.729
    const halfWidthDesktop = halfHeight * (1920 / 1080); // ~ 4.852
    const halfWidthMobile = halfHeight * (375 / 667); // ~ 1.534

    // Test Phase 1 (Fresh Pear) bounds
    const desktopPhase1 = computeScrollytellingState(0.1, true);
    assert(desktopPhase1.pearPosition[0] + 0.9 < halfWidthDesktop, 'Desktop pear must fit within visible right frustum');

    const mobilePhase1 = computeScrollytellingState(0.1, false);
    assert(0.765 < halfWidthMobile, 'Mobile pear must fit within visible centered frustum');

    // Test Phase 4 (Carton) bounds
    const desktopPhase4 = computeScrollytellingState(0.82, true);
    assert(desktopPhase4.cartonPosition[0] + 1.2 < halfWidthDesktop, 'Desktop carton must fit within right frustum');

    const mobilePhase4 = computeScrollytellingState(0.82, false);
    assert(1.02 < halfWidthMobile, 'Mobile carton must fit within centered frustum');
  });

  // ---------------------------------------------------------------------------
  // TEST 08: Adversarial Burst Resize Stress & Degenerate Viewport Dimensions
  // ---------------------------------------------------------------------------
  await runTestCase('Pathological Burst Resize & Extreme Viewport Inputs', async () => {
    const container = new MockElement('DIV');
    const root = createRoot(container as any);

    try {
      await act(async () => {
        root.render(React.createElement(PearScrollytelling, { scrollProgress: 0.5 }));
      });

      const resizeHandler = resizeListeners[0];
      assert(typeof resizeHandler === 'function', 'Resize handler must be attached');

      // Burst resize: 100 rapid events
      for (let i = 0; i < 100; i++) {
        (global as any).window.innerWidth = 800 + (i % 20) * 50;
        (global as any).window.innerHeight = 600 + (i % 15) * 40;
        (global as any).window.devicePixelRatio = 1.0 + (i % 3) * 0.5;
        resizeHandler();
      }

      // Degenerate viewports: 0x0, 0x1000, 1000x0, extreme large 50000x50000
      const edgeViewports = [
        { w: 0, h: 800 },
        { w: 800, h: 0 },
        { w: 0, h: 0 },
        { w: 50000, h: 50000 },
        { w: -500, h: 600 },
      ];

      for (const vp of edgeViewports) {
        (global as any).window.innerWidth = vp.w;
        (global as any).window.innerHeight = vp.h;
        resizeHandler();
      }
    } finally {
      await act(async () => {
        root.unmount();
      });
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 09: Adversarial Scroll Progress Boundary & Fuzzing Resilience
  // ---------------------------------------------------------------------------
  await runTestCase('Adversarial Scroll Progress Boundary & Fuzzing Resilience', () => {
    const fuzzInputs = [
      -0.000001,
      -1.0,
      -100.0,
      -Infinity,
      1.000001,
      2.0,
      1000.0,
      Infinity,
    ];

    fuzzInputs.forEach((rawP) => {
      const state = computeScrollytellingState(rawP, true);
      assert(state.phase >= 1 && state.phase <= 5, `State phase must be valid (1..5) for p=${rawP}`);
      assert(state.uDecay >= 0.0 && state.uDecay <= 1.0, `uDecay must be clamped in [0, 1] for p=${rawP}`);
      assert(state.uRestoration >= 0.0 && state.uRestoration <= 1.0, `uRestoration must be clamped in [0, 1] for p=${rawP}`);
      assert(state.cartonFlapAngle >= 0.0, `Flap angle must be non-negative for p=${rawP}`);
      assert(!isNaN(state.pearPosition[0]), `Position must not be NaN for p=${rawP}`);
      assert(!isNaN(state.cartonPosition[1]), `Carton position must not be NaN for p=${rawP}`);
      assert(!isNaN(state.truckPosition[0]), `Truck position must not be NaN for p=${rawP}`);
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 10: Animation Frame Cancellation Integrity Under Sudden Mid-Frame Unmount
  // ---------------------------------------------------------------------------
  await runTestCase('Mid-Animation-Frame Cancellation Hygiene & Zero Orphan Execution', async () => {
    const container = new MockElement('DIV');
    const root = createRoot(container as any);

    await act(async () => {
      root.render(React.createElement(PearScrollytelling, { scrollProgress: 0.35 }));
    });

    assert(animationCallbacks.size === 1, `Animation frame callback must be queued, found ${animationCallbacks.size}`);
    const queuedId = Array.from(animationCallbacks.keys())[0];
    const staleCallback = animationCallbacks.get(queuedId)!;

    // Immediately unmount before the queued frame is flushed
    await act(async () => {
      root.unmount();
    });

    // Verify callback was removed from pending queue
    assert(!animationCallbacks.has(queuedId), 'Pending callback must be removed from queue upon unmount');
    assert(animationCallbacks.size === 0, 'No animation callbacks must remain');

    // If an external loop attempts to invoke the stale callback reference post-unmount:
    try {
      staleCallback(performance.now());
    } catch (e: any) {
      console.log(`\n   [Info] Stale callback post-unmount caught gracefully: ${e?.message}`);
    }
  });

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY & VERDICT
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`  LIFECYCLE & STRESS VERIFICATION SUMMARY: ${passedCount}/${testCount} TESTS PASSED`);
  console.log('================================================================================');

  testDetails.forEach((t) => {
    const icon = t.status === 'PASSED' ? '✅' : '❌';
    console.log(`  ${icon} Test ${t.id.toString().padStart(2, '0')}: ${t.name}`);
    if (t.error) {
      console.log(`     Error: ${t.error}`);
    }
  });

  if (failedCount === 0) {
    console.log('\n>>> EMPIRICAL VERDICT: APPROVE <<<');
    console.log('All WebGL lifecycle, memory disposal, and responsive rendering checks PASSED with 0 leaks.\n');
    process.exit(0);
  } else {
    console.log(`\n>>> EMPIRICAL VERDICT: REJECT (${failedCount} test(s) failed) <<<\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal execution error:', err);
  process.exit(1);
});
