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
        // 2024 Damage Rerolls: reroll a 1 on an Unarmed Strike damage die and use the new roll
        ac5eChanges: this.is2014
          ? []
          : [
            DDBEnricherData.ChangeHelper.ac5eChange(
              "modifier=r1; unarmed",
              20,
              "flags.automated-conditions-5e.damage.modifier",
            ),
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
