export const WORLD_SIZE = 60;
export const MAX_POP = 400;

export type AgentState = 'S' | 'I' | 'R' | 'V';

export interface Agent {
  x: number; y: number;
  vx: number; vy: number;
  state: AgentState;
  infectedTick: number;
  r: number; g: number; b: number;
}

export const STATE_COLOR: Record<AgentState, [number, number, number]> = {
  S: [0.133, 0.773, 0.369],  // #22c55e green
  I: [0.937, 0.267, 0.267],  // #ef4444 red
  R: [0.957, 0.620, 0.043],  // #f59e0b amber
  V: [0.231, 0.510, 0.965],  // #3b82f6 blue
};

export interface StepResult {
  counts: Record<AgentState, number>;
  transmissions: Array<[number, number, number, number]>;
}

export interface SimParams {
  contagion: number;
  maskUsage: number;
  distancing: number;
  vacRate: number;
  recoveryDays: number;
  population: number;
}

export function createAgents(population: number, vacRate: number): Agent[] {
  const count = Math.min(Math.round(population), MAX_POP);
  const agents: Agent[] = [];

  for (let i = 0; i < count; i++) {
    let state: AgentState;
    if (i === 0) {
      state = 'I';
    } else if (Math.random() < vacRate) {
      state = 'V';
    } else {
      state = 'S';
    }

    const [r, g, b] = STATE_COLOR[state];
    agents.push({
      x: 2 + Math.random() * (WORLD_SIZE - 4),
      y: 2 + Math.random() * (WORLD_SIZE - 4),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      state,
      infectedTick: state === 'I' ? 0 : -1,
      r, g, b,
    });
  }

  return agents;
}

export function stepAgents(
  agents: Agent[],
  tick: number,
  params: SimParams,
  dt: number,
): StepResult {
  const frameScale = dt * 60;
  const baseSpeed = 0.10 * (1 - params.distancing * 0.55) * frameScale;
  const infectRadius = 2.4 * (1 - params.distancing * 0.6);
  const infectR2 = infectRadius * infectRadius;
  const effectiveBeta = params.contagion * (1 - params.maskUsage * 0.7) * frameScale;
  const recoveryTicks = Math.round(params.recoveryDays * 30);

  // ── Move ──────────────────────────────────────────────────────────
  for (const a of agents) {
    a.vx += (Math.random() - 0.5) * 0.03 * frameScale;
    a.vy += (Math.random() - 0.5) * 0.03 * frameScale;

    // Social distancing repulsion
    if (params.distancing > 0.05) {
      const repelR = 2.8 * params.distancing;
      const repelR2 = repelR * repelR;
      for (const b of agents) {
        if (a === b) continue;
        const dx = a.x - b.x;
        if (Math.abs(dx) > repelR) continue;
        const dy = a.y - b.y;
        if (Math.abs(dy) > repelR) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 < repelR2 && d2 > 0.001) {
          const d = Math.sqrt(d2);
          const f = (repelR - d) / repelR * 0.015 * frameScale;
          a.vx += (dx / d) * f;
          a.vy += (dy / d) * f;
        }
      }
    }

    a.vx *= 0.92;
    a.vy *= 0.92;

    const spd = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    if (spd > baseSpeed && spd > 0) {
      a.vx = (a.vx / spd) * baseSpeed;
      a.vy = (a.vy / spd) * baseSpeed;
    }
    if (spd < 0.001) {
      a.vx = (Math.random() - 0.5) * 0.02;
      a.vy = (Math.random() - 0.5) * 0.02;
    }

    a.x += a.vx;
    a.y += a.vy;

    if (a.x < 1) { a.x = 1; a.vx = Math.abs(a.vx); }
    if (a.x > WORLD_SIZE - 1) { a.x = WORLD_SIZE - 1; a.vx = -Math.abs(a.vx); }
    if (a.y < 1) { a.y = 1; a.vy = Math.abs(a.vy); }
    if (a.y > WORLD_SIZE - 1) { a.y = WORLD_SIZE - 1; a.vy = -Math.abs(a.vy); }
  }

  // ── Infect ────────────────────────────────────────────────────────
  const transmissions: Array<[number, number, number, number]> = [];
  const toInfect = new Set<Agent>();

  for (const infector of agents) {
    if (infector.state !== 'I') continue;
    for (const target of agents) {
      if (target.state !== 'S' || toInfect.has(target)) continue;
      const dx = infector.x - target.x;
      if (Math.abs(dx) > infectRadius) continue;
      const dy = infector.y - target.y;
      if (Math.abs(dy) > infectRadius) continue;
      if (dx * dx + dy * dy < infectR2 && Math.random() < effectiveBeta) {
        toInfect.add(target);
        if (transmissions.length < 20) {
          transmissions.push([infector.x, infector.y, target.x, target.y]);
        }
      }
    }
  }

  for (const a of toInfect) {
    a.state = 'I';
    a.infectedTick = tick;
    [a.r, a.g, a.b] = STATE_COLOR['I'];
  }

  // ── Recover ───────────────────────────────────────────────────────
  for (const a of agents) {
    if (a.state === 'I' && tick - a.infectedTick >= recoveryTicks) {
      a.state = 'R';
      [a.r, a.g, a.b] = STATE_COLOR['R'];
    }
  }

  // ── Count ─────────────────────────────────────────────────────────
  const counts: Record<AgentState, number> = { S: 0, I: 0, R: 0, V: 0 };
  for (const a of agents) counts[a.state]++;

  return { counts, transmissions };
}
