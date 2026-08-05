import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Feline Chaos (per errata discussion on the DDB forums the RAW wording is
 * broken): a 20-ft radius sphere within range for 1 minute. On cast,
 * creatures in the area make a Dexterity save (half damage) and on a failure
 * suffer the Feline Chaos effect (disadvantage on checks and attacks).
 * Creatures starting their turn in the area take the main damage; creatures
 * moving in the area save or take 2d6 slashing and fall prone.
 */
export default class FelineChaos extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Save",
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          onSave: "half",
        },
        duration: {
          units: "minute",
          value: "1",
        },
        range: {
          units: "ft",
          value: 120,
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "20",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Start of Turn Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        overrides: {
          noSpellslot: true,
          targetType: "creature",
          activationType: "special",
          activationCondition: "A creature starts its turn in the area",
          noTemplate: true,
          allowCritical: false,
          data: {
            damage: {
              parts: [DDBEnricherData.basicDamagePart({
                number: 4,
                denomination: 6,
                types: ["slashing"],
                scalingMode: "whole",
                scalingNumber: 2,
              })],
            },
          },
        },
      },
      {
        init: {
          name: "Movement Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          noSpellslot: true,
          targetType: "creature",
          activationType: "special",
          activationCondition: "A creature moves within the area",
          noTemplate: true,
          data: {
            save: {
              ability: ["dex"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              onSave: "none",
              parts: [DDBEnricherData.basicDamagePart({
                number: 2,
                denomination: 6,
                types: ["slashing"],
              })],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feline Chaos",
        activityMatch: "Save",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1", 20, "system.abilities.str.check.roll.mode"),
          DDBEnricherData.ChangeHelper.addChange("-1", 20, "system.abilities.dex.check.roll.mode"),
          DDBEnricherData.ChangeHelper.addChange("-1", 20, "system.abilities.con.check.roll.mode"),
          DDBEnricherData.ChangeHelper.addChange("-1", 20, "system.abilities.int.check.roll.mode"),
          DDBEnricherData.ChangeHelper.addChange("-1", 20, "system.abilities.wis.check.roll.mode"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 50, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
      {
        name: "Feline Chaos: Prone",
        statuses: ["Prone"],
        activityMatch: "Movement Save",
      },
    ];
  }
}
