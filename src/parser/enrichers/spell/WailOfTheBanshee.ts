import DDBEnricherData from "../data/DDBEnricherData";

export default class WailOfTheBanshee extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetCount: "10",
      data: { damage: { onSave: "half" } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Deafened by Wail",
        statuses: ["Deafened"],
        options: { durationSeconds: 3600, description: "Targets with 50 HP or fewer die outright." },
      },
    ];
  }

}
