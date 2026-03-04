import DDBEnricherData from "../data/DDBEnricherData";

export default class TavernBrawler extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.tavernBrawlerFeat"),
        ],
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Enhanced Unarmed Strike", type: "feat", rename: ["Enhanced Unarmed Strike"] } },
    ];
  }

}
