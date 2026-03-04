import DDBEnricherData from "../data/DDBEnricherData";

export default class ChorusOfTheLost extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Chorus of the Lost: Short Fear",
        statuses: ["Frightened"],
        daeSpecialDurations: ["turnEnd" as const],
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

}
