import DDBEnricherData from "../data/DDBEnricherData";

/**
 * 2024: a 10-foot-radius, 40-foot-high cylinder the caster moves along with
 * themself. "Cast" places it; the region fires Healing Light for allies and
 * Searing Light for enemies whenever a creature enters the cylinder or ends its
 * turn there (once per turn) - the two behaviors take their dispositions from
 * the activity they fire. The cylinder moving into a creature's space is
 * mover-inverted and stays manual, as does choosing the "wrong" light for a
 * creature. 2014 is a plain summon.
 */
export default class ConjureCelestial extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    if (!["save", "heal"].includes(this.ddbEnricher?._originalActivity?.type ?? "")) return null;
    const isSave = this.ddbEnricher?._originalActivity?.type === "save";
    return {
      name: isSave ? "Searing Light" : "Healing Light",
      targetType: isSave ? "enemy" : "ally",
      noSpellslot: true,
      noTemplate: true,
      overrideTemplate: true,
      activationType: "special",
      activationCondition: "Enters the Cylinder or ends its turn there (once per turn); or the Cylinder moves into its space",
      data: {
        sort: 10000,
        healing: {
          scaling: {
            mode: "whole",
            number: 1,
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 6,
              denomination: 12,
              types: ["radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    if (this.is2014) return null;
    return [
      {
        init: {
          name: "Cast",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {
              count: "1",
              contiguous: false,
              type: "cylinder",
              size: "10",
              height: "40",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            sort: 1,
            behaviors: [
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenEnter", "tokenTurnEnd"],
                activityName: "Healing Light",
              }),
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenEnter", "tokenTurnEnd"],
                activityName: "Searing Light",
              }),
            ],
          },
        },
      },
    ];
  }

}
