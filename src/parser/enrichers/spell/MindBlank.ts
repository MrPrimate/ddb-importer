import DDBEnricherData from "../data/DDBEnricherData";

export default class MindBlank extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("psychic"),
        ],
      },
    ];
  }

}
