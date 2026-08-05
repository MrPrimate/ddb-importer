import DDBEnricherData from "../../data/DDBEnricherData";

export default class MenacingRoar extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "con",
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
            type: "radius",
            size: "10",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
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
          durationRounds: 1,
          description: "Frightened until the end of your next turn.",
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
