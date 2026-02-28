import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialResilience extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
        init: {
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
