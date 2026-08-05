import DDBEnricherData from "../../data/DDBEnricherData";

export default class FadeAway extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fade Away",
        statuses: ["Invisible"],
        options: {
          durationRounds: 1,
          description: "Invisible until the start of your next turn, or until you attack, deal damage, or force a saving throw.",
        },
        daeSpecialDurations: ["turnStartSource", "1Attack"],
      },
    ];
  }

}
