import DDBEnricherData from "../../data/DDBEnricherData";

export default class WitchHuntersStrike extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      name: "Strike",
      activationType: "special",
      activationCondition: "When you hit a creature with a weapon attack or Unarmed Strike",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(1 + min(floor(@classes.cleric.levels / 14), 1))d8",
              type: "force",
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
          name: "Strike (Concentrating Target)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: true,
          generateActivation: true,
          generateDamage: true,
          generateTarget: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you hit a creature concentrating on a spell",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(2 + min(floor(@classes.cleric.levels / 14), 1))d8",
              type: "force",
            }),
          ],
        },
      },
    ];
  }

}
