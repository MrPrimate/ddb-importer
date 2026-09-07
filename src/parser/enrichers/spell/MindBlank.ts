import DDBEnricherData from "../data/DDBEnricherData";

export default class MindBlank extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("psychic"),
        ],
      },
    ];
  }

}
