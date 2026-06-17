export const WORLD_SIZE = 60;
export const MAX_POP = 600;

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
}

export interface StepResult {
  counts: Record<AgentState, number>;
  transmissions: Array<[number, number, number, number]>;
  newInfections: number;
}

export function createAgents(population: number, vacRate: number): Agent[] {
  const n = Math.min(population, MAX_POP);
  return Array.from({ length: n }, (_, i) => {
    const state: AgentState = i === 0 ? 'I' : Math.random() < vacRate ? 'V' : 'S';
    const [r, g, b] = STATE_COLOR[state];
    const socialGroup = Math.floor(Math.random() * 6);
    const groupCenterX = 10 + (socialGroup % 3) * 20;
    const groupCenterY = 10 + Math.floor(socialGroup / 3) * 20;
    const homeX = Math.max(2, Math.min(WORLD_SIZE - 2, groupCenterX + (Math.random() - 0.5) * 12));
    const homeY = Math.max(2, Math.min(WORLD_SIZE - 2, groupCenterY + (Math.random() - 0.5) * 12));
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
    };
  });
}

const CELL = 5;
const GW = Math.ceil(WORLD_SIZE / CELL);

export function stepAgents(agents: Agent[], tick: number, params: SimParams, dt: number): StepResult {
  const BASE_SPEED = 0.13;
  const effectiveBeta = params.contagion * (1 - params.maskUsage * 0.65) * dt * 55;
  const infectRadius = 2.4 * (1 - params.distancing * 0.6);
  const recoveryTicks = params.recoveryDays * 30;

  const grid: number[][] = Array.from({ length: GW * GW }, () => []);
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const cx = Math.min(GW - 1, Math.max(0, Math.floor(a.x / CELL)));
    const cy = Math.min(GW - 1, Math.max(0, Math.floor(a.y / CELL)));
    grid[cy * GW + cx].push(i);
  }

  for (const a of agents) {
    const gx = 10 + (a.socialGroup % 3) * 20;
    const gy = 10 + Math.floor(a.socialGroup / 3) * 20;
    a.vx += (gx - a.x) * 0.0004 + (Math.random() - 0.5) * 0.1;
    a.vy += (gy - a.y) * 0.0004 + (Math.random() - 0.5) * 0.1;

    const spd = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    const maxSpd = BASE_SPEED * a.mobility * (1 - params.distancing * 0.55);
    if (spd > maxSpd) { a.vx = (a.vx / spd) * maxSpd; a.vy = (a.vy / spd) * maxSpd; }

    a.vx *= 0.97; a.vy *= 0.97;
    a.x += a.vx; a.y += a.vy;

    if (a.x < 1) { a.x = 1; a.vx = Math.abs(a.vx); }
    if (a.x > WORLD_SIZE - 1) { a.x = WORLD_SIZE - 1; a.vx = -Math.abs(a.vx); }
    if (a.y < 1) { a.y = 1; a.vy = Math.abs(a.vy); }
    if (a.y > WORLD_SIZE - 1) { a.y = WORLD_SIZE - 1; a.vy = -Math.abs(a.vy); }
  }

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
              if (transmissions.length < 8) transmissions.push([a.x, a.y, b.x, b.y]);
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

  for (const a of agents) {
    if (a.state === 'I' && tick - a.infectedTick > recoveryTicks) {
      a.state = 'R';
      const [r, g, b2] = STATE_COLOR.R;
      a.r = r; a.g = g; a.b = b2;
    }
  }

  const counts: Record<AgentState, number> = { S: 0, I: 0, R: 0, V: 0 };
  for (const a of agents) counts[a.state]++;

  return { counts, transmissions, newInfections };
}

export function computeR0(params: SimParams): number {
  return Math.max(0, params.contagion * (1 - params.maskUsage * 0.65) * (1 - params.distancing * 0.6) * 3.8);
}
