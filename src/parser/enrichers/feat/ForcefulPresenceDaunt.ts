import DDBEnricherData from "../data/DDBEnricherData";

export default class ForcefulPresenceDaunt extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      // the save DC is the result of your Charisma (Intimidation) check, so
      // this stays a utility with a rolled check rather than a save activity
      targetType: "creature",
      activationType: "bonus",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
        roll: {
          prompt: true,
          visible: true,
          formula: "1d20 + @skills.itm.total",
          name: "Intimidation check (sets the save DC)",
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
          description: "Repeat the Wisdom saving throw at the end of each of your turns, ending the effect on a success.",
        },
      },
    ];
  }

}
