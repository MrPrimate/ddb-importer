import DDBEnricherData from "../data/DDBEnricherData";

export default class Slow extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-2", 20, "system.abilities.dex.save.roll.bonus"),
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
      },
    ];
  }

}
