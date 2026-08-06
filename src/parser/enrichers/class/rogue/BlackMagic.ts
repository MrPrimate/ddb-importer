import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlackMagic extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast Darkness",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Become Invisible",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateRange: false,
          generateConsumption: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "You are in an area of dim light or darkness",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "self",
              choice: false,
              special: "",
            },
          },
        },
      },
    ];
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Invisible",
        activityMatch: "Become Invisible",
        statuses: ["Invisible"],
        options: {
          description: "Invisible until you make an attack, cast a spell, or are in an area of bright light.",
        },
        daeSpecialDurations: ["1Attack", "1Spell"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "3",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
