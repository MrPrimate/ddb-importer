import DDBEnricherData from "../data/DDBEnricherData";

export default class ClematisPoison extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Paralyzed (Clematis Poison)",
        statuses: ["Paralyzed"],
        options: {
          durationSeconds: 3600,
          description: "Paralyzed for 1 hour. The poison has no effect on creatures immune to the Poisoned condition.",
        },
      },
    ];
  }

}
