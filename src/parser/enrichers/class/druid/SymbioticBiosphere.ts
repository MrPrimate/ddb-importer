import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of the Hive. Releasing pheromones is a self-enchantment lasting a minute; while it is
 * applied the Retaliate activity (once per turn) and, from 6th level, the Protect the Monarch
 * damage reduction are exposed as rider activities.
 */
export default class SymbioticBiosphere extends DDBEnricherData {

  static RELEASE_ACTIVITY_NAME = "Symbiotic Biosphere: Release Pheromones";

  static RETALIATE_ID = utils.namedIDStub("Retaliate", { prefix: "ddb", postfix: "act" });

  static PROTECT_ID = utils.namedIDStub("Protect Monarch", { prefix: "ddb", postfix: "act" });

  static ENCHANTMENT_ID = utils.namedIDStub("Biosphere", { prefix: "ddb", postfix: "enc" });

  get hasProtectTheMonarch(): boolean {
    return this.hasClassFeature({ featureName: "Protect the Monarch", className: "Druid" });
  }

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: SymbioticBiosphere.RELEASE_ACTIVITY_NAME,
      useActivitySnippet: true,
      targetType: "self",
      rangeSelf: true,
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
      data: {
        enchant: {
          self: true,
        },
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  get retaliateActivity(): IDDBAdditionalActivity {
    return {
      init: {
        name: "Symbiotic Biosphere: Retaliate",
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        noeffect: true,
        generateActivation: true,
        generateRange: true,
        generateTarget: true,
        generateDamage: true,
        generateSave: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          value: 1,
          condition: "When you are targeted by a melee attack from a creature within 15 feet on its turn",
        },
        rangeOverride: {
          value: "15",
          units: "ft",
          special: "",
        },
        saveOverride: {
          ability: ["con"],
          dc: { calculation: "wis", formula: "" },
        },
        damageParts: [
          DDBEnricherData.basicDamagePart({
            customFormula: "@scale.hive.symbiotic-biosphere",
            types: ["poison"],
          }),
        ],
      },
      overrides: {
        id: SymbioticBiosphere.RETALIATE_ID,
        useActivitySnippet: true,
        addActivityConsume: true,
        data: {
          uses: {
            spent: 0,
            max: "1",
            recovery: [{ period: "turnStart", type: "recoverAll" }],
          },
        },
      },
    };
  }

  /**
   * Protect the Monarch lives in its own class feature, so its text is pulled from there; without an
   * explicit description the section-snippet fallback picks up the Retaliate text from this feature.
   */
  get protectTheMonarchActivity(): IDDBAdditionalActivity {
    const description = this.getClassFeatureDescription({ featureName: "Protect the Monarch", className: "Druid" });
    return {
      init: {
        name: "Symbiotic Biosphere: Protect the Monarch",
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateUtility: true,
        generateActivation: true,
        generateConsumption: false,
        activationOverride: {
          type: "reaction",
          value: 1,
          condition: "When you take damage from a source you can see",
        },
      },
      overrides: {
        id: SymbioticBiosphere.PROTECT_ID,
        targetType: "self",
        rangeSelf: true,
        noConsumeTargets: true,
        data: {
          ...(description ? { description: { value: description } } : {}),
          roll: {
            name: "Reduce Damage",
            formula: "@abilities.wis.mod + floor(@classes.druid.levels / 2)",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    const results = [this.retaliateActivity];
    if (this.hasProtectTheMonarch) results.push(this.protectTheMonarchActivity);
    return results;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    // Only reference Protect the Monarch once the activity exists, otherwise the rider is orphaned.
    const activityRiders = [SymbioticBiosphere.RETALIATE_ID];
    if (this.hasProtectTheMonarch) activityRiders.push(SymbioticBiosphere.PROTECT_ID);
    return [
      {
        name: "Symbiotic Biosphere: Active",
        type: "enchant",
        activityMatch: SymbioticBiosphere.RELEASE_ACTIVITY_NAME,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("Symbiotic Biosphere (Active)", 20, "name"),
        ],
        data: {
          _id: SymbioticBiosphere.ENCHANTMENT_ID,
          duration: {
            value: 60,
            units: "seconds",
          },
          flags: {
            ddbimporter: {
              activityRiders,
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Symbiotic Biosphere",
        includesName: true,
        max: "@abilities.wis.mod",
        period: "lr",
      }),
    };
  }

}
