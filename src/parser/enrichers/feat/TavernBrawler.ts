import DDBEnricherData from "../data/DDBEnricherData";

export default class TavernBrawler extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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

  // DDB names the actions per ruleset: 2014 ships "Tavern Brawler Strike" (the d4 unarmed strike)
  // and "Tavern Brawler Grapple" (the bonus action grapple), 2024 ships "Enhanced Unarmed Strike".
  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [
        { action: { name: "Tavern Brawler Strike", type: "feat" } },
        { action: { name: "Tavern Brawler Grapple", type: "feat" } },
      ];
    }
    return [
      { action: { name: "Enhanced Unarmed Strike", type: "feat", rename: ["Enhanced Unarmed Strike"] } },
    ];
  }

}
