import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Court level 7. Mirror Image is always prepared (FEATURE_SPELLS_FORCE_PREPARED keeps a
 * slot-spending copy) and once per Long Rest is cast as a Bonus Action without a slot; a level 2+
 * slot restores that use. Each destroyed duplicate makes its attacker save (Intelligence) or take
 * Psychic damage equal to Magus level plus Intelligence modifier.
 */
export default class BrokenMirrorJutsu extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Mirror Image",
      addSpellUuid: "Mirror Image",
      addItemConsume: true,
      noSpellslot: true,
      activationType: "bonus",
      overrideActivation: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shattered Duplicate",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "A duplicate is destroyed by an attack" },
          saveOverride: { ability: ["int"], dc: { calculation: "spellcasting", formula: "" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@classes.magus.levels + @abilities.int.mod",
              types: ["psychic"],
            }),
          ],
          onSave: "none",
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noConsumeTargets: true,
        },
      },
      {
        init: {
          name: "Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "none", value: null, condition: "Expend a level 2+ spell slot" },
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
                target: "2",
                value: "1",
                scaling: { mode: "level", formula: "" },
              },
            ],
            scaling: { allowed: true, max: "4" },
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Broken Mirror Jutsu",
        max: "1",
        period: "lr",
      }),
    };
  }

}
