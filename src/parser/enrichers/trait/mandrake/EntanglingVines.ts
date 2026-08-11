import DDBEnricherData from "../../data/DDBEnricherData";

export default class EntanglingVines extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    // the DDB action shares the trait's exact name, so the action loads this
    // enricher too and its effect is cloned onto the trait; only emit once
    if (!this.isAction) return [];
    return [
      {
        name: "Entangled",
        options: {
          description: "Grasping weeds and vines hold the creature: its Speed is 0 and can't increase until the end of its next turn. The effect ends early if the creature replaces one of its attacks with freeing itself.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("0", 100, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
