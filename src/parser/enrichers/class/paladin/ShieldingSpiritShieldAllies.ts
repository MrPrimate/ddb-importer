import DDBEnricherData from "../../data/DDBEnricherData";

/** Obojima paladin: extending Shielding Spirit costs a spell slot and covers one creature within 10 feet per slot level. */
export default class ShieldingSpiritShieldAllies extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "You halve damage from a Dexterity saving throw with Shielding Spirit",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "1",
          target: "1",
          scaling: { mode: "level" },
        },
      ],
      data: {
        range: { override: true, value: "10", units: "ft" },
        target: {
          override: true,
          affects: { type: "creature", count: "1 + @scaling", choice: true },
        },
      },
    };
  }

}
