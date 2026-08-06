import DDBEnricherData from "../../data/DDBEnricherData";

export default class MarkOfTheHeretic extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Mark of the Heretic",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Marked as Heretic",
      options: {
        durationSeconds: 60,
        description: "The paladin's weapon attacks and Unarmed Strikes against this creature score a Critical Hit on a roll of 19 or 20. When this creature starts its turn, the paladin can take a Reaction to make a melee attack against it if it is within reach.",
      },
      midiChanges: [
        DDBEnricherData.ChangeHelper.overrideChange("19", 20, "flags.midi-qol.grants.criticalThreshold"),
      ],
    }];
  }

}
