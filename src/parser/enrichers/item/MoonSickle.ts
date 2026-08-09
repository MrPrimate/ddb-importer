import DDBEnricherData from "../data/DDBEnricherData";

export default class MoonSickle extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.heal.damage"),
        ],
      },
    ];
  }

}
