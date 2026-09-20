import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The lantern holds up to spellcasting-modifier soul fragments. It starts empty: the cast sets
 * spent to max, Capture Soul adds a fragment when an enemy dies in the dim light, and each bonus
 * action option spends one. The lantern's dim light is an ATL token change on the caster while the
 * spell lasts; Ward Ally's "attacks against" disadvantage has no native dnd5e key, so it is a
 * midi/AC5e grant.
 */
export default class SpiritLantern extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      stopHealSpellActivity: true,
      name: "Cast",
      targetType: "self",
      noTemplate: true,
      addItemConsume: true,
      itemConsumeValue: "@item.uses.max - @item.uses.spent",
      data: { damage: { parts: [] } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Drain Life", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          noSpellslot: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, bonus: "@mod", type: "necrotic", scalingMode: "none" }),
          ],
          rangeOverride: { value: "60", units: "ft", special: "" },
        },
        overrides: {
          targetType: "creature",
          activationType: "bonus",
          addItemConsume: true,
          removeSpellSlotConsume: true,
          noTemplate: true,
        },
      },
      {
        init: { name: "Repair Undead", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          noSpellslot: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, bonus: "@mod", types: ["healing"], scalingMode: "none" }),
          rangeOverride: { value: "60", units: "ft", special: "" },
        },
        overrides: {
          targetType: "creature",
          activationType: "bonus",
          addItemConsume: true,
          removeSpellSlotConsume: true,
          noTemplate: true,
        },
      },
      {
        init: { name: "Ward Ally", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          noSpellslot: true,
          rangeOverride: { value: "60", units: "ft", special: "" },
        },
        overrides: {
          targetType: "creature",
          activationType: "bonus",
          addItemConsume: true,
          removeSpellSlotConsume: true,
          noTemplate: true,
        },
      },
      {
        init: { name: "Capture Soul", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: { type: "special", value: null, condition: "When an enemy dies within the lantern's dim light" },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeValue: "-1",
          removeSpellSlotConsume: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spirit Lantern",
        activityMatch: "Cast",
        atlOnly: true,
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "60"),
        ],
        options: {
          description: "A ghostly black lantern hovers above you and sheds Dim Light in a 60-foot radius.",
        },
      },
      {
        name: "Warded by Spirit Lantern",
        activityMatch: "Ward Ally",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          expiry: "sourceStart",
          description: "Other creatures have Disadvantage on attack rolls against this creature until the start of the caster's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "max(1, @attributes.spell.mod)",
        recovery: [{ period: "lr", type: "loseAll" }],
      },
    };
  }

}
