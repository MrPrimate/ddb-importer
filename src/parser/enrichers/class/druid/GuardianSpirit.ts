import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuardianSpirit extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        init: {
          name: "Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.druid.levels / 2",
            type: "tempHP",
          }),
        },
      },
    ];
  }

}

