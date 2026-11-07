import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Death Knight): +10 Hit Point maximum while concentrating; extra healing is the spell's own heal activity.
 */
export default class VampiricBlood extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vampiric Blood",
        options: {
          durationSeconds: 60,
          description: "Whenever you regain Hit Points, you regain extra Hit Points (the spell's healing roll).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.hp.tempmax"),
        ],
      },
    ];
  }

}
