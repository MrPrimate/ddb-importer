import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The ward covers up to 40,000 square feet, so "Cast" places a 200 x 200 ft
 * square the GM reshapes to the building. The region fires the "Damage"
 * activity for the warded creature types when one enters for the first time on
 * a turn or starts (2014) / ends (2024) its turn inside. The types are chosen
 * per cast in the rules; every listed type is emitted and the GM removes the
 * ones not chosen from the region behavior. The password exemption is manual.
 */
export default class Forbiddance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetType: "creature",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "square",
            size: "200",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityName: "Damage",
            types: this.is2014
              ? ["celestial", "elemental", "fey", "fiend", "undead"]
              : ["aberration", "celestial", "elemental", "fey", "fiend", "undead"],
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
        },
        overrides: {
          noSpellslot: true,
          overrideTarget: true,
          targetType: "creature",
          activationType: "special",
          activationCondition: this.is2014
            ? "A chosen creature type enters the area for the first time on a turn or starts its turn there"
            : "A chosen creature type enters the area for the first time on a turn or ends its turn there",
        },
      },
    ];
  }

}
