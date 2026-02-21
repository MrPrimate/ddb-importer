import { DDBEnricherData } from "../../data/_module";


export default class AscendantAspect extends DDBEnricherData {

  get type() {
    return "none";
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities() {
    const spend = this.is2014 ? "Ki" : "Monk's Focus";
    return [
      {
        action: {
          name: "Breath of the Dragon",
          type: "class",
          rename: ["Breath (Cone)"],
          activityKeysLimited: ["ddbBreathOfCone1"],
        },
        overrides: {
          noConsumeTargets: true,
          additionalConsumptionTargets: [
            {
              type: "itemUses",
              target: "Breath of the Dragon",
              value: "1",
              scaling: {
                mode: "",
                formula: "",
              },
            },
            {
              type: "itemUses",
              target: spend,
              value: "1",
              scaling: {
                mode: "",
                formula: "",
              },
            },
          ],
          data: {
            target: {
              template: {
                size: "60",
              },
            },
            damage: {
              onSave: "half",
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "4@scale.monk.die.die",
                  types: ["acid", "cold", "fire", "lightning", "poison"],
                }),
              ],
            },
          },
        },
      },
      {
        duplicate: true,
        overrides: {
          name: "Breath (Line)",
          data: {
            target: {
              template: {
                contiguous: false,
                type: "line",
                size: "90",
                units: "ft",
              },
            },
          },
        },
      },
      {
        action: {
          name: "Explosive Fury",
          type: "class",
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
