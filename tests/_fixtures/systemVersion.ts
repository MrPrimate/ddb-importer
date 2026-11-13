// Runs a test body with game.system.version set and a real foundry.utils.isNewerVersion (the shared
// foundry mock's always answers false), restoring both afterwards. An undefined version clears
// game.system, as before Foundry has loaded the system.

function isNewerVersion(a: string, b: string): boolean {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

export function withSystemVersion(version: string | undefined, run: () => void): void {
  const game = (globalThis as any).game;
  const previous = game?.system;
  const utils = (globalThis as any).foundry.utils;
  const mockIsNewerVersion = utils.isNewerVersion;
  (globalThis as any).game = { ...(game ?? {}), system: version ? { ...(previous ?? {}), version } : undefined };
  utils.isNewerVersion = isNewerVersion;
  try {
    run();
  } finally {
    (globalThis as any).game = game;
    utils.isNewerVersion = mockIsNewerVersion;
  }
}
