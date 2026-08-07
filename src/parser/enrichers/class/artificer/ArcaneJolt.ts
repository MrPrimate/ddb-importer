import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneJolt extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction
      ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE
      : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      name: "Destructive Energy",
      activationType: "special",
      activationCondition: "When you or your Steel Defender hit with an attack",
      targetType: "creature",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(2 + 2 * min(floor(@classes.artificer.levels / 15), 1))d6",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Restorative Energy",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateHealing: true,
          generateRange: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "When you or your Steel Defender hit with an attack",
          targetType: "creature",
          addItemConsume: true,
          data: {
            range: {
              value: 30,
              units: "ft",
            },
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "(2 + 2 * min(floor(@classes.artificer.levels / 15), 1))d6",
              types: ["healing"],
            }),
          },
        },
      },
    ];
  }

}
