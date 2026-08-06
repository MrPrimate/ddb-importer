import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritOfTheValkyrie extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Thunderstruck",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          onSave: "full",
          activationOverride: {
            type: "special",
            value: null,
            condition: "An enemy starts its turn within your Aura of Protection",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "enemy",
            },
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.cha.mod + @prof",
              types: ["thunder"],
            }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
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
          noeffect: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spirit of the Valkyrie",
        activitiesMatch: ["Activate"],
        options: {
          durationSeconds: 600,
          description: "Flight: Fly Speed of 60 feet. Magic Resistance: Advantage on saving throws against spells and other magical effects. Restful Dead: creatures in your Aura of Protection attempting to create or summon Undead must succeed on a Charisma save or fail. Thunderstruck: you can cast Smite spells as though using a level 5 spell slot; enemies starting their turn in your Aura of Protection take Thunder damage equal to your Charisma modifier plus Proficiency Bonus and must save against being Stunned.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.fly"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 5, "flags.midi-qol.magicResistance.all"),
        ],
      },
      {
        name: "Thunderstruck: Stunned",
        activitiesMatch: ["Thunderstruck"],
        statuses: ["stunned"],
        options: {
          durationRounds: 1,
          description: "Stunned until the end of its next turn.",
        },
      },
    ];
  }

}
