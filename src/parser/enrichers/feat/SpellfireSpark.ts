import DDBEnricherData from "../data/DDBEnricherData";

export default class SpellfireSpark extends DDBEnricherData {


  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Sacred Flame",
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Sacred Flame",
          data: {
            spell: {
              spellbook: true,
            },
          },
        },
      },
      {
        init: {
          name: "Sacred Flame (Bonus Action)",
          type: "cast",
        },
        build: {
          generateConsumption: true,
          generateSpell: true,
          generateActivation: true,
        },
        overrides: {
          addItemConsume: true,
          addSpellUuid: "Sacred Flame",
          data: {
            spell: {
              spellbook: true,
            },
            activation: {
              "type": "bonus",
              "override": true,
            },
          },
        },
      },
    ];
  }

  // get addAutoAdditionalActivities() {
  //   return true;
  // }

  get override() {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "feat",
        name: "Spellfire Spark",
      }),
      retainOriginalConsumption: true,
    };
  }

}
