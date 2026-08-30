import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The challenge gives the caster +2 AC and imposes disadvantage on the target's
 * attacks against anyone else; a second save covers the target trying to move
 * away, which costs neither a slot nor concentration.
 */
export default class InfernalChallenge extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Initial Save",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Move Away Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          noSpellslot: true,
          saveOverride: {
            ability: ["cha"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "The target tries to move away from you for the first time on a turn",
          },
        },
        overrides: {
          noSpellslot: true,
          data: {
            duration: {
              concentration: false,
              override: true,
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Infernal Challenge Issued",
        activityMatch: "Initial Save",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
      {
        name: "Infernal Challenge Answered",
        activityMatch: "Initial Save",
        options: {
          durationSeconds: 60,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "(opponentActor.actorId === effectOriginActor.actorId ? 0 : 1)",
            20,
            "flags.automated-conditions-5e.attack.disadvantage",
          ),
        ],
      },
      {
        name: "No Running",
        activityMatch: "Move Away Save",
        options: {
          expiry: "targetStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50),
        ],
      },
    ];
  }

}
