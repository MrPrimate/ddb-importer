import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Two options from one cast. DDB's parsed save is the mud-to-rock entombing save ("Mud to Rock").
 * "Rock to Mud" places the mud: difficult terrain, and a Strength "Sinking Save (Mud)" for any
 * creature on the ground when the spell is cast and for one moving into the mud for the first time
 * on a turn or ending its turn there. The placer rolls nothing itself, so the mud's creation is what
 * reaches the creatures already on it (enterOn "any").
 */
export default class TransmuteRock extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Mud to Rock",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Rock to Mud",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateDuration: true,
          noeffect: true,
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["mud"] }),
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenEnter", "tokenTurnEnd"],
                enterOn: "any",
                activityId: "ddbTraRocZoneSa1",
              }),
            ],
          },
        },
      },
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
            condition: "On the ground when the mud appears, moves into it for the first time on a turn, or ends its turn there",
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
