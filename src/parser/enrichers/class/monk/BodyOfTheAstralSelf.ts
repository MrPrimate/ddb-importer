import DDBEnricherData from "../../data/DDBEnricherData";

export default class BodyOfTheAstralSelf extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      name: "Reduce Damage",
      targetType: "self",
      activationType: "reaction",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.wis.mod",
          types: ["healing"],
        }),
      },
    };
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities() {
    return [
      {
        init: {
          name: "Empowered Arms Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateTarget: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
        overrides: {
          activationCondition: "Once per turn",
          activationType: "special",
          targetType: "creature",
        },
      },
    ];
  }

}
