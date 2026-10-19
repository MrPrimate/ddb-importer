import { logger } from "../../lib/_module";
import DDBBasicActivity from "./DDBBasicActivity";

export default class DDBMonsterFeatureActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBMonsterFeatureActivity ${this.name ?? this.type ?? "?"} for ${this.actor.name}`);
  }

  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null } = {}) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      actor: ddbParent.ddbMonster.npc,
      id,
    });

    this.actionData = ddbParent.actionData;
  }

  _generateActivation({ activationOverride = null, activationCondition }: {
    activationOverride?: I5eActivityActivation | null;
    activationCondition?: string;
  } = {}) {
    this.data.activation = foundry.utils.deepClone(activationOverride ?? this.actionData.activation);
    if (activationCondition !== undefined) this.data.activation.condition = activationCondition;
  }

  _generateConsumption({ consumptionOverride = null } = {}) {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    let targets = [];
    const scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    const consumptionType = this.ddbParent.usesOnActivity
      ? "activityUses"
      : "itemUses";

    if (this.actionData.consumptionTargets?.length > 0) {
      targets = this.actionData.consumptionTargets;
    } else if (this.actionData.consumptionValue) {
      targets.push({
        type: consumptionType,
        target: "",
        value: this.actionData.consumptionValue,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }

    this.data.consumption = {
      targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  _generateDescription() {
    this.data.description = {
      chatFlavor: this.foundryFeature.system?.chatFlavor ?? "",
    };
  }

  _generateDuration({ durationOverride = null }: { durationOverride?: I5eActivityDuration | null } = {}) {
    // cloned for the reason `_generateRange` gives: actionData.duration is shared by every
    // activity of the feature, and an enricher's own duration must not rewrite its siblings'
    if (durationOverride) {
      this.data.duration = { ...foundry.utils.deepClone(durationOverride), override: true };
      return;
    }
    this.data.duration = foundry.utils.deepClone(this.actionData.duration);
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange({ rangeOverride = null }: { rangeOverride?: I5eActivityRange | null } = {}) {
    // cloned: actionData.range is shared by every activity of the feature, and an enricher
    // `data.range` override merges in place, which would rewrite the sibling activities' range
    this.data.range = rangeOverride
      ? foundry.utils.deepClone(rangeOverride)
      : foundry.utils.deepClone(this.actionData.range as unknown as I5eActivityRange);
    // dnd5e replaces a weapon's activity range with the weapon's own unless it is flagged as an
    // override, so a cannon on a weapon-type feature would fire at the flail's 15 ft reach
    if (rangeOverride) this.data.range.override = true;
  }

  override _generateTarget({ targetOverride = null }: { targetOverride?: I5eActivityTarget | null } = {}) {
    // cloned: actionData.target is shared by every activity of the feature, and an enricher
    // override that blanks one activity's template must not blank its siblings through it
    this.data.target = foundry.utils.deepClone(targetOverride ?? this.actionData.target);
  }

  _getFeaturePartsDamage() {
    const baseParts = this.ddbParent.templateType === "weapon"
      ? this.actionData.damageParts.slice(1)
      : this.actionData.damageParts;

    return baseParts;
  }

  _generateDamage({ parts = [], includeBase = true, allowCritical = null, onSave = "half", criticalDamage = null }: {
    parts?: I5eDamagePart[] | null;
    includeBase?: boolean | null;
    allowCritical?: boolean | null;
    onSave?: string | null;
    criticalDamage?: string | null;
  } = {}) {
    const companion = foundry.utils.getProperty(this.ddbParent.ddbMonster, "npc.flags.ddbimporter.entityTypeId") === "companion-feature";

    let damageParts = parts.length > 0
      ? parts
      : this._getFeaturePartsDamage().map((data) => data.part);

    if (companion) {
      damageParts = damageParts.map((data) => {
        data.bonus = data.bonus.replace("@prof", "").replace(/\s*[-+]\s*$/, "");
        return data;
      });
    }

    this.data.damage = {
      critical: {
        allow: allowCritical ?? (this.type === "attack" || this.foundryFeature.type === "weapon"),
        ...(criticalDamage ? { bonus: criticalDamage } : {}),
      },
      onSave,
      includeBase,
      parts: damageParts,
    };

    // damage: {
    //   critical: {
    //     allow: false,
    //     bonus: source.system.critical?.damage
    //   },
    //   onSave: (source.type === "spell") && (source.system.level === 0) ? "none" : "half",
    //   includeBase: true,
    //   parts: damageParts.map(part => this.transformDamagePartData(source, part)) ?? []
    // }
  }

  _generateHealing({ part = null } = {}) {
    const healing = part
      ? part
      : this.actionData.healingParts.length > 0
        ? this.actionData.healingParts.map((data) => data.part)[0]
        : undefined;
    this.data.healing = healing;
  }

  _generateSave({ saveOverride = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    this.data.save = this.actionData.save;
  }


  override _generateAttack() {
    // a monster's Unarmed Strike is a natural weapon item, so the activity carries the unarmed part
    const classification = this.ddbParent.spellAttack
      ? "spell"
      : (/^Unarmed Strike\b/i).test(this.ddbParent.name)
        ? "unarmed"
        : "weapon";

    // a "Melee or Ranged" weapon (a thrown hammer or javelin) leaves the type at Default: dnd5e
    // resolves it from the weapon type as melee and rolls ranged only in the Thrown attack mode,
    // so modules such as AC5e do not treat every swing as a ranged attack in melee
    const parent = this.ddbParent as unknown as { templateType?: string; meleeAttack?: boolean; rangedAttack?: boolean };
    const meleeOrRangedWeapon = parent.templateType === "weapon"
      && parent.meleeAttack
      && parent.rangedAttack;
    const type = meleeOrRangedWeapon
      ? ""
      : this.ddbParent.rangedAttack
        ? "ranged"
        : "melee";

    const attack = {
      ability: this.actionData.baseAbility,
      bonus: this.actionData.extraAttackBonus && `${this.actionData.extraAttackBonus}`.trim() !== "0" ? `${this.actionData.extraAttackBonus}` : "",
      critical: {
        threshold: undefined,
      },
      flat: false, // almost never false for PC features
      type: {
        value: type,
        classification,
      },
    };

    this.data.attack = attack;

  }

  _generateCheck({ checkOverride = null }) {
    this.data.check = checkOverride ?? {
      associated: this.actionData.associatedToolsOrAbilities,
      ability: this.actionData.ability ?? "",
      dc: {},
    };
  }

  build({
    activationOverride,
    activationCondition,
    attackOverride = null,
    allowCritical,
    additionalTargets,
    attackData,
    chatFlavor,
    checkOverride = null,
    consumeActivity,
    consumeItem,
    criticalDamage,
    damageParts = [],
    damageScalingOverride,
    data,
    ddbMacroOverride,
    durationOverride,
    generateActivation = true,
    generateAttack = false,
    generateCheck = false,
    generateConsumption = true,
    generateDamage = false,
    generateDDBMacro = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateEnchant = false,
    generateHealing = false,
    generateRange = true,
    generateRoll = false,
    generateSave = false,
    generateSpell = false,
    generateSummon = false,
    generateTarget = true,
    generateUses,
    healingChatFlavor,
    healingPart = null,
    img,
    includeBaseDamage = true,
    noeffect,
    noManualActivation,
    onSave,
    rangeOverride,
    rollOverride,
    saveOverride,
    spellOverride,
    targetOverride,
    usesOverride,
    consumptionOverride = null,
  }: IDDBItemActivityBuild = {}) {

    // override set to false on object if overriding

    logger.debug(`Generating Activity for ${this.ddbParent.name}`, {
      damageParts,
      healingPart,
      generateActivation,
      generateAttack,
      generateConsumption,
      generateDamage,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave,
      generateTarget,
      includeBaseDamage,
      generateCheck,
      checkOverride,
      generateDDBMacro,
      generateRoll,
      rollOverride,
      generateSummon,
      consumptionOverride,
      saveOverride,
      allowCritical,
      this: this,
    });

    if (generateActivation) this._generateActivation({ activationOverride, activationCondition });
    // a lair option's attack ("The fist has a +11 bonus to hit") names its whole bonus
    if (generateAttack && attackOverride) this.data.attack = attackOverride;
    else if (generateAttack) this._generateAttack();
    if (generateConsumption) this._generateConsumption({ consumptionOverride });
    if (generateDescription) this._generateDescription();
    if (generateDuration) this._generateDuration({ durationOverride });
    if (generateEffects) this._generateEffects();
    if (generateRange) this._generateRange({ rangeOverride });
    if (generateTarget) this._generateTarget({ targetOverride });

    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({ parts: damageParts, includeBase: includeBaseDamage, allowCritical, onSave, criticalDamage });
    if (generateHealing) this._generateHealing({ part: healingPart });

    if (generateCheck) this._generateCheck({ checkOverride });

    super.build({
      generateActivation: false,
      generateAttack: false,
      generateSpell,
      generateConsumption: false,
      generateCheck: false,
      generateDamage: false,
      generateDescription,
      generateDuration: false,
      generateEffects: false,
      generateHealing: false,
      generateRange: false,
      generateSave: false,
      generateTarget: false,
      generateDDBMacro,
      generateEnchant,
      generateRoll,
      generateSummon,
      healingChatFlavor,
      generateUses,
      chatFlavor,
      onSave,
      noeffect,
      spellOverride,
      rollOverride,
      targetOverride,
      checkOverride,
      rangeOverride,
      activationOverride,
      noManualActivation,
      durationOverride,
      img,
      ddbMacroOverride,
      usesOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
      saveOverride,
      data,
      attackData,
      includeBaseDamage,
      criticalDamage,
      damageScalingOverride,
      healingPart,
      damageParts,
      allowCritical,
    });


  }

  static createActivity({ document, type, name, character } = {}, options = {}) {
    const activity = new DDBMonsterFeatureActivity({
      name: name ?? null,
      type,
      foundryFeature: document,
      actor: character,
    });

    activity.build(options);
    foundry.utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;

  }

}
