export const WORLD_SIZE = 60;
export const MAX_POP = 800;
// With tick accumulator: simSpeed=1 → 60 steps/s, simSpeed=0.4 → 24 steps/s
// 1 game-day = 120 ticks → at simSpeed=0.5 that's 120/30fps = 4 real seconds per day
export const TICKS_PER_DAY = 120;

export type AgentState = 'S' | 'I' | 'R' | 'V';

export interface Agent {
  x: number; y: number;
  vx: number; vy: number;
  state: AgentState;
  infectedTick: number;
  r: number; g: number; b: number;
  age: number;
  maskUsage: boolean;
  mobility: number;
  homeX: number; homeY: number;
  workX: number; workY: number;
  socialGroup: number;
  district: number; // 0=centro, 1=norte, 2=sur
}

export const STATE_COLOR: Record<AgentState, [number, number, number]> = {
  S: [0.133, 0.773, 0.369],
  I: [0.937, 0.267, 0.267],
  R: [0.957, 0.620, 0.043],
  V: [0.231, 0.510, 0.965],
};

export interface SimParams {
  contagion: number;
  maskUsage: number;
  distancing: number;
  vacRate: number;
  recoveryDays: number;
  population: number;
  // Fun params
  mutationRate: number;   // 0-1: virus mutates each tick → increases contagion slowly
  hospitalLevel: number;  // 0-1: reduces recovery time up to 50%
  quarantine: number;     // 0-1: hard lockdown — reduces mobility dramatically
  temperature: number;    // -1(winter) to 1(summer): affects contagion
}

export interface StepResult {
  counts: Record<AgentState, number>;
  transmissions: Array<[number, number, number, number]>;
  newInfections: number;
  currentContagion: number;
}

// 3 districts with clear separation
// District 0 (Centro): agent coords ~25-35, 25-35  → 3D ~-5..+5, -5..+5
// District 1 (Norte):  agent coords ~10-50, 5-15   → 3D ~-20..+20, -25..-15
// District 2 (Sur):    agent coords ~10-50, 45-55  → 3D ~-20..+20, +15..+25
const DISTRICT_CENTERS: Array<[number, number]> = [
  [30, 30], // Centro
  [30, 10], // Norte
  [30, 50], // Sur
];

const GROUP_TO_DISTRICT = [0, 0, 1, 1, 2, 2];

// Agent mutation state (module-level mutable, reset each call to createAgents)
let _currentContagion = 0.55;

export function createAgents(population: number, vacRate: number, baseContagion: number): Agent[] {
  _currentContagion = baseContagion;
  const n = Math.min(population, MAX_POP);
  return Array.from({ length: n }, (_, i) => {
    const state: AgentState = i === 0 ? 'I' : Math.random() < vacRate ? 'V' : 'S';
    const [r, g, b] = STATE_COLOR[state];
    const socialGroup = Math.floor(Math.random() * 6);
    const district = GROUP_TO_DISTRICT[socialGroup];
    const [dcx, dcy] = DISTRICT_CENTERS[district];
    // Spread within district
    const homeX = Math.max(2, Math.min(WORLD_SIZE - 2, dcx + (Math.random() - 0.5) * 18));
    const homeY = Math.max(2, Math.min(WORLD_SIZE - 2, dcy + (Math.random() - 0.5) * 10));
    return {
      x: homeX + (Math.random() - 0.5) * 4,
      y: homeY + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      state,
      infectedTick: state === 'I' ? 0 : -1,
      r, g, b,
      age: Math.floor(Math.random() * 70) + 10,
      maskUsage: Math.random() < 0.2,
      mobility: 0.6 + Math.random() * 0.9,
      homeX, homeY,
      workX: Math.random() * (WORLD_SIZE - 4) + 2,
      workY: Math.random() * (WORLD_SIZE - 4) + 2,
      socialGroup,
      district,
    };
  });
}

const CELL = 5;
const GW = Math.ceil(WORLD_SIZE / CELL);

export function stepAgents(agents: Agent[], tick: number, params: SimParams): StepResult {
  const BASE_SPEED = 0.055; // slower agents

  // Mutation: contagion slowly drifts up
  if (params.mutationRate > 0 && tick > 0 && tick % 10 === 0) {
    _currentContagion = Math.min(1, _currentContagion + params.mutationRate * 0.003);
  }

  // Temperature effect: winter → more contagion, summer → less
  const tempFactor = 1 - params.temperature * 0.25;

  // Hospital: reduces recovery time
  const recoveryTicks = params.recoveryDays * TICKS_PER_DAY * (1 - params.hospitalLevel * 0.5);

  // Quarantine: drastically reduces mobility
  const mobilityMultiplier = 1 - params.quarantine * 0.85;

  // Fixed probability per tick (not per second) — simSpeed controls how many ticks advance per frame
  // 0.003 base gives R₀≈2.5 for contagion=0.55, recovery=14d, TICKS_PER_DAY=90
  const effectiveBeta = _currentContagion * (1 - params.maskUsage * 0.65) * tempFactor * 0.003;
  const infectRadius = 2.0 * (1 - params.distancing * 0.6);

  // Spatial grid
  const grid: number[][] = Array.from({ length: GW * GW }, () => []);
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const cx = Math.min(GW - 1, Math.max(0, Math.floor(a.x / CELL)));
    const cy = Math.min(GW - 1, Math.max(0, Math.floor(a.y / CELL)));
    grid[cy * GW + cx].push(i);
  }

  // Move agents
  for (const a of agents) {
    const [dcx, dcy] = DISTRICT_CENTERS[a.district];
    // Attraction toward district center (weaker than before to allow inter-district spread)
    a.vx += (dcx - a.x) * 0.0003 + (Math.random() - 0.5) * 0.1;
    a.vy += (dcy - a.y) * 0.0003 + (Math.random() - 0.5) * 0.1;

    const spd = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    const maxSpd = BASE_SPEED * a.mobility * (1 - params.distancing * 0.55) * mobilityMultiplier;
    if (spd > maxSpd && maxSpd > 0) { a.vx = (a.vx / spd) * maxSpd; a.vy = (a.vy / spd) * maxSpd; }

    a.vx *= 0.97; a.vy *= 0.97;
    a.x += a.vx; a.y += a.vy;

    if (a.x < 1) { a.x = 1; a.vx = Math.abs(a.vx); }
    if (a.x > WORLD_SIZE - 1) { a.x = WORLD_SIZE - 1; a.vx = -Math.abs(a.vx); }
    if (a.y < 1) { a.y = 1; a.vy = Math.abs(a.vy); }
    if (a.y > WORLD_SIZE - 1) { a.y = WORLD_SIZE - 1; a.vy = -Math.abs(a.vy); }
  }

  // Infection
  const toInfect: number[] = [];
  const transmissions: Array<[number, number, number, number]> = [];

  for (const a of agents) {
    if (a.state !== 'I') continue;
    const cx = Math.min(GW - 1, Math.max(0, Math.floor(a.x / CELL)));
    const cy = Math.min(GW - 1, Math.max(0, Math.floor(a.y / CELL)));
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= GW || ny < 0 || ny >= GW) continue;
        for (const j of grid[ny * GW + nx]) {
          const b = agents[j];
          if (b.state !== 'S') continue;
          const ddx = b.x - a.x, ddy = b.y - a.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < infectRadius && dist > 0) {
            const maskFactor = (a.maskUsage ? 0.4 : 1) * (b.maskUsage ? 0.5 : 1);
            if (Math.random() < effectiveBeta * maskFactor) {
              toInfect.push(j);
              if (transmissions.length < 10) transmissions.push([a.x, a.y, b.x, b.y]);
            }
          }
        }
      }
    }
  }

  let newInfections = 0;
  for (const idx of toInfect) {
    if (agents[idx].state === 'S') {
      agents[idx].state = 'I';
      agents[idx].infectedTick = tick;
      const [r, g, b] = STATE_COLOR.I;
      agents[idx].r = r; agents[idx].g = g; agents[idx].b = b;
      newInfections++;
    }
  }

  // Recovery
  for (const a of agents) {
    if (a.state === 'I' && tick - a.infectedTick > recoveryTicks) {
      a.state = 'R';
      const [r, g, b2] = STATE_COLOR.R;
      a.r = r; a.g = g; a.b = b2;
    }
  }

  const counts: Record<AgentState, number> = { S: 0, I: 0, R: 0, V: 0 };
  for (const a of agents) counts[a.state]++;

  return { counts, transmissions, newInfections, currentContagion: _currentContagion };
}

export function computeR0(params: SimParams): number {
  const tempFactor = 1 - params.temperature * 0.25;
  return Math.max(0, params.contagion * (1 - params.maskUsage * 0.65) * (1 - params.distancing * 0.6) * tempFactor * 3.8);
}
