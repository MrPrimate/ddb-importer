import DDBEnricherData from "../../data/DDBEnricherData";

export default class Shimmerskin extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shimmering Skin",
        options: {
          durationSeconds: 600,
          description: "Advantage on all Charisma checks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("cha"),
        ],
      },
    ];
  }

}
