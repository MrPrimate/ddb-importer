import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Transmuter (AU 2024) level 10. Two separate once-per-long-rest limits: the free Polymorph cast
 * keeps its own activity use, and the self-modification (keeping mental scores, proficiencies,
 * features, feats and the ability to cast Transmutation spells) is a transform of the caster
 * that spends the feature's use.
 */
export default class ShapeShifter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Polymorph",
      addSpellUuid: "Polymorph",
      noSpellslot: true,
      noConsumeTargets: true,
      addActivityConsume: true,
      data: {
        spell: {
          spellbook: true,
        },
        uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shape-Shifter (Self)",
          type: DDBEnricherData.ACTIVITY_TYPES.TRANSFORM,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "When you target yourself with Polymorph" },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          noTemplate: true,
          data: {
            transform: {
              customize: true,
              mode: "cr",
              preset: "polymorph",
            },
            settings: {
              effects: ["origin", "otherOrigin", "spell"],
              keep: ["mental", "saves", "skills", "gearProf", "languages", "feats", "spells", "type", "hp"],
              tempFormula: "@source.attributes.hp.max",
              preset: "polymorph",
              transformTokens: true,
            },
            profiles: [
              { name: "Beast", cr: "", types: ["beast"], sizes: [], movement: [], level: { min: null, max: null } },
            ],
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
