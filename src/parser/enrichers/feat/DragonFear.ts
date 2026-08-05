import DDBEnricherData from "../data/DDBEnricherData";

export default class DragonFear extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Roar",
      targetType: "creature",
      activationType: "action",
      activationCondition: "Expend a use of your Breath Weapon to roar",
      addItemConsume: true,
      itemConsumeTargetName: "Breath Weapon",
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "cha",
            formula: "",
          },
        },
        range: {
          units: "self",
        },
        target: {
          affects: {
            type: "creature",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
