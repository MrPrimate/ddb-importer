import DDBEnricherData from "../data/DDBEnricherData";

export default class ProtectionFromEnergy extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: { midiProperties: { chooseEffects: true } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        name: `Protection from ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(element, 0),
        ],
      };
    });
  }

}
