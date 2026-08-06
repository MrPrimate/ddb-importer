import DDBEnricherData from "../../data/DDBEnricherData";

export default class BragisRuneOfSpeech extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Scorn",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          value: 30,
          units: "ft",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Eloquence",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateActivation: true,
        },
        overrides: {
          targetType: "self",
          activationType: "bonus",
          addItemConsume: true,
          itemConsumeTargetName: "Bardic Inspiration",
          data: {
            roll: {
              prompt: false,
              visible: false,
              formula: "@scale.bard.inspiration",
              name: "Bonus to first Charisma check or save in the next hour",
            },
          },
        },
      },
      {
        init: {
          name: "Vitality",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scale.bard.inspiration",
            types: ["temphp"],
          }),
        },
        overrides: {
          activationType: "bonus",
          addItemConsume: true,
          itemConsumeTargetName: "Bardic Inspiration",
          data: {
            range: {
              value: 30,
              units: "ft",
            },
            target: {
              affects: {
                count: "4",
                type: "ally",
                choice: true,
              },
              prompt: false,
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Scorn",
        activityMatch: "Scorn",
        options: {
          durationSeconds: 60,
          description: "Disadvantage on attack rolls against the Skald for 1 minute.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
      },
    ];
  }

}
