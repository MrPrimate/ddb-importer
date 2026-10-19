import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfDesperateResilience extends DDBEnricherData {

  // a toggle for while you are Bloodied: Resistance to every damage type except Force
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Defense of Body and Mind (Bloodied)",
        options: { transfer: true, disabled: true },
        changes: DDBEnricherData.allDamageTypes(["force", "healing", "temphp"]).map((damageType) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(damageType),
        ),
      },
    ];
  }

}
