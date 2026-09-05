import DDBEnricherData from "../../data/DDBEnricherData";

export default class IntimidatingPresence extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      // type: "save",
      name: "Save",
      targetType: "creature",
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore With Rage Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
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
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Save"],
      retainOriginalConsumption: true,
      retainChildUses: true,
      data: {
        flags: {
          "midi-qol": {
            effectActivation: true,
            effectCondition: "!target.effects.some((e)=> e.name?.toLowerCase().includes('blind') || e.name?.toLowerCase().includes('deaf'))",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Save",
        noCreate: true,
        midiOnly: true,
        name: "Intimidating Presence: Frightened",
        // 2014: "frightened of you until the end of your next turn"; 2024: "the Frightened
        // condition for 1 minute" with repeat saves, so the counted minute must not be cut by
        // a pseudo expiry
        options: this.is2014
          ? { expiry: "sourceEnd" }
          : { expiry: "turnStart", durationSeconds: 60 },
      },
    ];
  }

}
