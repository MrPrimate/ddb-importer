import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityCreateHealingDraft extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Drink Healing Draft",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateActivation: true,
          generateHealing: true,
          generateTarget: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "2d6 + @classes.cleric.levels",
            types: ["healing"],
          }),
        },
      },
    ];
  }

}
