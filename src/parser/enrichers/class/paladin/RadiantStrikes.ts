import DDBEnricherData from "../../data/DDBEnricherData";

export default class RadiantStrikes extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      options: {
        transfer: true,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1d8[radiant]", 20, "system.rolls.damage.mwak.bonus"),
      ],
    }];
  }

}
