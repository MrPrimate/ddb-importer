import ConcentrationFollowUp from "../../../src/effects/enhancers/Spells/ConcentrationFollowUp";

const ITEM_ID = "hexspellhexspell";
const JOIN = { ddbimporter: { joinConcentration: true } };

/** A concentration effect as dnd5e's beginConcentrating stamps it. */
function concentration(id: string, itemId = ITEM_ID) {
  return { id, getFlag: (_scope: string, _key: string) => ({ id: itemId }) };
}

/** Mark Target plus a Move Hex forward on one Hex item, cast by an actor with the given concentrations. */
function hex({ effects = [concentration("concEffect000001")], forwardFlag = true } = {}) {
  const activities = new Map<string, any>();
  const item = { id: ITEM_ID, system: { activities: { get: (id: string) => activities.get(id) } } };
  const actor = { concentration: { effects } };
  const markTarget = { id: "ddbHexMarkTarget", flags: {}, item, actor };
  const moveHex = { id: "moveHexForward01", flags: forwardFlag ? JOIN : {}, item, actor };
  activities.set(markTarget.id, markTarget);
  activities.set(moveHex.id, moveHex);
  return { markTarget, moveHex };
}

/** dnd5e's usage config for a concentration activity once `_prepareUsageConfig` has run. */
function usage(cause?: string): any {
  return { concentration: { begin: true, end: "concEffect000001" }, ...(cause ? { cause: { activity: cause } } : {}) };
}

describe("ConcentrationFollowUp.preUseActivityHook", () => {
  it("joins the running concentration when a flagged forward hands its use on", () => {
    const { markTarget } = hex();
    const usageConfig = usage(`.Item.${ITEM_ID}.Activity.moveHexForward01`);
    const messageConfig: any = { data: { system: { targets: [] } } };
    ConcentrationFollowUp.preUseActivityHook(markTarget, usageConfig, messageConfig);
    expect(usageConfig.concentration).toEqual({ begin: false });
    expect(messageConfig.data.system).toEqual({ targets: [], concentration: "concEffect000001" });
  });

  it("joins when the flagged activity is used directly", () => {
    const { moveHex } = hex();
    const usageConfig = usage();
    const messageConfig: any = {};
    ConcentrationFollowUp.preUseActivityHook(moveHex, usageConfig, messageConfig);
    expect(usageConfig.concentration.begin).toBe(false);
    expect(messageConfig.data.system.concentration).toBe("concEffect000001");
  });

  it("leaves the spell's own cast to dnd5e", () => {
    const { markTarget } = hex();
    const usageConfig = usage();
    const messageConfig: any = {};
    ConcentrationFollowUp.preUseActivityHook(markTarget, usageConfig, messageConfig);
    expect(usageConfig.concentration).toEqual({ begin: true, end: "concEffect000001" });
    expect(messageConfig).toEqual({});
  });

  it("leaves a forward without the flag to dnd5e", () => {
    const { markTarget } = hex({ forwardFlag: false });
    const usageConfig = usage(`.Item.${ITEM_ID}.Activity.moveHexForward01`);
    ConcentrationFollowUp.preUseActivityHook(markTarget, usageConfig, {});
    expect(usageConfig.concentration.begin).toBe(true);
  });

  it("starts concentration as normal once the spell's concentration has lapsed", () => {
    const { moveHex } = hex({ effects: [concentration("otherSpellConc01", "otherspellitem00")] });
    const usageConfig = usage();
    const messageConfig: any = {};
    ConcentrationFollowUp.preUseActivityHook(moveHex, usageConfig, messageConfig);
    expect(usageConfig.concentration.begin).toBe(true);
    expect(messageConfig).toEqual({});
  });
});
