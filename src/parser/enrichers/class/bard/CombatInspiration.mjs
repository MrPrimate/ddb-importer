/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CombatInspiration extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        name: "Defense",
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.bard.bardic-inspiration",
          name: "Inspiration Roll",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.bardic-inspiration",
            }),
          ],
        },
      },
    ];
  }
}
