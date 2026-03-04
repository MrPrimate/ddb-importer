import DDBEnricherData from "../data/DDBEnricherData";

export default class Backlash extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cast",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
