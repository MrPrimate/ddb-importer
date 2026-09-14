import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Talisman of Pure Good: +2 to spell attack rolls while held; the parser already builds the touch damage and the rebuke save.
 */
export default class TalismanOfPureGood extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Holy Symbol",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.bonuses.rsak.attack"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
