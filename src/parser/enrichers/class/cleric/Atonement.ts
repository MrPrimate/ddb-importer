import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Atonement (Discipline Domain, World of Warcraft; the WoW Priest's Discipline Specialization): a
 * level 1+ healing spell blesses each creature it heals until the end of your next turn; while
 * blessed, each of your slot-spending damage spells heals it by the slot level. The blessing is a
 * marker that Luminous Barrier also reads; the heal is an activity scaled to the slot level.
 */
export default class Atonement extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bless",
      activationType: "special",
      activationCondition: "A level 1+ spell you cast restores Hit Points to the creature",
      targetType: "creature",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Atonement Healing", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateHealing: true,
          activationOverride: { type: "special", value: 1, condition: "You cast a damaging spell with a spell slot: heal each blessed creature by the slot level" },
          targetOverride: { override: true, affects: { type: "creature" } },
          // @scaling is 1 unscaled, so scaling the use to the slot level gives the slot level
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@scaling", types: ["healing"] }),
          consumptionOverride: { spellSlot: false, targets: [], scaling: { allowed: true, max: "8" } },
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
        name: "Atonement",
        activityMatch: "Bless",
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "Whenever the priest casts a damaging spell with a spell slot, you regain Hit Points equal to the slot level.",
        },
      },
    ];
  }

}
