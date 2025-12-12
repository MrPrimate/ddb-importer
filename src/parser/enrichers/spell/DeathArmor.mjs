/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DeathArmor extends DDBEnricherData {


  get activity() {
    return {
      name: "Save vs Damage",
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
          activationType: "special",
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Inky Aura (Death Armor)",
        options: {},
        data: {
          flags: {
            ddbimporter: {
              activityMatch: "Cast",
            },
            ActiveAuras: {
              aura: "Enemies",
              radius: "5",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "5",
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
