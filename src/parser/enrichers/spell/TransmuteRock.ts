import DDBEnricherData from "../data/DDBEnricherData";

export default class TransmuteRock extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    // the default parse is the mud-to-rock entombing save; the region covers the
    // rock-to-mud option (difficult terrain plus the sinking save on entry)
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["mud"] }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbTraRocZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sinking Save (Mud)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            condition: "Moves into the mud for the first time on a turn or ends its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
          saveOverride: {
            ability: ["str"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
        },
        overrides: {
          id: "ddbTraRocZoneSa1",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sinking into the Mud",
        activityMatch: "Sinking Save (Mud)",
        statuses: ["Restrained"],
      },
    ];
  }

}
