import DDBDataUtils from "../../../lib/DDBDataUtils";
import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * Shared behaviour for Crimson Rite and the individual rites.
 *
 * Invoking a rite costs the blood hunter a hemocraft die of necrotic damage;
 * applying it enchants a weapon so that it deals an extra hemocraft die of the
 * damage type determined by the chosen rite.
 *
 * The leading underscore keeps this out of the name lookup - pascalCase of a
 * DDB feature name can never start with one - while still being exported by
 * the generated barrel.
 */
export default class _CrimsonRite extends _BloodHunter {

  static RITE_DIE = "@scale.blood-hunter.crimson-rite.die";

  /** rite name -> extra damage type, from the class feature text */
  static RITE_TYPES: Record<string, string> = {
    "Rite of the Flame": "fire",
    "Rite of the Frozen": "cold",
    "Rite of the Storm": "lightning",
    "Rite of the Dead": "necrotic",
    "Rite of the Oracle": "psychic",
    "Rite of the Roar": "thunder",
    "Rite of the Dawn": "radiant",
  };

  /** Overridden by each rite; the parent feature does not use it. */
  get riteName(): string {
    return this.name;
  }

  get riteDamageType(): string {
    return _CrimsonRite.RITE_TYPES[this.riteName] ?? "";
  }

  /** Rite of the Dawn overrides this with its own subclass scale. */
  get riteDie(): string {
    return _CrimsonRite.RITE_DIE;
  }

  /** Self hemocraft-die necrotic damage, paid to activate a rite. */
  get invokeRiteActivity(): IDDBActivityData {
    return {
      name: "Invoke Rite",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Take hemocraft die damage (cannot be reduced in any way)",
      allowCritical: false,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.riteDie,
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  static applyRiteName(riteName: string | null): string {
    return riteName ? `Apply ${riteName}` : "Apply Rite";
  }

  /** The enchant activity that puts one rite onto a held weapon. */
  applyRiteActivity(riteName: string | null = null): IDDBAdditionalActivity {
    return {
      init: {
        name: _CrimsonRite.applyRiteName(riteName),
        type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      },
      build: {
        generateActivation: true,
        generateDamage: false,
      },
      overrides: {
        // the choice documents carry no activation of their own, so set it
        // explicitly rather than relying on the generated one
        activationType: "bonus",
        data: {
          restrictions: {
            allowMagical: true,
          },
        },
      },
    };
  }

  /**
   * The weapon enchantment for one rite. The extra die is a typed damage part
   * rather than a base bonus, so it does not take the weapon's own type.
   */
  riteEnchantEffect(riteName: string | null = null, { effectRiders = [] }: { effectRiders?: string[] } = {}): IDDBEffectHint {
    const damageType = riteName ? _CrimsonRite.RITE_TYPES[riteName] ?? "" : "";
    const label = riteName ?? "Crimson Rite";
    const formula = damageType
      ? `[["${this.riteDie}[${damageType}]", "${damageType}"]]`
      : `[["${this.riteDie}", ""]]`;

    const hint: IDDBEffectHint = {
      name: label,
      activityMatch: _CrimsonRite.applyRiteName(riteName),
      type: "enchant",
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange(`{} [${label}]`, 10, "name"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(formula, 10, "system.damage.parts"),
      ],
    };

    if (effectRiders.length > 0) {
      hint.data = {
        flags: {
          ddbimporter: {
            effectIdLevel: { min: null, max: null },
            activityRiders: [],
            effectRiders,
          },
        },
      };
    }

    return hint;
  }

  /**
   * The rites this character has actually chosen, as DDB choice labels. Only
   * meaningful on the parent Crimson Rite feature, which owns the choices.
   */
  get knownRites(): string[] {
    const ddb = this.ddbParser?.ddbData;
    const feat = this.ddbParser?.ddbFeature;
    if (!ddb || !feat) return [];

    const choices = DDBDataUtils.getChoices({
      ddb,
      type: "class",
      feat,
      selectionOnly: true,
    });

    const rites = choices
      .map((choice) => choice.label)
      .filter((label) => label in _CrimsonRite.RITE_TYPES);

    return [...new Set(rites)];
  }

}
