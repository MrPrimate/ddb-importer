import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import { itemActivity } from "./_ItemActivities";

/**
 * The trick weapons DDB ships as several items: a base copy (often a wondrous item with no weapon
 * stats) and one weapon copy per state. Every copy imports as the same weapon in its Untransformed
 * form, with a Transform self-enchantment that switches its stats to the Transformed form; using
 * it again reverts, as dnd5e toggles a self-enchantment. Form-only hit damage is a damage rule on
 * the enchantment, which lands in the weapon's own applied rules, and actor-level form bonuses are
 * effect riders that dnd5e creates with the enchantment.
 *
 * On a character import the copies take the weapon's name, the Transformed copy imports already
 * transformed, and only one copy is kept (STATE_COPIES in parser/character/inventory.ts). Munched
 * copies keep DDB's names: the compendium matches items by name, type and ruleset, so same-named
 * weapons would collapse into one.
 */
export default abstract class TrickWeapon extends DDBEnricherData {

  static TRANSFORM_NAME = "Transform";

  static TRANSFORM_ACTIVITY_ID = utils.namedIDStub(TrickWeapon.TRANSFORM_NAME, { prefix: "ddbItem" });

  /** Roll-time condition limiting a damage rule to the weapon's attacks, not its save properties. */
  static ATTACK_ACTIVITY: IEffectChangeFilter = { k: "activity.type", o: "exact", v: "attack" };

  /** Extra damage on a hit while the enchantment is applied, as its own typed part. */
  static onHitDamage(formula: string, damageType: string): IActiveEffectChangeData {
    return DDBEnricherData.ChangeHelper.ruleBonusChange("damage", `${formula}[${damageType}]`, {
      conditions: TrickWeapon.ATTACK_ACTIVITY,
    });
  }

  /** The id itemProperty gives a property activity, for listing it in `transformedActivityRiders`. */
  static propertyActivityId(name: string): string {
    return utils.namedIDStub(name, { prefix: "ddbItem" });
  }

  /** The weapon's name, which every copy takes on a character import. */
  abstract get weaponName(): string;

  abstract get untransformed(): ITrickWeaponForm;

  abstract get transformed(): ITrickWeaponForm;

  /** DDB's name for the copy that is already in the Transformed form. */
  abstract get transformedCopyName(): string;

  get magicBonus(): number {
    return 0;
  }

  /** Properties both forms have beyond their base weapon's. */
  get sharedProperties(): string[] {
    return [];
  }

  /** Extra damage parts on the Untransformed form's attack. */
  get untransformedAttackParts(): I5eDamagePart[] {
    return [];
  }

  /** What the Transform enchantment changes beyond the Transformed form's stats. */
  get transformedChanges(): IActiveEffectChangeData[] {
    return [];
  }

  /** Ids of transferring effects in `passiveEffects` that only exist while Transformed. */
  get transformedEffectRiders(): string[] {
    return [];
  }

  /** Ids of activities in `propertyActivities` that only exist while Transformed. */
  get transformedActivityRiders(): string[] {
    return [];
  }

  get transformActivation(): { type: TActivationCost; condition: string } {
    return { type: "bonus", condition: "" };
  }

  /** The weapon's other activated or triggered properties. */
  get propertyActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  /** Effects other than the Transform enchantment: passive bonuses, statuses, riders. */
  get passiveEffects(): IDDBEffectHint[] {
    return [];
  }

  /** Extra system data every copy takes (proficiency, charges). */
  get systemData(): Record<string, unknown> {
    return {};
  }

  get transformEffectId(): string {
    return utils.namedIDStub(`${this.weaponName} Transformed`, { prefix: "ench", postfix: "ef" });
  }

  get isTransformedCopy(): boolean {
    return utils.nameString(this.name ?? "") === this.transformedCopyName;
  }

  formProperties(form: ITrickWeaponForm): string[] {
    return [...new Set([...form.properties, ...this.sharedProperties, ...(this.magicBonus > 0 ? ["mgc"] : [])])];
  }

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "weapon",
      parsingType: "weapon",
      systemType: {
        value: this.untransformed.typeValue,
        baseItem: this.untransformed.baseItem,
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      // the parser stubs the id from the copy's name; one id keeps every copy the same weapon
      id: utils.namedIDStub(this.weaponName, { prefix: "attack" }),
      noeffect: true,
      data: {
        attack: {
          type: { value: this.untransformed.attackType, classification: "weapon" },
        },
        damage: {
          includeBase: true,
          parts: this.untransformedAttackParts,
        },
      },
    };
  }

  // DDB's restricted per-form modifiers would otherwise become "Restriction:" attack copies
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  // DDB's modifiers differ per copy (the Transformed copy carries Transformed-only bonuses), so
  // every effect is declared here instead
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activation = this.transformActivation;
    const transform = itemActivity(TrickWeapon.TRANSFORM_NAME, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
      noeffect: false,
      activationType: activation.type,
      activationCondition: activation.condition,
      data: {
        enchant: { self: true },
        restrictions: { type: "weapon", allowMagical: true },
        // an applied effect with no expiry inherits the activity's duration; the form is open-ended
        duration: { value: "", units: "spec", special: `Until you change it back to its ${this.untransformed.label} form` },
      },
    });
    return [transform, ...this.propertyActivities];
  }

  /**
   * The weapon's name in a form. A munched copy keeps DDB's name ("Meat Hookshot (Sickle)"), which
   * a "{} (Battleaxe)" suffix would add to, so it takes the weapon's name instead.
   */
  formName(label: string): string {
    return this.ddbParser.isMuncher ? `${this.weaponName} (${label})` : `{} (${label})`;
  }

  /** The changes that turn the Untransformed weapon into the given form. */
  formChanges(form: ITrickWeaponForm): IActiveEffectChangeData[] {
    const helper = DDBEnricherData.ChangeHelper;
    const changes = [
      helper.overrideChange(this.formName(form.label), 20, "name"),
      helper.overrideChange(form.typeValue, 20, "system.type.value"),
      helper.overrideChange(form.baseItem, 20, "system.type.baseItem"),
      helper.overrideChange(form.number, 20, "system.damage.base.number"),
      helper.overrideChange(form.denomination, 20, "system.damage.base.denomination"),
      helper.overrideChange(form.damageType, 20, "system.damage.base.types"),
      helper.overrideChange(form.mastery, 20, "system.mastery"),
      helper.overrideChange(form.range.value, 20, "system.range.value"),
    ];
    // an empty override cannot be cast to the NumberField (core logs a warning on every prepare);
    // a form without a long range is melee, and dnd5e clears a melee weapon's range itself
    if (typeof form.range.long === "number") changes.push(helper.overrideChange(form.range.long, 20, "system.range.long"));
    // An override of the whole set stores the JSON text as one bogus property, which also loses
    // "mgc" (and with it the attunement requirement and magical bonus), so only the properties
    // the form gains or loses change; a value prefixed with "-" removes one from the set
    const current = this.formProperties(this.untransformed);
    const target = this.formProperties(form);
    for (const property of target.filter((p) => !current.includes(p))) {
      changes.push(helper.addChange(property, 20, "system.properties"));
    }
    for (const property of current.filter((p) => !target.includes(p))) {
      changes.push(helper.addChange(`-${property}`, 20, "system.properties"));
    }
    if (form.versatile) {
      changes.push(helper.overrideChange(
        JSON.stringify(DDBEnricherData.basicDamagePart({ ...form.versatile, types: [form.damageType] })),
        20,
        "system.damage.versatile",
      ));
    }
    if (form.attackType !== this.untransformed.attackType) {
      changes.push(helper.overrideChange(form.attackType, 20, "activities[attack].attack.type.value"));
    }
    return changes;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: `${this.weaponName}: ${this.transformed.label}`,
        type: "enchant",
        activityMatch: TrickWeapon.TRANSFORM_NAME,
        changes: [
          ...this.formChanges(this.transformed),
          // the weapon's only enchant activity is Transform, and its next use removes this enchantment
          DDBEnricherData.ChangeHelper.overrideChange(
            `Revert to ${this.untransformed.label}`, 20, "activities[enchant].name",
          ),
          ...this.transformedChanges,
        ],
        options: {
          showIcon: 2,
          description: `The weapon is in its Transformed form (${this.transformed.label}). Use the activity again to change it back.`,
        },
        data: {
          _id: this.transformEffectId,
          flags: {
            ddbimporter: {
              effectIdLevel: { min: null, max: null },
              activityRiders: this.transformedActivityRiders,
              effectRiders: this.transformedEffectRiders,
            },
          },
        },
      },
      ...this.passiveEffects,
    ];
  }

  override get override(): IDDBOverrideData {
    const form = this.untransformed;
    const versatile = form.versatile
      ? DDBEnricherData.basicDamagePart({ ...form.versatile, types: [form.damageType] })
      : undefined;
    // linkSelectedEnchantments only applies this while the weapon is equipped (and attuned, when
    // it needs attunement)
    const flags: IDDBImporterFlags = this.isTransformedCopy && !this.ddbParser.isMuncher
      ? {
        transferEnchantment: {
          targetItemId: "self",
          effectId: this.transformEffectId,
          activityId: TrickWeapon.TRANSFORM_ACTIVITY_ID,
        },
      }
      : {};
    return {
      data: {
        ...(this.ddbParser.isMuncher ? {} : { name: this.weaponName }),
        system: {
          type: { value: form.typeValue, baseItem: form.baseItem },
          damage: {
            base: {
              number: form.number,
              denomination: form.denomination,
              bonus: "",
              types: [form.damageType],
              custom: { enabled: false, formula: "" },
            },
            ...(versatile ? { versatile } : {}),
          },
          properties: this.formProperties(form),
          mastery: form.mastery,
          range: { value: form.range.value, long: form.range.long ?? null, reach: form.range.reach ?? null, units: "ft" },
          ...(this.magicBonus > 0 ? { magicalBonus: this.magicBonus } : {}),
          ...this.systemData,
        },
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

}
