import { DICTIONARY } from "../../config/_module";
import { utils, logger } from "../../lib/_module";
import DDBBasicActivity from "./DDBBasicActivity";
import type DDBFeature from "../features/DDBFeature";
import { DDBDescriptions } from "../lib/_module";

type TDefinitions = IDDBClassFeatureDefinition | IDDBRacialTraitDefinition | IDDBFeatDefinition;

interface IConsumptionPattern {
  regex: RegExp;
  // pool item identifier: dnd5e remaps bare identifiers via actor.identifiedItems,
  // and features covered by DICTIONARY.CONSUMPTION_LINKS are retargeted post-import
  // by autoLinkConsumption regardless
  target: string | ((match: RegExpExecArray) => string);
  type?: "hitDice";
}

// checked in order, first match wins; group 1 must capture the spend amount.
// no g flag: these are module-level and a sticky lastIndex would leak between calls
export const CONSUMPTION_PATTERNS: IConsumptionPattern[] = [
  {
    regex: /(?:spend|expend) (\d+|\w+) (ki|focus) points?\b/i,
    target: (match) => (match[2].toLowerCase() === "ki" ? "ki" : "monks-focus"),
  },
  { regex: /(?:spend|expend) (\d+|\w+) sorcery points?\b/i, target: "sorcery-points" },
  { regex: /(?:spend|expend) (\d+|\w+) risk d(?:ie|ice)\b/i, target: "risk" },
  { regex: /(?:spend|expend) (\d+|\w+) blood points?\b/i, target: "blood-potency" },
  { regex: /spend (\d+|\w+) wick points?\b/i, target: "wick-points" },
  { regex: /(?:spend|expend) (\d+|\w+) grit points?\b/i, target: "grit-points" },
  { regex: /spend (\d+|\w+)(?: or more)? maneuver points?\b/i, target: "maneuver-points" },
  { regex: /(?:spend|expend) (\d+|\w+) moxie points?\b/i, target: "moxie" },
  { regex: /expend (\d+|\w+)(?: or more)? seals?\b/i, target: "baleful-interdict" },
  { regex: /expend (a|one) (?:use of (?:your )?)?bardic inspiration(?: die)?\b/i, target: "bardic-inspiration" },
  { regex: /expend (a|one) use of (?:your )?channel divinity\b/i, target: "channel-divinity" },
  { regex: /expend (a|one) superiority d(?:ie|ice)\b/i, target: "superiority-dice" },
  {
    regex: /expend (a|one) use of (?:your )?(wild shape|second wind|favored enemy)\b/i,
    target: (match) => utils.referenceNameString(match[2]),
  },
  {
    regex: /(?:spend|expend) (a|one|\d+|\w+)(?: or more)?(?: of (?:your|its))? hit (?:point )?d(?:ie|ice)\b/i,
    target: "largest",
    type: "hitDice",
  },
];

export function parseConsumptionValue(raw: string | undefined): number | null {
  if (!raw) return null;
  const digits = parseInt(raw);
  if (Number.isInteger(digits)) return digits;
  const lower = raw.toLowerCase();
  if (lower === "an") return 1;
  return DICTIONARY.numbers.find((num) => num.natural === lower)?.num ?? null;
}

interface IDDBFeatureActivity {
  name?: string;
  type: IDDBActivityType;
  ddbParent?: DDBFeature;
  nameIdPrefix?: string | null;
  nameIdPostfix?: string | null;
  id?: string | null;
}

export default class DDBFeatureActivity extends DDBBasicActivity {
  declare ddbParent: DDBFeature;
  declare ddbDefinition: TDefinitions;

  _init() {
    logger.debug(`Generating DDBFeatureActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }

  constructor({ type, name = null, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null }: IDDBFeatureActivity) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      id,
    });

    // @ts-expect-error - backgrounds don't build activities so we can ignore this for now
    this.ddbDefinition = this.ddbParent.ddbDefinition;

  }

  _generateParsedActivation() {
    const actionType = this.ddbParent.getParsedActionType();
    if (!actionType) return;
    logger.debug(`Parsed manual activation type: ${actionType} for ${this.name}`);
    this.data.activation = {
      type: actionType,
      value: 1,
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
      type: actionType.value as TActivationCost,
      value: this.ddbDefinition.activation.activationTime || 1,
      condition: "",
    };
  }

  _generateConsumption({ consumptionOverride = null } = {}) {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    const targets = [];
    const scaling = false;

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

    // actions often ship an empty-string description with the real text in the
    // snippet, so search both rather than nullish-falling-through
    const description = [this.ddbDefinition.description, this.ddbDefinition.snippet]
      .filter((text): text is string => !!text)
      .join("\n");
    let target = "";
    let match: RegExpExecArray | null = null;
    let matchedType: "itemUses" | "hitDice" = "itemUses";
    for (const pattern of CONSUMPTION_PATTERNS) {
      match = pattern.regex.exec(description);
      if (match) {
        target = typeof pattern.target === "string" ? pattern.target : pattern.target(match);
        if (pattern.type) matchedType = pattern.type;
        break;
      }
    }

    const consumptionType = this.ddbParent.usesOnActivity
      ? "activityUses"
      : "itemUses";

    const maxUses = foundry.utils.getProperty(this.ddbParent, "data.system.uses.max") as string;
    if (match) {
      targets.push({
        // hit dice spends always consume the actor's hit dice pool, never own uses
        type: matchedType === "hitDice" ? "hitDice" : consumptionType,
        target, // also adjusted later
        value: parseConsumptionValue(match[1]) ?? 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.ddbParent.resourceCharges !== null) {
      targets.push({
        type: consumptionType,
        target, // also adjusted later
        value: this.ddbParent.resourceCharges ?? 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (maxUses && maxUses !== "" && maxUses !== "0") {
      targets.push({
        type: consumptionType,
        target, // also adjusted later
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (targets.length === 0 && this.data._id) {
      // no uses to spend yet; an enricher override can still supply them after
      // the activities are built, so let the parent revisit this in _final()
      this.ddbParent._activitiesAwaitingUses.add(this.data._id);
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
      units: duration.units as TDurationUnit,
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


  _getDescriptionTarget() {
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const target = {
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
        target.affects.count = number ? String(number) : "";
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
      const size = type === "line" ? this.ddbDefinition.range.range : this.ddbDefinition.range.aoeSize;
      data = foundry.utils.mergeObject(data, {
        template: {
          type,
          size: size ? `${size}` : "",
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

    if (data.affects.type === "" && ["save", "attack", "damage"].includes(this.type)) {
      data.affects.type = "creature";
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

    this.data.target = data as I5eActivityTarget;

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
    const calculation = fixedDC
      ? ""
      : (this.ddbDefinition.abilityModifierStatId)
        ? DICTIONARY.actor.abilities.find((stat) => stat.id === this.ddbDefinition.abilityModifierStatId).value
        : "spellcasting";

    const saveAbility = (this.ddbDefinition.saveStatId)
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

    if (!unarmed && !spell) {
      if (this.ddbDefinition.attackSubtype === 3) {
        classification = "unarmed";
      } else if (this.ddbDefinition.attackSubtype === 2) {
        classification = "natural";
      }
    }

    if (this.ddbDefinition.actionType === 2) {
      classification = "spell";
    }

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
    } else if (this.ddbDefinition.range?.range) {
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

  _generateRoll({ name = null, rollOverride = null, damageParts = null, includeBase = false } = {}) {
    if (rollOverride) {
      this.data.roll = rollOverride;
      return;
    }
    this._generateDamage({ parts: damageParts, includeBase });

    if (this.data.damage && this.data.damage.parts.length > 0) {
      // {
      //   number: null,
      //   denomination: null,
      //   bonus: "",
      //   types: damageType ? [damageType] : [],
      //   custom: {
      //     enabled: false,
      //     formula: "",
      //   },
      //   scaling: {
      //     mode: "whole",
      //     number: null,
      //     formula: "",
      //   },
      // };
      const formulaParts = [];
      for (const part of this.data.damage.parts) {
        if (part.custom.enabled && part.custom.formula) {
          formulaParts.push(`(${part.custom.formula})`);
        } else if (part.number && part.denomination) {
          let formulaPart = `${part.number}d${part.denomination}`;
          if (part.bonus && part.bonus !== "") {
            formulaPart += ` + ${part.bonus}`;
          }
          formulaParts.push(`(${formulaPart})`);
        }
      }
      if (formulaParts.length === 0) return;
      this.data.roll = {
        name: name ?? "Roll",
        formula: formulaParts.join(" + "),
      };
    }
    delete this.data.damage;

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
    saveOverride = null,
    targetOverride = null,
    targetSelf = null,
    usesOverride = null,
    rollOverride = null,
    rollOverrideName = null,
  }: IDDBFeatureActivityBuild = {}) {

    if (generateActivation) this._generateActivation({ activationOverride });
    if (generateAttack) this._generateAttack({ attackOverride, unarmed: null, spell: null });
    if (generateConsumption) this._generateConsumption({ consumptionOverride });
    if (generateDuration) this._generateDuration({ durationOverride });
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({ includeBase, parts: damageParts });
    if (generateHealing) this._generateHealing({ part: healingPart });
    if (generateRange) this._generateRange({ rangeOverride });
    if (generateTarget) this._generateTarget({ targetOverride, targetSelf, noTemplate });
    if (generateRoll) this._generateRoll({ rollOverride, damageParts, includeBase, name: rollOverrideName });

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
      generateRoll: false,
      generateSummon,
      generateUses,
      chatFlavor,
      onSave,
      noeffect,
      rollOverride,
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
