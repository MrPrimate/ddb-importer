import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 2024 spell is a 15-foot emanation of difficult terrain that adds elemental damage to the
 * caster's attacks for 10 minutes. The 2014 spell of the same name summons elementals for an
 * hour, so under 2014 rules every getter stands down and the default summon activity is built.
 */
export default class ConjureMinorElementals extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    if (this.is2014) return null;
    return [
      {
        init: {
          name: "Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          noTemplate: true,
          data: {
            range: {
              units: "ft",
              value: "15",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  denomination: 8,
                  number: 2,
                  types: ["acid", "cold", "fire", "lightning"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [{
      name: "Conjured Minor Elementals",
      activityMatch: "Cast",
      options: {
        durationSeconds: 600,
      },
    }];
  }
}
