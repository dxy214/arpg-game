import type { PlayerForm } from '../gameplay';

export type QaScenarioId = 'roam' | 'elite' | 'boss' | 'collision';

export interface QaScenario {
  readonly id: string;
  readonly purpose: string;
  readonly query: string;
  readonly scenario: QaScenarioId;
  readonly form: PlayerForm;
  readonly godMode: boolean;
}

/**
 * Canonical, deterministic entry points used by manual and automated QA.
 * These are intentionally plain query strings so they work in dev and static previews.
 */
export const QA_SCENARIOS = [
  { id: 'roam-nightbound', purpose: 'Default world traversal and first combat pack', query: '', scenario: 'roam', form: 'nightbound', godMode: false },
  { id: 'collision-gate', purpose: 'Swept movement, wall sliding, dash blocking, and character separation at the boss gate', query: '?scenario=collision&god=1', scenario: 'collision', form: 'nightbound', godMode: true },
  { id: 'elite-wraith', purpose: 'Elite readability with the ranged/phase form', query: '?scenario=elite&form=wraith', scenario: 'elite', form: 'wraith', godMode: false },
  { id: 'elite-dreadwolf', purpose: 'Elite pursuit, pounce, and rend pressure', query: '?scenario=elite&form=dreadwolf', scenario: 'elite', form: 'dreadwolf', godMode: false },
  { id: 'elite-stonewrought', purpose: 'Elite mitigation, charge, and crush pressure', query: '?scenario=elite&form=stonewrought', scenario: 'elite', form: 'stonewrought', godMode: false },
  { id: 'boss-nightbound', purpose: 'Normal boss entry and death/restart path', query: '?scenario=boss', scenario: 'boss', form: 'nightbound', godMode: false },
  { id: 'boss-wraith-god', purpose: 'Long phase-two and spectral-fracture inspection', query: '?scenario=boss&form=wraith&god=1', scenario: 'boss', form: 'wraith', godMode: true },
  { id: 'boss-dreadwolf-god', purpose: 'Long phase-one and rend-fracture inspection', query: '?scenario=boss&form=dreadwolf&god=1', scenario: 'boss', form: 'dreadwolf', godMode: true },
  { id: 'boss-stonewrought-god', purpose: 'Worst-case phase-three hazard and crush inspection', query: '?scenario=boss&form=stonewrought&god=1', scenario: 'boss', form: 'stonewrought', godMode: true },
  { id: 'boss-performance', purpose: 'Arm visible 30-second phase-three telemetry; press P after reaching the stress case', query: '?scenario=boss&form=stonewrought&god=1&perf=1', scenario: 'boss', form: 'stonewrought', godMode: true },
  { id: 'render-baseline', purpose: 'Blank-runtime ceiling for browser and renderer comparison', query: '?perf=1&baseline=1', scenario: 'roam', form: 'nightbound', godMode: false },
] as const satisfies readonly QaScenario[];

export const QA_SCENARIO_URLS = QA_SCENARIOS.map(({ id, query }) => ({ id, path: `/${query}` }));
