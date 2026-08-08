import DDBEnricherData from "../data/DDBEnricherData";

export default class Haste extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        data: {
          duration: {
            value: 60,
            units: "seconds",
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.customChange("*2", 30, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("dex"),
        ],
        // 2024 has wording that picks up special expiry incorrectly
        daeSpecialDurations: [],
      },
    ];
  }

}
