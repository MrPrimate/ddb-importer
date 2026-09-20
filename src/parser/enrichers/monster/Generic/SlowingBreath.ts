import DDBEnricherData from "../../data/DDBEnricherData";

export default class SlowingBreath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Slowed",
        options: {
          durationSeconds: 60,
          description: "Speed halved and unable to use reactions. The target repeats the save at the end of each of its turns, ending the effect on a success.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
          // the 2024 wording adds Disadvantage on Dexterity saving throws
          ...(this.is2014 ? [] : [DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("dex")]),
        ],
      },
    ];
  }

}
