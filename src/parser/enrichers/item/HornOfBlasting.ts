import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Horn of Blasting: the 30-foot cone with Deafened on a failed save, plus the explosion damage when the horn fails.
 */
export default class HornOfBlasting extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Blow Horn",
      data: { target: { template: { type: "cone", size: "30", units: "ft", count: "" }, affects: { count: "", type: "creature", choice: false, special: "" } } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Explosion Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "special", value: null, condition: "On a 20 percent chance each use, the horn explodes and deals this to the user" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 6, types: ["force"] })],
          targetOverride: {
            affects: { count: "", type: "self", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

}
