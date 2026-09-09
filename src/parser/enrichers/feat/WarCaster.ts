import DDBEnricherData from "../data/DDBEnricherData";

export default class WarCaster extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Opportunity Spell",
      activationType: "reaction",
      targetType: "creature",
    };
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
