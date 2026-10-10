import DDBEnricherData from "../data/DDBEnricherData";

/**
 * One attack roll per target, each ray that hits dealing 1d10 cold. The attack rolls a single
 * ray: a target hit by several rays needs the extra d10s added by hand. A target hit by any ray
 * then saves or loses its reactions until the start of its next turn.
 */
export default class Darkbolt extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Attack",
      noeffect: true,
      data: {
        damage: {
          parts: [
            // higher slots add rays, not dice, so the part never scales
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, type: "cold", scalingMode: "none" }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs No Reactions",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting" } },
          targetOverride: {
            affects: { type: "creature" },
            template: {},
          },
          activationOverride: { type: "special", condition: "A target hit by one or more rays" },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Darkbolt: No Reactions",
        activityMatch: "Save vs No Reactions",
        options: {
          expiry: "targetStart",
          description: "You can't take reactions until the start of your next turn.",
        },
      },
    ];
  }

}
