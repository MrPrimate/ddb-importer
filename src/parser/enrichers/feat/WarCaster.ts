import DDBEnricherData from "../data/DDBEnricherData";

export default class WarCaster extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("1", 20, "system.attributes.concentration.roll.mode"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
