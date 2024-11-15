/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CelestialResilience extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Heal Self",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.warlock.levels + @abilities.cha.mod",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Heal Others",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: false,
          generateHealing: true,
        },
        overrides: {
          activationType: "special",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "(floor(@classes.warlock.levels / 2)) + @abilities.cha.mod",
              types: ["temphp"],
            }),
          },
        },
      },
    ];
  }


}
