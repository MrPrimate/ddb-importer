import DDBEnricherData from "../data/DDBEnricherData";

export default class VisionOfElapsingEons extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return { data: { damage: { onSave: "none" } } };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vision of Elapsing Eons",
        statuses: ["Paralyzed"],
        options: { durationSeconds: 60, description: "Repeat the save at the end of each turn; a failure adds 1 Exhaustion level." },
      },
    ];
  }

}
