import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowArts extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }
}
