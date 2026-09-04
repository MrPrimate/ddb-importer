import DDBEnricherData from "../data/DDBEnricherData";

/** The lantern holds spellcasting-modifier soul fragments; each bonus action spends one. */
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
      itemConsumeValue: "-@item.uses.spent",
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
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "max(1, @mod)",
        recovery: [{ period: "lr", type: "loseAll" }],
      },
    };
  }

}
