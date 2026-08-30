import DDBEnricherData from "../../data/DDBEnricherData";

export default class MomentaryStasis extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          expiry: "sourceEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 90),
        ],
        statuses: ["Incapacitated"],
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }

}
