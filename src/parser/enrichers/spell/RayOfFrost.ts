import DDBEnricherData from "../data/DDBEnricherData";

export default class RayOfFrost extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ray of Frost",
        options: {
          expiry: "sourceStart",
        },
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20),
        ],
      },
    ];
  }
}
