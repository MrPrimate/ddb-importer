import DDBEnricherData from "../../data/DDBEnricherData";

export default class StonyLethargy extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lethargic",
        options: {
          expiry: "targetStart",
          description: "Unable to make opportunity attacks",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
      },
    ];
  }

}
