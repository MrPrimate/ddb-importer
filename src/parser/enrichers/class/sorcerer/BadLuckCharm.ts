import DDBEnricherData from "../../data/DDBEnricherData";

export default class BadLuckCharm extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Sorcery Point to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "1",
                target: "sorcery-points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bad Luck Charm",
        activityMatch: "Bad Luck Charm: Impose Disadvantage",
        options: {
          durationRounds: 1,
          description: "Disadvantage on the next D20 Test made before the start of the source's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all"),
        ],
      },
    ];
  }

}
