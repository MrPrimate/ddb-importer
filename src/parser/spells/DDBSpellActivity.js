import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBBasicActivity from "../enrichers/DDBBasicActivity.js";

export default class DDBSpellActivity {

  _init() {
    logger.debug(`Generating DDBSpellActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }

  _generateDataStub() {

    const rawStub = new this.activityType.documentClass({
      name: this.name,
      type: this.type,
    });

    this.data = rawStub.toObject();
    this.data._id = utils.namedIDStub(this.name ?? this.ddbParent.data.name ?? this.type, {
      prefix: this.nameIdPrefix,
      postfix: this.nameIdPostfix,
    });
  }


  constructor({
    type, name = null, ddbParent, nameIdPrefix = null, nameIdPostfix = null, spellEffects = null,
    cantripBoost = null, healingBoost = null,
  } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbParent = ddbParent;
    this.spellData = ddbParent.spellData;
    this.spellDefinition = this.spellData.definition;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

    this.spellEffects = spellEffects ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.addSpellEffects");
    this.damageRestrictionHints = game.settings.get("ddb-importer", "add-damage-restrictions-to-hints") && !this.spellEffects;

    this.isCantrip = this.spellDefinition.level === 0;
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

  _generateDescription() {
    this.data.description = {
      chatFlavor: this.foundryFeature.system?.chatFlavor ?? "",
    };
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  #getAlternativeFormula() {
    // this might be specifically for Toll the Dead only, but it's better than nothing
    let match = this.spellDefinition.description.match(/instead[\w\s]+(\d+d\d+) (\w+) damage/);
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
    const modScaleType = mod.atHigherLevels.scaleType ? mod.atHigherLevels.scaleType : this.spellDefinition.scaleType;
    const isHigherLevelDefinitions
      = mod.atHigherLevels.higherLevelDefinitions
      && Array.isArray(mod.atHigherLevels.higherLevelDefinitions)
      && mod.atHigherLevels.higherLevelDefinitions.length >= 1;

    if (isHigherLevelDefinitions && modScaleType === "spellscale") {
      const definition = mod.atHigherLevels.higherLevelDefinitions[0];
      if (definition) {
        scaleType = modScaleType;
      } else {
        logger.warn("No spell definition found for " + this.spellDefinition.name);
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
      logger.warn(`${this.spellDefinition.name} parse failed: `, modScaleType);
      scaleType = modScaleType; // if this is new/unknow will use default
    }

    return scaleType;
  }

  getScaling() {
    let baseDamage = "";
    let scaleDamage = "";
    let scaleType = null; // defaults to null, so will be picked up as a None scaling spell.

    // spell scaling
    if (this.spellDefinition.canCastAtHigherLevel) {
      // iterate over each spell modifier
      this.spellDefinition.modifiers
        .filter((mod) => mod.type === "damage" || (mod.type === "bonus" && mod.subType === "hit-points"))
        // eslint-disable-next-line complexity
        .forEach((mod) => {
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
          if (mod.atHigherLevels) {
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
            const modScaleType = mod.atHigherLevels.scaleType ? mod.atHigherLevels.scaleType : this.spellDefinition.scaleType;
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

                if (!existingMatch && !modMatch) {
                  scaleDamage = modScaleDamage;
                } else if (!existingMatch || modMatchValue > existingMatch[1]) {
                  scaleDamage = modScaleDamage;
                }
              } else {
                logger.warn("No definition found for " + this.spellDefinition.name);
              }
            } else if (isHigherLevelDefinitions && modScaleType === "characterlevel") {
              // cantrip support, important to set to a fixed value if using abilities like potent spellcasting
              scaleDamage = baseDamage;
            }

            scaleType = this.getScaleType(mod);
          }
        });
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

  buildDamagePart({ damageString, type } = {}) {
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

    const damage = DDBBasicActivity.buildDamagePart({ damageString, type });

    const scaling = this.getScaling();
    damage.scaling.mode = scaling.mode;

    if (scaling.old === "none") {
      return damage;
    }

    const scalingMatch = scaling.formula.match(/^\s*(\d+)d(\d+)\s*$/i);
    if ((scalingMatch && (Number(scalingMatch[2]) === damage.denomination))
      || (scaling.old === "cantrip")
    ) {
      damage.scaling.number = Number(scaling?.[1] || 1);
      damage.scaling.formula = "";
    } else {
      damage.scaling.formula = scaling.formula;
    }
    return damage;
  }


  _generateDamage({ damageParts = null, onSave = null, partialDamageParts } = {}) {

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
    const attacks = this.spellDefinition.modifiers.filter((mod) => mod.type === "damage");
    if (attacks.length !== 0) {
      attacks.forEach((attack) => {
        const restrictionText = attack.restriction && attack.restriction !== "" ? attack.restriction : "";
        if (!this.damageRestrictionHints && restrictionText !== "") {
          chatFlavor.push(`Restriction: ${restrictionText}`);
        }
        const addMod = attack.usePrimaryStat || this.cantripBoost ? " + @mod" : "";
        let diceString = utils.parseDiceString(attack.die.diceString, addMod).diceString;
        if (diceString && diceString.trim() !== "" && diceString.trim() !== "null") {
          const damage = this.buildDamagePart({
            damageString: diceString,
            type: attack.subType,
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
    if (versatile !== "" && this.ddbParent.data.damage) {
      this.ddbParent.data.damage.versatile = versatile;
    } else if (versatile) {
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

  _generateDDBMacro({ ddbMacroOverride = null } = {}) {
    if (ddbMacroOverride) {
      this.data.macro = ddbMacroOverride;
    }
  }

  _generateHealing({ healingPart } = {}) {
    if (healingPart.chatFlavor) this.data.description.chatFlavor = healingPart.chatFlavor;
    this.data.healing = healingPart.part;
  }

  _generateSave({ saveOverride = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    if (this.spellDefinition.requiresSavingThrow && this.spellDefinition.saveDcAbilityId) {
      const saveAbility = DICTIONARY.character.abilities
        .find((ability) => ability.id === this.spellDefinition.saveDcAbilityId)?.value;
      if (this.spellData.overrideSaveDc) {
        this.data.save = {
          ability: saveAbility,
          dc: {
            formula: this.spellData.overrideSaveDc,
            calculation: "",
          },
        };
      } else {
        this.data.save = {
          ability: saveAbility,
          dc: {
            formula: "",
            calculation: "spellcasting",
          },
        };
      }
    }
  }

  _generateAttack() {
    let type = this.spellDefinition.range.rangeValue
      && this.spellDefinition.range.rangeValue > 0
      ? "ranged"
      : "melee";

    const attack = {
      ability: "spellcasting",
      bonus: "",
      critical: {
        threshold: undefined,
      },
      flat: false, // almost never false for PC features
      type: {
        value: type,
        classification: "spell",
      },
    };

    this.data.attack = attack;
    foundry.utils.setProperty(this.data.damage, "includeBase", true);

  }

  _generateEnchant() {
    logger.debug(`Stubbed enchantment generation for ${this.name}`);
  }

  _generateSummon() {
    logger.debug(`Stubbed summon generation for ${this.name}`);
  }

  _generateRange({ rangeOverride = null } = {}) {
    if (rangeOverride) {
      this.data.range = rangeOverride;
      this.data.range.override = true;
    }
  }

  _generateRoll({ roll = null } = {}) {
    if (roll) {
      this.data.roll = roll;
    }
  }

  _generateTarget({ targetOverride = null } = {}) {
    if (targetOverride) {
      this.data.target = targetOverride;
      this.data.target.override = true;
    }
  }

  _generateActivation({ activationOverride = null } = {}) {
    if (activationOverride) {
      this.data.activation = activationOverride;
      this.data.activation.override = true;
    }
  }

  _generateDuration({ durationOverride = null } = {}) {
    if (durationOverride) {
      this.data.duration = durationOverride;
      this.data.duration.override = true;
    }
  }

  _generateUses({ usesOverride = null } = {}) {
    if (usesOverride) {
      this.data.uses = usesOverride;
      this.data.uses.override = true;
    }
  }

  // eslint-disable-next-line complexity
  build({
    generateAttack = false,
    generateConsumption = true,
    generateDamage = false,
    generateDDBMacro = false,
    generateDescription = false,
    generateEffects = true,
    generateEnchant = false,
    generateHealing = false,
    generateRoll = false,
    generateSave = false,
    generateSummon = false,
    healingPart = null,
    damageParts = null,
    chatFlavor = null,
    onSave = null,
    noeffect = false,
    roll = null,
    noSpellslot = false,
    targetOverride = null,
    rangeOverride = null,
    activationOverride = null,
    durationOverride = null,
    saveOverride = null,
    img = null,
    partialDamageParts = null,
    ddbMacroOverride = null,
    usesOverride = null,
    additionalTargets = [],
    consumptionOverride = null,
    consumeActivity = false,
    consumeItem = null,
  } = {}) {

    // logger.debug(`Generating Activity for ${this.ddbParent.name}`, {
    //   damageParts,
    //   healingPart,
    //   generateAttack,
    //   generateDDBMacro,
    //   generateConsumption,
    //   generateDamage,
    //   generateDescription,
    //   generateEffects,
    //   generateHealing,
    //   generateSave,
    //   chatFlavor,
    //   onSave,
    //   this: this,
    //   noeffect,
    //   roll,
    //   noSpellslot,
    //   targetOverride,
    //   rangeOverride,
    //   activationOverride,
    //   durationOverride,
    //   saveOverride,
    //   img,
    //   partialDamageParts,
    //   ddbMacroOverride,
    // });

    // override set to false on object if overriding

    if (activationOverride) this._generateActivation({ activationOverride });
    if (generateAttack) this._generateAttack();
    if (generateConsumption) this._generateConsumption({ consumptionOverride, additionalTargets, consumeActivity, consumeItem });
    if (generateDescription) this._generateDescription(chatFlavor);
    if (generateEffects) this._generateEffects();
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({ damageParts, onSave, partialDamageParts });
    if (generateEnchant) this._generateEnchant();
    if (generateSummon) this._generateSummon();
    if (generateHealing) this._generateHealing({ healingPart });
    if (rangeOverride) this._generateRange({ rangeOverride });
    if (targetOverride) this._generateTarget({ targetOverride });
    if (durationOverride) this._generateDuration({ durationOverride });
    if (generateDDBMacro) this._generateDDBMacro({ ddbMacroOverride });
    if (usesOverride) this._generateUses({ usesOverride });

    if (generateRoll) this._generateRoll({ roll });

    if (noSpellslot) {
      foundry.utils.setProperty(this.data, "consumption.spellSlot", false);
    }

    if (noeffect) {
      const ids = foundry.utils.getProperty(this.ddbParent.data, "flags.ddbimporter.noeffect") ?? [];
      ids.push(this.data._id);
      foundry.utils.setProperty(this.ddbParent.data, "flags.ddbimporter.noEffectIds", ids);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.noeffect", true);
    }
    if (img) {
      foundry.utils.setProperty(this.data, "img", img);
    }

    // ATTACK has
    // activation
    // attack
    // consumption
    // damage
    // description
    // duration
    // effects
    // range
    // target
    // uses

    // DAMAGE
    // activation
    // consumption
    // damage
    // description
    // duration
    // effects
    // range
    // target
    // uses


    // ENCHANT:
    // DAMAGE + enchant

    // HEAL
    // activation
    // consumption
    // healing
    // description
    // duration
    // effects
    // range
    // target
    // uses

    // SAVE
    // activation
    // consumption
    // damage
    // description
    // duration
    // effects
    // range
    // save
    // target
    // uses

    // SUMMON
    // activation
    // bonuses
    // consumption
    // creatureSizes
    // creatureTypes
    // description
    // duration
    // match
    // profles
    // range
    // summon
    // target
    // uses

    // UTILITY
    // activation
    // consumption
    // description
    // duration
    // effects
    // range
    // roll - name, formula, prompt, visible
    // target
    // uses


  }

}
