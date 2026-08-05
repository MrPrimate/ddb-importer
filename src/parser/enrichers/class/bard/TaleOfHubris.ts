import DDBEnricherData from "../../data/DDBEnricherData";

export default class TaleOfHubris extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature scores a critical hit against you or an ally within 60 ft",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hubris",
        options: {
          durationSeconds: 60,
          description: "Weapon attacks against this creature score a critical hit on a roll of 18-20 (17-20 at bard level 14). Ends early if the target suffers a critical hit.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            "@classes.bard.levels >= 14 ? 17 : 18",
            20,
            "flags.midi-qol.grants.criticalThreshold",
          ),
        ],
      },
    ];
  }

}
