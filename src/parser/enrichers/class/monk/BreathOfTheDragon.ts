import { DDBEnricherData } from "../../data/_module";


export default class BreathOfTheDragon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  /**
   * @returns {DDBActivityData | null}
   */
  get activity() {
    return {
      name: "Breath (Cone)",
      id: "ddbBreathOfCone1",
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      data: {
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "30",
            units: "ft",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.way-of-the-ascendant-dragon.breath-of-the-dragon",
              types: ["acid", "cold", "fire", "lightning", "poison"],
            }),
          ],
        },
      },
    };
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities(): IDDBAdditionalActivity[] {
    const spend = this.is2014 ? "Ki" : "Monk's Focus";
    return [
      {
        duplicate: true,
        id: "ddbBreathOfLine1",
        overrides: {
          name: "Breath (Line)",
          data: {
            target: {
              template: {
                contiguous: false,
                type: "line",
                size: "30",
                units: "ft",
              },
            },
          },
        },
      },
      {
        init: {
          name: `Spend ${spend} to Restore Use`,
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noEffects: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "2",
                target: spend,
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

}
