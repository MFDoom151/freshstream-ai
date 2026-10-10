# E2E Test Infra: FreshStream AI Overhaul

## Test Philosophy
- Requirement-driven, opaque-box testing derived directly from `ORIGINAL_REQUEST.md` (Follow-up 2026-10-10T15:22:00Z).
- Systematic 4-tier verification methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World End-to-End Workload Testing.
- Real browser verification using Chrome DevTools MCP on the live running application.

---

## Feature Inventory Coverage Matrix

| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
|---|---------|-------------|:-----------------:|:-----------------:|:---------------------:|:-------------------:|
| 1 | Full-screen 3D Pear Canvas | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 2 | Apple-like Stylized Pear Geometry | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 3 | 5-Stage Rot & Recovery Storytelling | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 4 | Packaging & Truck Dispatch | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 5 | Reversible Scroll Scrubbing | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 6 | WCAG AA Text Contrast over 3D | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 7 | Zero WebGL & Console Errors | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 8 | SSE Stream Cleanup & Cancel Hooks | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 9 | Client SSE Lifecycle & Error Cap | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 10 | Route Latency (<5s, no socket stalls) | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 11 | Missing `/dashboard/shipments` Route | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 12 | Navigation Loop Repeated 2x | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 13 | Neon & Vomit Glow Removal | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 14 | Restrained Enterprise Typography & Colors | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 15 | Light-Mode Contrast Compliance | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 16 | Trilingual i18n 100% Key Parity | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 17 | Dedicated Interactive `/demo` Route | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 18 | Middle Corridor Real Geographic Map | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 19 | 5 Animated Transport Modes | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 20 | Cargo Condition Controls & Excursions | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 21 | Logistics Standards (DCSA/SMGS/AIS) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 22 | Academic & University Independence | R5 | 5 tests | 5 tests | ✓ | ✓ |

---

## Test Architecture & Runners

1. **Static Analysis & Type Hygiene**:
   - `npm run type-check` (`tsc --noEmit`)
   - `npm run build` (Next.js production build)
2. **Negative Audit (Independence)**:
   - `git grep -niE "satbayev|сатпаев|gwu|george washington|\bGW\b"` over `src/` and `README.md`
3. **i18n Parity Audit**:
   - `npx tsx scripts/check-i18n-parity.ts` (verifies 100% key parity across EN, RU, KZ)
4. **SSE Socket & Rapid Navigation Harness**:
   - Automated script `scripts/verify-stability.ts` testing 20 rapid SSE connect/disconnect cycles, socket exhaustion limits, and route response times (<5s)
5. **Real Browser Verification Harness (Chrome DevTools MCP / Playwright)**:
   - Full-viewport canvas verification (width/height matching viewport, z-index -10).
   - Scroll scrubbing captured at 0%, 35%, 65%, 85%, 100% and reverse-scroll verification.
   - Rapid navigation loop across 9 routes repeated twice under 5s with zero console errors.
   - Interactive demo map mode switching and cargo condition slider updates.
   - Screenshots output to `docs/screenshots/`.
