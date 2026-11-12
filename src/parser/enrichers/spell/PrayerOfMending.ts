import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Priest): a ward on a willing creature heals it for 1d8 + the spellcasting
 * modifier the next time it takes damage, then jumps to another ally within 30 feet, up to five
 * heals (one more per slot level above 3). The cast places the ward; each heal is a free activity.
 */
export default class PrayerOfMending extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Ward",
      // the parser's cast-time heal: the ward heals later, on damage
      stopHealSpellActivity: true,
      removeDamageParts: true,
      data: {
        target: { override: true, affects: { count: "1", type: "ally" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ward Heals", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDuration: true,
          generateHealing: true,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: { type: "special", value: null, condition: "The warded creature takes damage; then the ward jumps to an ally within 30 feet" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: { override: true, affects: { count: "1", type: "ally" } },
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, bonus: "@mod", types: ["healing"], scalingMode: "none" }),
        },
        overrides: {
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prayer of Mending",
        activityMatch: "Place Ward",
        options: {
          transfer: false,
          description: "The next time you take damage, you regain 1d8 + the caster's spellcasting modifier Hit Points, and the ward jumps to another ally within 30 feet.",
        },
      },
    ];
  }

}
