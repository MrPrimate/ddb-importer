import DDBEnricherData from "../../data/DDBEnricherData";

export default class HorseLord extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Groom Mount",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          noeffect: true,
          generateHealing: true,
          generateTarget: true,
          generateRange: false,
          generateConsumption: false,
          generateActivation: true,
          activationOverride: {
            type: "minute",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.rogue.levels * 2",
            types: ["temphp"],
          }),
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "Your mount",
            },
          },
        },
      },
    ];
  }

}
