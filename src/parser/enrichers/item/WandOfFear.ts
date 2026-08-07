import DDBEnricherData from "../data/DDBEnricherData";

export default class WandOfFear extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Command",
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      addItemConsume: true,
      noeffect: true,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: "15",
          },
        },
        range: {
          value: "60",
          units: "ft",
        },
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cone of Fear",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateConsumption: true,
          saveOverride: {
            ability: ["wis"],
            dc: {
              calculation: "",
              formula: "15",
            },
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              type: "cone",
              size: "60",
              units: "ft",
            },
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: 2,
        },
      },
    ];
  }

}
