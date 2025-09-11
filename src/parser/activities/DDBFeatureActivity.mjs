import { DICTIONARY } from "../../config/_module.mjs";
import { utils, logger } from "../../lib/_module.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";
import { DDBDescriptions } from "../lib/_module.mjs";

export default class DDBFeatureActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBFeatureActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }

  constructor({ type, name = null, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null } = {}) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      id,
    });

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
    const kiPointRegex = /(?:spend|expend) (\d) (?:ki|focus) point/ig;
    const sorceryPoint = /spend (\d) sorcery points/ig;
    const match = kiPointRegex.exec(description)
      ?? sorceryPoint.exec(description);

    const consumptionType = this.ddbParent.usesOnActivity
      ? "activityUses"
      : "itemUses";

    if (match) {
      targets.push({
        type: consumptionType,
        target: "", // adjusted later
        value: match[1],
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.ddbParent.resourceCharges !== null) {
      targets.push({
        type: consumptionType,
        target: "", // adjusted later
        value: this.ddbParent.resourceCharges ?? 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.ddbParent.data.system.uses.max) {
      targets.push({
        type: consumptionType,
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

  _generateDuration({ durationOverride = null } = {}) {
    if (durationOverride) {
      this.data.duration = durationOverride;
      return;
    }
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const duration = DDBDescriptions.getDuration(description, false);

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
      if (this.ddbDefinition.range.range) {
        this.data.range = {
          value: this.ddbDefinition.range.range,
          units: "ft",
          special: "",
        };
      } else {
        this.data.range = {
          value: null,
          units: "self",
          special: "",
        };
      }
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
        const aoeSizeSecondaryRegex = /(?:in a) (?<within>\d+)(?: |-)(?:feet|foot|ft|ft\.)(?: |-)(cone|radius|emanation|sphere|line|cube|of it|of an|of the)(\w+[. ])?/ig;
        const aoeSizeSecondaryMatch = aoeSizeSecondaryRegex.exec(description);

        // console.warn(`aoeSizeSecondaryMatch for ${this.name}`, {
        //   targetsCreature,
        //   creatureTargetCount,
        //   aoeSizeMatch,
        //   aoeSizeSecondaryMatch,
        // });
        if (aoeSizeSecondaryMatch) {
          // some features such as Land's Aid will match both.
          const type = aoeSizeSecondaryMatch[3]?.trim() ?? aoeSizeSecondaryMatch[2]?.trim() ?? "radius";
          target.template.type = ["cone", "radius", "sphere", "line", "cube"].includes(type) ? type : "radius";
          target.template.size = aoeSizeSecondaryMatch.groups.within ?? "";
        }
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
          : DICTIONARY.numbers.find((num) => chooseMatch.groups.num.toLowerCase() === num.natural)?.num ?? null;
        target.affects.count = number ?? "";
        if (!number) {
          target.affects.special = chooseMatch.groups.num;
        }
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
      critical: {
        allow: this.type === "attack" || this.foundryFeature.type === "weapon",
      },
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
        ? DICTIONARY.actor.abilities.find((stat) => stat.id === this.ddbDefinition.abilityModifierStatId).value
        : "spellcasting";

    let saveAbility = (this.ddbDefinition.saveStatId)
      ? DICTIONARY.actor.abilities.find((stat) => stat.id === this.ddbDefinition.saveStatId).value
      : null;

    if (!saveAbility) {
      if (this.ddbParent._descriptionSave) {
        this.data.save = this.ddbParent._descriptionSave;
        return;
      }
    }

    this.data.save = {
      ability: saveAbility ? [saveAbility] : [Object.keys(CONFIG.DND5E.abilities)[0]],
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

    const bonus = (this.ddbParent.getBonusDamage) ? this.ddbParent.getBonusDamage() : "";

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

  build({
    activationOverride = null,
    additionalTargets = null,
    attackData = {},
    attackOverride = null,
    spellOverride = null,
    chatFlavor = null,
    checkOverride = null,
    consumeActivity = null,
    consumeItem = null,
    consumptionOverride = null,
    criticalDamage = null,
    damageParts = null,
    damageScalingOverride = null,
    data = null,
    ddbMacroOverride = null,
    durationOverride = null,
    generateActivation = true,
    generateAttack = false,
    generateSpell = false,
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
    generateSummon = false,
    generateTarget = true,
    generateUses = false,
    healingPart = null,
    img = null,
    includeBase = false,
    includeBaseDamage = false,
    noeffect = false,
    noTemplate = null,
    onSave = null,
    rangeOverride = null,
    roll = null,
    saveOverride = null,
    targetOverride = null,
    targetSelf = null,
    usesOverride = null,
  } = {}) {

    if (generateActivation) this._generateActivation({ activationOverride });
    if (generateAttack) this._generateAttack({ attackOverride, unarmed: null, spell: null });
    if (generateConsumption) this._generateConsumption({ consumptionOverride });
    if (generateDuration) this._generateDuration({ durationOverride });
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({ includeBase, parts: damageParts });
    if (generateHealing) this._generateHealing({ part: healingPart });
    if (generateRange) this._generateRange({ rangeOverride });
    if (generateTarget) this._generateTarget({ targetOverride, targetSelf, noTemplate });

    super.build({
      generateActivation: false,
      generateAttack: false,
      generateConsumption: false,
      generateSpell,
      generateCheck,
      generateDamage: false,
      generateDescription,
      generateDuration: false,
      generateEffects,
      generateHealing: false,
      generateRange: false,
      generateSave: false,
      generateTarget: false,
      generateDDBMacro,
      generateEnchant,
      generateRoll,
      generateSummon,
      generateUses,
      chatFlavor,
      onSave,
      noeffect,
      roll,
      targetOverride,
      checkOverride,
      spellOverride,
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
      attackData,
      includeBaseDamage,
      criticalDamage,
      damageScalingOverride,
      healingPart: healingPart?.part ?? healingPart ?? null,
      healingChatFlavor: healingPart?.chatFlavor ?? null,
      damageParts,
    });

  }

}
