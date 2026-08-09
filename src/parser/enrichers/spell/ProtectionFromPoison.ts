import DDBEnricherData from "../data/DDBEnricherData";

export default class ProtectionFromPoison extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("poison"),
        ],
      },
    ];
  }

}
