import DDBEnricherData from "../data/DDBEnricherData";

export default class FaerieFire extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      { colour: "Blue", hex: "#5ab9e2" },
      { colour: "Green", hex: "#55d553" },
      { colour: "Violet", hex: "#844ec6" },
    ].map((data) => {
      return {
        name: `${data.colour} Light`,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange(data.hex, 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.65", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("3", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "token.light.animation.speed"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("glow"),
        ],
      };
    });
  }

}
