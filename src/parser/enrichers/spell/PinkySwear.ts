import DDBEnricherData from "../data/DDBEnricherData";

/** Pinky Swear: breaking the promise burns the caster for 1 Fire damage at the start of each turn. */
export default class PinkySwear extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Spell",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Broken Promise Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          damageParts: [DDBEnricherData.basicDamagePart({ bonus: "1", type: "fire", scalingMode: "none" })],
        },
        overrides: {
          targetType: "self",
        },
      },
    ];
  }

}
