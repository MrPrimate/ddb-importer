import DDBEnricherData from "../data/DDBEnricherData";

export default class PotionOfSpeed extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("dex"),
          DDBEnricherData.ChangeHelper.customChange("*2", 30, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
