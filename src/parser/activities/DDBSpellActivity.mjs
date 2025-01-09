import { DICTIONARY } from "../../config/_module.mjs";
import { utils, logger } from "../../lib/_module.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";
import { SystemHelpers } from "../lib/_module.mjs";


export default class DDBSpellActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBSpellActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }

  constructor({
    type, name = null, ddbParent, nameIdPrefix = null, nameIdPostfix = null, spellEffects = null,
    cantripBoost = null, healingBoost = null, id = null,
  } = {}) {

    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      id,
    });

    this.spellData = ddbParent.spellData;
    this.ddbDefinition = this.spellData.definition;

    this.spellEffects = spellEffects ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.addSpellEffects");
    this.damageRestrictionHints = game.settings.get("ddb-importer", "add-damage-restrictions-to-hints") && !this.spellEffects;

    this.isCantrip = this.ddbDefinition.level === 0;
    const boost = cantripBoost ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.cantripBoost");
    this.cantripBoost = this.isCantrip && boost;

    const boostHeal = healingBoost ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.healingBoost");
    this.healingBonus = boostHeal ? ` + ${boostHeal} + @item.level` : "";

    this.additionalActivityDamageParts = [];
  }

  _generateConsumption({ consumptionOverride = null, additionalTargets = [], consumeActivity = false, consumeItem = null } = {}) {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    let targets = additionalTargets ?? [];
    let scaling = false;
    let spellSlot = true;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    // this is a spell with limited uses such as one granted by a feat
    if (consumeActivity) {
      spellSlot = false;
      targets.push({
        type: "activityUses",
        target: "", // this item
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.spellData.limitedUse || consumeItem) {
      spellSlot = false;
      targets.push({
        type: "itemUses",
        target: "", // this item
        value: this.spellData.limitedUse?.minNumberConsumed ?? 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }


    this.data.consumption = {
      spellSlot: spellSlot,
      targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  #getAlternativeFormula() {
    // this might be specifically for Toll the Dead only, but it's better than nothing
    let match = this.ddbDefinition.description.match(/instead[\w\s]+(\d+d\d+) (\w+) damage/);
    if (match) {
      return match[1];
    } else {
      return "";
    }
  }

  getScaleType(mod) {
    // scaleTypes:
    // SPELLSCALE - typical spells that scale
    // SPELLLEVEL - these spells have benefits that come in at particular levels e.g. bestow curse, hex. typically  duration changes
    // CHARACTERLEVEL - typical cantrip based levelling, some expections (eldritch blast)
    let scaleType = null;
    const modScaleType = mod.atHigherLevels.scaleType ? mod.atHigherLevels.scaleType : this.ddbDefinition.scaleType;
    const isHigherLevelDefinitions
      = mod.atHigherLevels.higherLevelDefinitions
      && Array.isArray(mod.atHigherLevels.higherLevelDefinitions)
      && mod.atHigherLevels.higherLevelDefinitions.length >= 1;

    if (isHigherLevelDefinitions && modScaleType === "spellscale") {
      const definition = mod.atHigherLevels.higherLevelDefinitions[0];
      if (definition) {
        scaleType = modScaleType;
      } else {
        logger.warn("No spell definition found for " + this.ddbDefinition.name);
      }
    } else if (modScaleType === "spellscale") {
      // lets handle cases where there is a spellscale type but no damage
      // increase/ higherleveldefinitins e.g. chain lighting
      // these type of spells typically increase targets so we set the
      // scaling to null as we don't want to increase damage when upcast.
      // this also deals with cases like Ice Knife where the upscale damage
      // is in one of the two mods provided.
      // we are capturing this else because we don't want to trigger
      // an update to scaleType or a warning.
    } else if (modScaleType === "characterlevel") {
      // lets handle odd cantrips like Eldritch Blast
      // (in fact this might be the only case)
      if (mod.atHigherLevels.higherLevelDefinitions.length === 0) {
        // if this array is empty it does not contain levelling information
        // the only case found is Eldritch Blast.
        // this does have some info around multiple beams in
        // data.atHigherLevels but we ignore this. we will set the scaling
        // to null as each beam is best modelled by "casting" the cantrip again/
        // pressing the attack/damage buttons in FVTT
        scaleType = null;
      } else {
        scaleType = modScaleType;
      }
    } else if (modScaleType === "spelllevel") {
      // spells that have particular level associated benefits
      // these seem to be duration increases or target increases for
      // the most part we can't handle these in FVTT right now (we could
      // in theory create a new spell at a higher level).
      // some duration upcasting (like bestow curse) affects concentration
      // for now we will do nothing with these spells.
      // examples include: hex, shadowblade, magic weapon, bestow curse
      scaleType = modScaleType;
    } else {
      logger.warn(`${this.ddbDefinition.name} parse failed: `, modScaleType);
      scaleType = modScaleType; // if this is new/unknow will use default
    }

    return scaleType;
  }

  // eslint-disable-next-line complexity
  getScaling({ damageMod = null } = {}) {
    let baseDamage = "";
    let scaleDamage = "";
    let scaleType = null; // defaults to null, so will be picked up as a None scaling spell.

    // spell scaling
    if (this.ddbDefinition.canCastAtHigherLevel) {
      const damageMods = damageMod
        ? [damageMod]
        : this.ddbDefinition.modifiers
          .filter((mod) => mod.type === "damage" || (mod.type === "bonus" && mod.subType === "hit-points"));

      // iterate over each spell modifier
      for (const mod of damageMods) {
        // if the modifier has a die for damage, lets use the string or fixed value
        // for the base damage
        if (mod && mod.die) {
          if (mod.die.diceString !== null) {
            baseDamage = mod.die.diceString;
          }

          if (mod.die.fixedValue !== null && baseDamage === "") {
            baseDamage = mod.die.fixedValue;
          }
        }

        // defines some details about higher level casting
        if (!mod.atHigherLevels) continue;
        // scaleTypes:
        // SPELLSCALE - typical spells that scale
        // SPELLLEVEL - these spells have benefits that come in at particular levels e.g. bestow curse, hex. typically  duration changes
        // CHARACTERLEVEL - typical cantrip based levelling, some expections (eldritch blast)

        // mod.atHigherLevels.higherLevelDefinitions contains info about the
        // spells damage die at higher levels, but we can't use this for cantrips as
        // FVTT use a formula to work out the scaling (ddb has a fixed value structure)
        const isHigherLevelDefinitions
          = mod.atHigherLevels.higherLevelDefinitions
          && Array.isArray(mod.atHigherLevels.higherLevelDefinitions)
          && mod.atHigherLevels.higherLevelDefinitions.length >= 1;

        // lets handle normal spell leveling first
        const modScaleType = mod.atHigherLevels.scaleType
          ? mod.atHigherLevels.scaleType
          : this.ddbDefinition.scaleType;
        if (isHigherLevelDefinitions && modScaleType === "spellscale") {
          const definition = mod.atHigherLevels.higherLevelDefinitions[0];
          if (definition) {
            const die = definition.dice ? definition.dice : definition.die ? definition.die : undefined;
            const modScaleDamage
              = die?.diceString // if dice string
                ? die.diceString // use dice string
                : die?.fixedValue // else if fixed value
                  ? die.fixedValue // use fixed value
                  : definition.value; // else use value

            // some spells have multiple scaling damage (e.g. Wall of Ice,
            // Glyph of warding, Acid Arrow, Arcane Hand, Dragon's Breath,
            // Chromatic Orb, Absorb Elements, Storm Sphere, Spirit Guardians)
            // it's hard to model most of these in FVTT, and for some it makes
            // no difference. so...
            // lets optimistically use the highest
            // assumptions: these are going to be dice strings, and we don't care
            // about dice value, just number of dice
            const diceFormula = /(\d*)d\d*/;
            const existingMatch = diceFormula.exec(scaleDamage);
            const modMatch = diceFormula.exec(modScaleDamage);

            const modMatchValue = modMatch
              ? modMatch.length > 1 ? modMatch[1] : modMatch[0]
              : undefined;

            // eslint-disable-next-line max-depth
            if (!existingMatch && !modMatch) {
              scaleDamage = modScaleDamage;
            } else if (!existingMatch || modMatchValue > existingMatch[1]) {
              scaleDamage = modScaleDamage;
            }
          } else {
            logger.warn("No definition found for " + this.ddbDefinition.name);
          }
        } else if (isHigherLevelDefinitions && modScaleType === "characterlevel") {
          // cantrip support, important to set to a fixed value if using abilities like potent spellcasting
          scaleDamage = baseDamage;
        }

        scaleType = this.getScaleType(mod);
      }
    }

    // KNOWN_ISSUE_4_0: we can probs determine if something is doing a half scale here

    switch (scaleType) {
      case "characterlevel":
        return {
          old: "cantrip",
          mode: "whole",
          formula: String(scaleDamage),
        };
      case "spellscale":
        return {
          old: "level",
          mode: "whole",
          formula: String(scaleDamage),
        };
      case "spelllevel":
      case null:
        return {
          old: "none",
          mode: "",
          formula: "",
        };
      default:
        return {
          old: "level",
          mode: "whole",
          formula: "",
        };
    }
  }

  buildDamagePart({ damageString, type, damageMod = null } = {}) {
    // const damage = {
    //   number: null,
    //   denomination: null,
    //   bonus: "",
    //   types: type ? [type] : [],
    //   custom: {
    //     enabled: false,
    //     formula: "",
    //   },
    //   scaling: {
    //     mode: "", // whole, half or ""
    //     number: null,
    //     formula: "",
    //   },
    // };

    const damage = SystemHelpers.buildDamagePart({ damageString, type });

    const scaling = this.getScaling({ damageMod });
    damage.scaling.mode = scaling.mode;

    if (scaling.old === "none") {
      return damage;
    }

    const scalingMatch = scaling.formula.match(/^\s*(\d+)d(\d+)\s*$/i);
    if (scalingMatch && Number(scalingMatch[2]) === damage.denomination) {
      damage.scaling.number = Number(scalingMatch[1] ?? 1);
      damage.scaling.formula = "";
    } else {
      damage.scaling.formula = scaling.formula;
    }
    return damage;
  }


  _generateDamage({ damageParts = null, onSave = null, partialDamageParts, modRestrictionFilter = null,
    modRestrictionFilterExcludes = null } = {},
  ) {

    if (damageParts) {
      this.data.damage = {
        parts: damageParts,
        onSave: onSave ?? (this.isCantrip ? "none" : "half"), // default to half
      };
      return;
    }

    let parts = [];
    let versatile = "";
    let chatFlavor = [];

    // damage
    const damages = this.ddbDefinition.modifiers
      .filter((mod) => mod.type === "damage")
      .filter((mod) =>
        modRestrictionFilterExcludes === null
        || ((
          !mod.restriction
          || mod.restriction === ""
          || (mod.restriction && !modRestrictionFilterExcludes.some((exclude) => mod.restriction.toLowerCase().includes(exclude.toLowerCase())))
        )),
      )
      .filter((mod) =>
        modRestrictionFilter === null
        || (mod.restriction && modRestrictionFilter.some((exclude) => mod.restriction.toLowerCase().includes(exclude.toLowerCase()))),
      );
    if (damages.length !== 0) {
      damages.forEach((damageMod) => {
        const restrictionText = damageMod.restriction && damageMod.restriction !== "" ? damageMod.restriction : "";
        if (!this.damageRestrictionHints && restrictionText !== "") {
          chatFlavor.push(`Restriction: ${restrictionText}`);
        }
        const addMod = damageMod.usePrimaryStat || this.cantripBoost ? " + @mod" : "";
        let diceString = utils.parseDiceString(damageMod.die.diceString, addMod).diceString;
        if (diceString && diceString.trim() !== "" && diceString.trim() !== "null") {
          const damage = this.buildDamagePart({
            damageString: diceString,
            type: damageMod.subType,
            damageMod,
          });
          parts.push(damage);
        }
      });

      // This is probably just for Toll the dead.
      const alternativeFormula = this.#getAlternativeFormula(this.spellData);
      versatile = this.cantripBoost && alternativeFormula && alternativeFormula != ""
        ? `${alternativeFormula} + @mod`
        : alternativeFormula;
    }

    this.data.description.chatFlavor = chatFlavor.join(", ");
    if (versatile) {
      const damage = this.buildDamagePart({ damageString: versatile });
      this.additionalActivityDamageParts.push(damage);
    }

    if (partialDamageParts) {
      const partialParts = [];
      for (const part of partialDamageParts) {
        partialParts.push(parts[part]);
      }
      parts = partialParts;
    }

    if (this.ddbParent.enricher?.activity?.splitDamage) {
      parts = parts.slice(0, 1);
    }

    this.data.damage = {
      parts,
      onSave: this.isCantrip ? "none" : "half", // default to half
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

  _generateSave({ saveOverride = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    if (this.ddbDefinition.requiresSavingThrow && this.ddbDefinition.saveDcAbilityId) {
      const saveAbility = DICTIONARY.actor.abilities
        .find((ability) => ability.id === this.ddbDefinition.saveDcAbilityId)?.value;
      if (this.spellData.overrideSaveDc) {
        this.data.save = {
          ability: [saveAbility],
          dc: {
            formula: this.spellData.overrideSaveDc,
            calculation: "",
          },
        };
      } else {
        this.data.save = {
          ability: [saveAbility],
          dc: {
            formula: "",
            calculation: "spellcasting",
          },
        };
      }
    }
  }

  // eslint-disable-next-line complexity
  build({
    activationOverride = null,
    additionalTargets = [],
    attackData = {},
    spellOverride = null,
    chatFlavor = null,
    checkOverride = null,
    consumeActivity = false,
    consumeItem = null,
    consumptionOverride = null,
    criticalDamage = null,
    damageParts = null,
    damageScalingOverride = null,
    data = null,
    ddbMacroOverride = null,
    durationOverride = null,
    generateActivation = false,
    generateAttack = false,
    generateCheck = false,
    generateSpell = false,
    generateConsumption = true,
    generateDamage = false,
    generateDDBMacro = false,
    generateDescription = false,
    generateDuration = false,
    generateEffects = true,
    generateEnchant = false,
    generateHealing = false,
    generateRange = false,
    generateRoll = false,
    generateSave = false,
    generateSummon = false,
    generateTarget = false,
    generateUses = false,
    healingPart = null,
    img = null,
    includeBaseDamage = false,
    noeffect = false,
    noSpellslot = false,
    onSave = null,
    partialDamageParts = null,
    rangeOverride = null,
    roll = null,
    saveOverride = null,
    targetOverride = null,
    usesOverride = null,
    modRestrictionFilter = null,
    modRestrictionFilterExcludes = null,
  } = {}) {

    if (generateConsumption) this._generateConsumption({
      consumptionOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
    });
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({
      damageParts,
      onSave,
      partialDamageParts,
      modRestrictionFilter,
      modRestrictionFilterExcludes,
    });

    if (noSpellslot) {
      foundry.utils.setProperty(this.data, "consumption.spellSlot", false);
    }

    super.build({
      generateActivation: generateActivation || activationOverride !== null,
      generateAttack,
      generateSpell,
      generateConsumption: false,
      generateCheck,
      generateDamage: false,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave: false,
      generateTarget,
      generateDDBMacro,
      generateEnchant,
      generateRoll,
      generateSummon,
      generateUses,
      chatFlavor,
      onSave,
      noeffect,
      roll,
      spellOverride,
      targetOverride,
      checkOverride,
      rangeOverride,
      activationOverride,
      noManualActivation: true,
      durationOverride,
      img,
      ddbMacroOverride,
      usesOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
      saveOverride,
      data,
      attackData: foundry.utils.mergeObject({
        ability: "spellcasting",
        bonus: "",
        criticalThreshold: undefined,
        type: this.ddbDefinition.range.rangeValue && this.ddbDefinition.range.rangeValue > 0
          ? "ranged"
          : "melee",
        flat: false,
        classification: "spell",
      }, attackData),
      includeBaseDamage,
      criticalDamage,
      damageScalingOverride,
      healingPart: healingPart?.part ?? healingPart ?? null,
      healingChatFlavor: healingPart?.chatFlavor ?? null,
      damageParts,
    });

  }

}
