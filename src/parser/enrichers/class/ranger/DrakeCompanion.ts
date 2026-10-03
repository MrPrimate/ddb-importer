import DDBEnricherData from "../../data/DDBEnricherData";

export default class DrakeCompanion extends DDBEnricherData {

  // the options are modelled on this feature, so DDB's options are not built as documents
  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      id: "summonDrakeComp1",
      name: "Summon After Long Rest",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      activationType: "action",
      addActivityConsume: true,
      data: {
        uses: {
          spent: null,
          max: "1",
          override: true,
          recovery: [
            { period: "lr", type: "recoverAll", formula: undefined },
          ],
        },
        bonuses: {
          attackDamage: "@scale.drakewarden.drake-companion",
        },
        creatureSizes: ["sm", "med", "tiny"],
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "",
        recovery: [],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Drake With Spell Slot",
          type: DDBEnricherData.ACTIVITY_TYPES.FORWARD,
        },
        build: {
        },
        overrides: {
          activationType: "action",
          data: {
            activity: {
              id: "summonDrakeComp1",
            },
            consumption: {
              targets: [
                {
                  type: "spellSlots",
                  value: "1",
                  target: "1",
                  scaling: {},
                },
              ],
              scaling: {
                allowed: true,
                max: "",
              },
              spellSlot: true,
            },
            uses: { spent: null, max: "" },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },
    ];
  }

  override get parseAllChoiceFeatures(): boolean {
    return true;
  }

}
