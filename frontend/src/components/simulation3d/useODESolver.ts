export type SimParams = {
  beta: number;   // tasa de transmisión
  gamma: number;  // tasa de recuperación
  alpha: number;  // excreción viral
  K: number;      // capacidad máxima
  k: number;      // decaimiento viral
  d: number;      // dilución
};

export type ODEPoint = { t: number; I: number; V: number };

// dI/dt = β·I·(1 - I/K) - γ·I
// dV/dt = α·I - (k+d)·V
function derivs(I: number, V: number, p: SimParams): [number, number] {
  return [
    p.beta * I * (1 - I / p.K) - p.gamma * I,
    p.alpha * I - (p.k + p.d) * V,
  ];
}

function rk4Step(I: number, V: number, dt: number, p: SimParams): [number, number] {
  const [a1, b1] = derivs(I, V, p);
  const [a2, b2] = derivs(I + dt / 2 * a1, V + dt / 2 * b1, p);
  const [a3, b3] = derivs(I + dt / 2 * a2, V + dt / 2 * b2, p);
  const [a4, b4] = derivs(I + dt * a3, V + dt * b3, p);
  return [
    Math.max(0, I + dt * (a1 + 2 * a2 + 2 * a3 + a4) / 6),
    Math.max(0, V + dt * (b1 + 2 * b2 + 2 * b3 + b4) / 6),
  ];
}

export function solveODE(
  I0: number,
  V0: number,
  tMax: number,
  steps: number,
  p: SimParams,
): ODEPoint[] {
  const dt = tMax / steps;
  const pts: ODEPoint[] = [{ t: 0, I: I0, V: V0 }];
  let I = I0, V = V0;
  for (let i = 1; i <= steps; i++) {
    [I, V] = rk4Step(I, V, dt, p);
    pts.push({ t: i * dt, I, V });
  }
  return pts;
}

export function getEquilibria(p: SimParams) {
  const hasEndemic = p.beta > p.gamma;
  const Istar = hasEndemic ? p.K * (1 - p.gamma / p.beta) : 0;
  const Vstar = hasEndemic ? p.alpha * Istar / (p.k + p.d) : 0;
  return {
    diseaseFree: { I: 0, V: 0, stable: !hasEndemic },
    endemic: hasEndemic ? { I: Istar, V: Vstar, stable: true } : null,
  };
}

export function vectorField(I: number, V: number, p: SimParams): [number, number] {
  return derivs(I, V, p);
}
