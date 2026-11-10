import { DDBEnricherData } from "../../data/_module";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";


export default class AscendantAspect extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const spend = this.ddbEnricher.isClass2014("Monk") ? "Ki" : "Monk's Focus";
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
                  customFormula: `4@scale.${this.classIdentifier("Monk")}.die.die`,
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
          // a 2024 Monk hosting the legacy subclass gets the action under the parent feature's name
          name: this.ddbEnricher.isClass2014("Monk") ? "Explosive Fury" : "Aspect of the Wyrm: Explosive Fury",
          type: "class",
          rename: ["Explosive Fury"],
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
