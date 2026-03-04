import DDBEnricherData from "../data/DDBEnricherData";

export default class ProtectionFromPoison extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("poison"),
        ],
      },
    ];
  }

}
