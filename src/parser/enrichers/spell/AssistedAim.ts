import DDBEnricherData from "../data/DDBEnricherData";

export default class AssistedAim extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Assisted Aim",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.bonuses.rwak.attack"),
        ],
      },
    ];
  }

}
