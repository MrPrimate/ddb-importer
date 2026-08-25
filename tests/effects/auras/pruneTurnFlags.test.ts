import RegionAutomations from "../../../src/effects/auras/RegionAutomations";
import DDBEffectHelper from "../../../src/effects/DDBEffectHelper";

const NS = DDBEffectHelper.FLAG_NAME;
const LIVE_REGION = "aBcD1234EfGh5678";
const DEAD_REGION = "zYxW9876VuTs5432";
const BEHAVIOR = "bH0000000000000b";
const TOKEN = "tK0000000000000t";

function flagName(regionId: string): string {
  return RegionAutomations.turnFlagName(regionId, BEHAVIOR, TOKEN);
}

function setup({ actors = [] as any[], combats = ["c1"], regions = [LIVE_REGION] } = {}) {
  const update = vi.fn().mockResolvedValue([]);
  (globalThis as any).Actor.updateDocuments = update;
  (globalThis as any).game.scenes = [{ regions: regions.map((id) => ({ id })) }];
  (globalThis as any).game.actors = actors;
  (globalThis as any).game.combats = { get: (id: string) => (combats.includes(id) ? { id } : undefined) };
  return update;
}

function actor(id: string, flags: Record<string, unknown>): any {
  return { id, flags: { [NS]: flags } };
}

describe("RegionAutomations.pruneTurnFlags", () => {
  afterEach(() => {
    delete (globalThis as any).Actor.updateDocuments;
    delete (globalThis as any).game.scenes;
    delete (globalThis as any).game.actors;
    delete (globalThis as any).game.combats;
  });

  it("prunes a flag whose region no longer exists", async () => {
    const update = setup({ actors: [actor("a1", { [flagName(DEAD_REGION)]: { id: "c1", round: 1, turn: 2 } })] });

    expect(await RegionAutomations.pruneTurnFlags()).toBe(1);
    expect(update).toHaveBeenCalledWith([{ _id: "a1", [`flags.${NS}.${flagName(DEAD_REGION)}`]: (globalThis as any)._del }]);
  });

  it("prunes a flag from a combat that no longer exists, even while the region stands", async () => {
    const update = setup({ actors: [actor("a1", { [flagName(LIVE_REGION)]: { id: "gone", round: 1, turn: 2 } })] });

    expect(await RegionAutomations.pruneTurnFlags()).toBe(1);
    expect(update).toHaveBeenCalledWith([{ _id: "a1", [`flags.${NS}.${flagName(LIVE_REGION)}`]: (globalThis as any)._del }]);
  });

  it("prunes an out of combat movement flag, which carries a null combat id", async () => {
    const update = setup({
      actors: [actor("a1", { [flagName(LIVE_REGION)]: { id: null, round: null, turn: null, key: "movementmv1" } })],
    });

    expect(await RegionAutomations.pruneTurnFlags()).toBe(1);
    expect(update).toHaveBeenCalledWith([{ _id: "a1", [`flags.${NS}.${flagName(LIVE_REGION)}`]: (globalThis as any)._del }]);
  });

  it("keeps a flag while both its region and its combat survive", async () => {
    const update = setup({ actors: [actor("a1", { [flagName(LIVE_REGION)]: { id: "c1", round: 1, turn: 2, key: "combatc1r1t2" } })] });

    expect(await RegionAutomations.pruneTurnFlags()).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  it("leaves other ddb-importer helper flags alone", async () => {
    const update = setup({
      actors: [actor("a1", {
        SpiritGuardiansTurn: { round: 1 },
        moonBeamSpell: "something",
        regionNotAnIdTurn: true,
        [flagName(DEAD_REGION)]: { id: "c1" },
      })],
    });

    expect(await RegionAutomations.pruneTurnFlags()).toBe(1);
    expect(update).toHaveBeenCalledWith([{ _id: "a1", [`flags.${NS}.${flagName(DEAD_REGION)}`]: (globalThis as any)._del }]);
  });

  it("counts without writing under dryRun, and skips actors with no flags", async () => {
    const update = setup({
      actors: [
        actor("a1", { [flagName(DEAD_REGION)]: { id: "c1" } }),
        { id: "a2" },
      ],
    });

    expect(await RegionAutomations.pruneTurnFlags({ dryRun: true })).toBe(1);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("RegionAutomations.isTurnFlag", () => {
  it("matches only the once-per-turn flag shape", () => {
    expect(RegionAutomations.isTurnFlag(flagName(LIVE_REGION))).toBe(true);
    // behavior and token ids can be blank on a hand-built behavior
    expect(RegionAutomations.isTurnFlag(`region${LIVE_REGION}Turn`)).toBe(true);
    expect(RegionAutomations.isTurnFlag("SpiritGuardiansTurn")).toBe(false);
    expect(RegionAutomations.isTurnFlag("regionShortTurn")).toBe(false);
    expect(RegionAutomations.isTurnFlag(`region${LIVE_REGION}`)).toBe(false);
  });
});
