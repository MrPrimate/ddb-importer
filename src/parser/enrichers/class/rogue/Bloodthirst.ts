import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bloodthirst extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bloodthirst",
      activationType: "reaction",
      activationCondition: "When an enemy you can see within 30 feet becomes Bloodied but is not killed outright",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    const hasSRFeature = this.hasClassFeature({ featureName: "Dread Incarnate", subClassName: "Scion of the Three" });
    if (!hasSRFeature || this.ddbParser.isMuncher) return { midiManualReaction: true };
    return {
      midiManualReaction: true,
      data: {
        system: {
          uses: {
            recovery: [
              { period: "lr", type: "recoverAll", formula: undefined },
              { period: "sr", type: "formula", formula: "1" },
            ],
          },
        },
      },
    };
  }

}
