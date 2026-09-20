import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Shield of the Cavalier: Forceful Bash (2d6 force, knocks prone) and the once-per-dawn Protective Field reaction.
 */
export default class ShieldOfTheCavalier extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Forceful Bash",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 5,
          data: { attack: {  }, damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["force"] })] } },
        },
      },
      {
        init: {
          name: "Protective Field",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          generateConsumption: true,
          activationOverride: { type: "reaction", value: null, condition: "When a creature within 5 feet is hit by an attack" },
          targetOverride: {
            template: { type: "radius", size: "5", width: "", units: "ft", count: "" },
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 5,
          addItemConsume: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Knocked Down",
        activityMatch: "Forceful Bash",
        statuses: ["Prone"],
        options: {
          transfer: false,
        },
      },
    ];
  }

}
