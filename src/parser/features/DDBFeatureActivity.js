
// game.dnd5e.documents.activity
// ActivityMixin(…)
// AttackActivity(…)
// DamageActivity(…)
// EnchantActivity(…)
// HealActivity(…)
// SaveActivity(…)
// SummonActivity(…)
// UtilityActivity(…)

import DICTIONARY from "../../dictionary.js";
import DDBEffectHelper from "../../effects/DDBEffectHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";


// CONFIG.DND5E.activityTypes


export default class DDBFeatureActivity {

  _init() {
    logger.debug(`Generating DDBFeatureActivity ${this.name ?? ""} for ${this.ddbParent.name}`);
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


  constructor({ type, name = null, ddbParent, nameIdPrefix = null, nameIdPostfix = null } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbParent = ddbParent;
    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

    this.ddbDefinition = this.ddbParent.ddbDefinition;

  }

  _generateParsedActivation() {
    const actionType = this.ddbParent.getParsedActionType();
    if (!actionType) return;
    logger.debug(`Parsed manual activation type: ${actionType} for ${this.name}`);
    this.data.activation = {
      type: actionType,
      cost: 1,
      condition: "",
    };
  }

  // note spells do not have activation
  _generateActivation({ activationOverride = null } = {}) {
    if (activationOverride) {
      this.data.activation = activationOverride;
      return;
    }
    // console.warn(`Generating Activation for ${this.name}`);
    if (!this.ddbDefinition.activation) {
      this._generateParsedActivation();
      return;
    }
    const actionType = DICTIONARY.actions.activationTypes
      .find((type) => type.id === this.ddbDefinition.activation.activationType);
    if (!actionType) {
      this._generateParsedActivation();
      return;
    }

    this.data.activation = {
      type: actionType.value,
      value: this.ddbDefinition.activation.activationTime || 1,
      condition: "",
    };
  }

  _generateConsumption({ consumptionOverride = null } = {}) {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    let targets = [];
    let scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    if (this.ddbParent.rawCharacter) {
      Object.keys(this.ddbParent.rawCharacter.system.resources).forEach((resource) => {
        const detail = this.ddbParent.rawCharacter.system.resources[resource];
        if (this.ddbDefinition.name === detail.label) {
          targets.push({
            type: "attribute",
            target: `resources.${resource}.value`,
            value: 1,
            scaling: {
              mode: "",
              formula: "",
            },
          });
        }
      });
    }

    // Future check for hit dice expenditure?
    // expend one of its Hit Point Dice,
    // you can spend one Hit Die to heal yourself.
    // right now most of these target other creatures

    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const kiPointRegex = /(?:spend|expend) (\d) (?:ki|focus) point/;
    const sorceryPoint = /spend (\d) sorcery points/ig;
    const match = kiPointRegex.exec(description)
      ?? sorceryPoint.exec(description);

    if (match) {
      targets.push({
        type: "itemUses",
        target: "", // adjusted later
        value: match[1],
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.ddbParent.resourceCharges !== null) {
      targets.push({
        type: "itemUses",
        target: "", // adjusted later
        value: this.ddbParent.resourceCharges ?? 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.ddbParent.data.system.uses.max) {
      targets.push({
        type: "itemUses",
        target: "", // adjusted later
        value: 1,
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

  _generateDuration({ durationOverride = null } = {}) {
    if (durationOverride) {
      this.data.duration = durationOverride;
      return;
    }
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const duration = DDBEffectHelper.getDuration(description, false);

    if (duration.type === null) {
      this.data.duration = {
        value: null,
        units: "inst",
        special: "",
      };
      return;
    }

    this.data.duration = {
      value: duration.value,
      units: duration.units,
      special: duration.special,
    };
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange({ rangeOverride = null } = {}) {
    if (rangeOverride) {
      this.data.range = rangeOverride;
      return;
    }
    if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
      this.data.range = {
        value: null,
        units: "self",
        special: "",
      };
    } else if (this.ddbDefinition.range && this.ddbDefinition.range.range) {
      this.data.range = {
        value: this.ddbDefinition.range.range,
        units: "ft",
        special: "",
      };
    } else {
      this.data.range = {
        value: ["utility", "summons", "enchant"].includes(this.type) ? null : 5,
        units: ["utility", "summons", "enchant"].includes(this.type) ? "self" : "ft",
        special: "",
      };
      const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
      const touchRegex = /touch a creature|creature you touch/ig;
      const touch = touchRegex.exec(description);
      if (touch) {
        this.data.range.units = "touch";
      }
    }

  }

  // eslint-disable-next-line complexity
  _getDescriptionTarget() {
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    let target = {
      prompt: true,
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
    };

    const targetsCreature = this.ddbParent.targetsCreature();
    const creatureTargetCount = (/(each|one|a|the) creature(?: or object)?/ig).exec(description);

    if (targetsCreature || creatureTargetCount) {
      target.affects.count = creatureTargetCount && ["one", "a", "the"].includes(creatureTargetCount[1]) ? "1" : "";
      target.affects.type = creatureTargetCount && creatureTargetCount[2] ? "creatureOrObject" : "creature";
    }
    const aoeSizeRegex = /(?:within|in a|fills a) (?<within>\d+)(?: |-)(?:feet|foot|ft|ft\.)(?: |-)(cone|radius|emanation|sphere|line|cube|of it|of an|of the|of you|of yourself)(\w+[. ])?/ig;
    const aoeSizeMatch = aoeSizeRegex.exec(description);

    // console.warn(`Target generation for ${this.name}`, {
    //   targetsCreature,
    //   creatureTargetCount,
    //   aoeSizeMatch,
    // });

    if (aoeSizeMatch) {
      if (aoeSizeMatch[2] && ["of you"].includes(aoeSizeMatch[2].trim())) {
        this.data.range.value = aoeSizeMatch.groups.within ?? "";
        this.data.range.units = "ft";
      } else {
        const type = aoeSizeMatch[3]?.trim() ?? aoeSizeMatch[2]?.trim() ?? "radius";
        target.template.type = ["cone", "radius", "sphere", "line", "cube"].includes(type) ? type : "radius";
        target.template.size = aoeSizeMatch.groups.within ?? "";
      }
    }

    const chooseRegex = /creature of your choice|choose (?<num>\w+) creatures within/ig;
    const chooseMatch = chooseRegex.exec(description);
    if (chooseMatch) {
      if (this.data.damage?.parts?.length > 0 || ["save", "attack", "damage"].includes(this.type))
        target.affects.type = "enemy";
      else if (["heal"].includes(this.type))
        target.affects.type = "ally";
      target.affects.choice = true;
      if (chooseMatch.groups.num) {
        const number = Number.isInteger(parseInt(chooseMatch.groups.num))
          ? chooseMatch.groups.num
          : DICTIONARY.numbers.find((num) => chooseMatch.groups.num.toLowerCase() === num.natural)?.num ?? chooseMatch.groups.num;
        target.affects.count = number;
      }
    }

    return target;
  }

  _generateTarget({ targetOverride = null, targetSelf = null, noTemplate = null } = {}) {
    if (targetOverride) {
      this.data.target = targetOverride;
      return;
    }

    let data = {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      prompt: true,
    };

    if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
      const type = DICTIONARY.actions.aoeType.find((type) => type.id === this.ddbDefinition.range.aoeType)?.value ?? "";
      data = foundry.utils.mergeObject(data, {
        template: {
          type,
          size: type === "line" ? `${this.ddbDefinition.range.range}` : `${this.ddbDefinition.range.aoeSize}`,
          width: type === "line" ? `${this.ddbDefinition.range.aoeSize}` : "",
        },
      });
      data.affects.type = "creature";
    } else {
      data = this._getDescriptionTarget();
    }

    if (targetSelf) {
      data.affects.type = "self";
    }

    if (noTemplate) {
      data.template = {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      };
    }

    this.data.target = data;

  }

  _generateDamage({ parts = null, includeBase = false } = {}) {
    if (!this.ddbParent.getDamage && !parts) {
      return;
    }
    const damage = (parts ?? [this.ddbParent.getDamage()])
      .filter((part) => {
        if (!part) return false;
        return part.denomination || part.custom.enabled;
      });

    if (!damage || damage.length === 0) return;

    this.data.damage = {
      includeBase,
      parts: damage,
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
    if (part) {
      this.data.healing = part;
      return;
    }

    if (!this.ddbParent.getDamage) return;
    const damage = this.ddbParent.getDamage();

    if (!damage) return;

    if (damage.types.length === 0) damage.types.push("healing");
    this.data.healing = damage;
  }

  _generateSave({ saveOverride = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    const fixedDC = this.ddbDefinition.fixedSaveDc ? this.ddbDefinition.fixedSaveDc : null;
    let calculation = fixedDC
      ? ""
      : (this.ddbDefinition.abilityModifierStatId)
        ? DICTIONARY.character.abilities.find((stat) => stat.id === this.ddbDefinition.abilityModifierStatId).value
        : "spellcasting";

    let saveAbility = (this.ddbDefinition.saveStatId)
      ? DICTIONARY.character.abilities.find((stat) => stat.id === this.ddbDefinition.saveStatId).value
      : null;

    if (!saveAbility) {
      if (this.ddbParent._descriptionSave) {
        this.data.save = this.ddbParent._descriptionSave;
        return;
      }
    }

    this.data.save = {
      ability: saveAbility ?? Object.keys(CONFIG.DND5E.abilities)[0],
      dc: {
        calculation,
        formula: String(fixedDC ?? ""),
      },
    };
  }

  _generateAttack({ attackOverride = null, unarmed = false, spell = false } = {}) {
    if (attackOverride) {
      this.data.attack = attackOverride;
      return;
    }
    let type = "melee";
    let classification = unarmed
      ? "unarmed"
      : spell
        ? "spell"
        : "weapon"; // unarmed, weapon, spell

    if (this.ddbDefinition.actionType === 1) {
      if (this.ddbDefinition.attackTypeRange === 2) {
        type = "ranged";
      } else {
        type = "melee";
      }
    } else if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 1) {
      type = "melee";
    } else if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 2) {
      type = "ranged";
    }

    const bonus = this.ddbParent.getBonusDamage();

    const attack = {
      ability: this.ddbParent.getActionAttackAbility(),
      bonus: bonus && bonus !== 0 ? String(bonus) : "",
      damage: {
        parts: [],
      },
      critical: {
        threshold: undefined,
      },
      flat: false, // almost never false for PC features
      type: {
        value: type,
        classification,
      },
    };

    if (this.ddbDefinition.isMartialArts) {
      this.ddbParent.data.system.properties = utils.addToProperties(this.ddbParent.data.system.properties, "fin");
    }

    this.data.attack = attack;
    foundry.utils.setProperty(this.data.damage, "includeBase", true);

  }

  _generateDDBMacro({ ddbMacroOverride = null } = {}) {
    if (ddbMacroOverride) {
      this.data.macro = ddbMacroOverride;
    }
  }

  _generateRoll({ roll = null } = {}) {
    this.data.roll = roll;
  }

  build({
    generateActivation = true,
    generateAttack = false,
    generateConsumption = true,
    generateDamage = false,
    generateDDBMacro = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateHealing = false,
    generateRange = true,
    generateSave = false,
    generateTarget = true,
    generateRoll = false,
    roll = null,

    targetOverride = null,
    targetSelf = null,
    noTemplate = null,
    includeBase = false,
    damageParts = null,
    healingPart = null,
    activationOverride = null,
    noeffect = false,
    consumptionOverride = null,
    attackOverride = null,
    saveOverride = null,
    rangeOverride = null,
    ddbMacroOverride = null,
  } = {}) {


    // console.warn(`Build for ${this.ddbDefinition.name} ${this.type} activity`, {
    //   generateActivation,
    //   generateAttack,
    //   generateConsumption,
    //   generateDescription,
    //   generateDuration,
    //   generateEffects,
    //   generateHealing,
    //   generateRange,
    //   generateSave,
    //   generateTarget,
    //   generateRoll,
    //   roll,
    //   targetOverride,
    //   targetSelf,
    //   noTemplate,
    //   includeBase,
    //   damageParts,
    //   attackOverride,
    //   saveOverride,
    //   rangeOverride,
    // });

    // override set to false on object if overriding

    if (generateActivation) this._generateActivation({ activationOverride });
    if (generateAttack) this._generateAttack({ attackOverride, unarmed: null, spell: null });
    if (generateConsumption) this._generateConsumption({ consumptionOverride });
    if (generateDescription) this._generateDescription();
    if (generateDuration) this._generateDuration();
    if (generateEffects) this._generateEffects();
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({ includeBase, parts: damageParts });
    if (generateHealing) this._generateHealing({ part: healingPart });
    if (generateRange) this._generateRange({ rangeOverride });
    if (generateTarget) this._generateTarget({ targetOverride, targetSelf, noTemplate });
    if (generateDDBMacro) this._generateDDBMacro({ ddbMacroOverride });


    if (generateRoll) this._generateRoll({ roll });

    if (noeffect) {
      const ids = foundry.utils.getProperty(this.ddbParent.data, "flags.ddbimporter.noeffect") ?? [];
      ids.push(this.data._id);
      foundry.utils.setProperty(this.ddbParent.data, "flags.ddbimporter.noEffectIds", ids);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.noeffect", true);
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
