import DDBEnricherData from "../data/DDBEnricherData";

export default class FountOfMoonlight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Spell",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Force Blinding Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: false,
          generateSave: true,
          noSpellslot: true,
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              count: "1",

            },
            template: {
              count: "",
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "ft",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wreathed in Moonlight",
        activityMatch: "Cast Spell",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("2d6[radiant]", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("2d6[radiant]", 20, "system.rolls.damage.msak.bonus"),
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#97a9ab", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
      },
      {
        name: "Blinded by Moonlight",
        activityMatch: "Force Blinding Save",
        options: {
          durationSeconds: 6,
        },
        statuses: ["Blinded"],
      },
    ];
  }

}
