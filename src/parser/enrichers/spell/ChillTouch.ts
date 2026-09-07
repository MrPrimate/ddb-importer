import DDBEnricherData from "../data/DDBEnricherData";

export default class ChillTouch extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("healing", 30),
        ],
      },
    ];
  }

}
