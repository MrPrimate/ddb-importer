/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Backlash extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Creature Save vs Damage",
      removeSpellSlotConsume: true,
      noConsumeTargets: true,
      data: {
        sort: 2,
      },
    };
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Cast",
          type: "utility",
        },
        build: {
          generateAttack: false,
          onsave: false,
          noeffect: true,
        },
        overrides: {
          activationType: "reaction",
          overrideActivation: true,
          data: {
            sort: 1,
            roll: {
              name: "Damage reduction",
              formula: "(@item.level)d6 + @attributes.spell.mod",
            },
          },
        },
      },
    ];
  }


}
