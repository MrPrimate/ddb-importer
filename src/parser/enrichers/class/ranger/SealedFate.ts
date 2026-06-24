import DDBEnricherData from "../../data/DDBEnricherData";

export default class SealedFate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Marked for Death",
      activationType: "special",
      activationCondition: "Use Omen of Doom and choose to mark the target",
      addItemConsume: true,
      targetType: "creature",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Marked for Death",
        options: {
          durationSeconds: 60,
          description: "Vulnerable to damage dealt by the grim and to the extra damage you deal with Omen of Doom.",
        },
        changes: [
          // DDBEnricherData.ChangeHelper.unsignedAddChange("vulnerable", 20, "system.traits.dv.value"),
        ],
      },
    ];
  }


  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            scaling: { allowed: true, max: "6" },
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "4",
                scaling: { mode: "level", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{
          period: "lr",
          type: "recoverAll",
        }],
      },
    };
  }

}
