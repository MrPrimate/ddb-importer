import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * DDB sets the two effects this feature grants as bold-only paragraphs under it, so they are
 * options of one feature rather than features of their own, and the parser builds a save for
 * each. Toxic Breath is an aura: 10 feet in every direction for a minute, poisoning a creature
 * that starts its turn inside. It gets the emanation and fires its own save at turn start.
 * Either option is one of the two daily uses, so Toxic Breath spends one as Hide in Breath does;
 * a region never spends when it fires the save again. Poisoned belongs to Toxic Breath alone and
 * lasts to the end of the creature's next turn, not the minute the parser reads off the aura.
 * "Needs to breathe" is not something a region can test.
 */
export default class ConvocationOfBreath extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    const name = this.ddbEnricher.originalActivity?.name ?? "";
    if (name === "Hide in Breath") return { noeffect: true };
    if (name !== "Toxic Breath") return {};
    return {
      targetType: "creature",
      addItemConsume: true,
      activationCondition: "Lightly obscured; ends early in a moderate or stronger wind",
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { count: "1", contiguous: false, type: "radius", size: "10", units: "ft" },
        },
        range: { override: true, value: null, units: "self" },
        duration: { override: true, value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        activityMatch: "Toxic Breath",
        statuses: ["Poisoned"],
        options: { transfer: false, expiry: "targetEnd", durationSeconds: null },
      },
    ];
  }

}
