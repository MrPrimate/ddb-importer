import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Strike: a 60-foot, 1-foot-wide line of blood replaces the attack. Creatures in it save
 * (Dexterity) against the weapon's damage plus 1d6 piercing (3d6 from fighter level 18), half on a
 * success. The weapon's own damage is added by hand.
 */
export default class BloodStrikeBloodshardStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // the option document shares this action's name, so keep DDB's shared Blood Strike action beside it
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Blood Strike"];
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bloodshard Strike",
      activationType: "special",
      activationCondition: "Instead of an attack roll (add the weapon's damage)",
      rangeSelf: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "line", size: "60", width: "1", units: "ft" },
        },
        save: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "(1 + 2 * floor(@classes.fighter.levels / 18))d6", types: ["piercing"] })],
        },
      },
    };
  }

}
