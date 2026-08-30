import DDBEnricherData from "../data/DDBEnricherData";

export default class HolyAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Holy Aura" }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Blinded",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateConsumption: false,
          noSpellslot: true,
          generateRange: true,
        },
        overrides: {
          targetType: "creature",
          data: {
            range: {
              units: "ft",
              value: "30",
            },
          },
          overrideRange: true,
          overrideTarget: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Holy Aura: Blinded",
        activityMatch: "Save vs Blinded",
        options: { expiry: "targetEnd" },
      },
      {
        name: "Holy Aura: Light",
        activityMatch: "Cast",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#97a9ab", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("4", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("sunburst", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
        ],
      },
      {
        name: "Holy Aura",
        standalone: true,
        options: {
          durationSeconds: 60,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            "1",
            20,
            "flags.midi-qol.advantage.ability.attack.all",
          ),
        ],
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability),
        ),
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
