import DDBEnricherData from "../data/DDBEnricherData";

export default class Stoneskin extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning", 0),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing", 0),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing", 0),
          // {
          //   key: "system.traits.dr.bypass",
          //   value: "mgc",
          //   mode: "add",
          //   priority: 0,
          // },
        ],
      },
    ];
  }

}
