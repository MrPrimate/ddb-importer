import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowArts extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.ranges.darkvision"),
        ],
      },
    ];
  }

  override get clearAutoEffects() {
    return true;
  }
}
