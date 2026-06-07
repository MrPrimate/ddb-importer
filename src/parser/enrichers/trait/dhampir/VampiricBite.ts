import DDBEnricherData from "../../data/DDBEnricherData";

export default class VampiricBite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    if (this.is2014) {
      return null;
    }
    return {
      noConsumeTargets: true,
      data: {
        damage: {
          includeBase: false,
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 4,
              bonus: "@abilities.con.mod",
              types: ["piercing"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [];
    }
    return [
      {
        init: {
          name: "Empower Self",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        overrides: {
          addItemConsume: true,
          activationType: "special",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scaling",
              type: "healing",
            }),
            consumption: {
              scaling: {
                allowed: true,
                max: "20",
              },
              spellSlot: true,
              targets: [],
            },
          },
        },
      },
    ];
  }

}
