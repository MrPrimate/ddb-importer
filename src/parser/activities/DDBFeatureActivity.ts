import { DICTIONARY } from "../../config/_module";
import { utils, logger } from "../../lib/_module";
import DDBBasicActivity from "./DDBBasicActivity";
import type DDBFeature from "../features/DDBFeature";
import { DDBDescriptions } from "../lib/_module";

// these definitions arrive with action payload data merged on, so intersect
// with the action-backed shape for the fields the activity builders read
type TDefinitions = (IDDBClassFeatureDefinition | IDDBRacialTraitDefinition | IDDBFeatDefinition) & IDDBActionBackedDefinition;

interface IDDBFeatureActivity {
  name?: string | null;
  type: IDDBActivityType;
  ddbParent: DDBFeature;
  nameIdPrefix?: string | null;
  nameIdPostfix?: string | null;
  id?: string | null;
}

export default class DDBFeatureActivity extends DDBBasicActivity {
  declare ddbParent: DDBFeature;
  declare ddbDefinition: TDefinitions;

  /** builder-shape view of the activity data while parts are being assembled */
  get buildData(): IActivityData {
    return this.data as IActivityData;
  }

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

    // backgrounds don't build activities, so the background definition kind never reaches here
    this.ddbDefinition = this.ddbParent.ddbDefinition as typeof this.ddbDefinition;

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
  _generateActivation({ activationOverride = null }: { activationOverride?: I5eActivityActivation | null } = {}) {
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

  _generateConsumption({ consumptionOverride = null }: { consumptionOverride?: I5eActivityConsumption | null } = {}) {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    const targets: I5eConsumptionTarget[] = [];
    const scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    if (this.ddbParent.rawCharacter) {
      // character features only consume labelled PC resources; monster raw characters never reach this parser
      const resources = (this.ddbParent.rawCharacter as I5ePCData).system.resources ?? {};
      Object.entries(resources).forEach(([resource, detail]) => {
        if (detail && this.ddbDefinition.name === detail.label) {
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

    const maxUses = foundry.utils.getProperty(this.ddbParent, "data.system.uses.max") as string;
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
    } else if (maxUses && maxUses !== "" && maxUses !== "0") {
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

  _generateDuration({ durationOverride = null }: { durationOverride?: I5eActivityDuration | null } = {}) {
    if (durationOverride) {
      this.data.duration = durationOverride;
      return;
    }
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const duration = DDBDescriptions.getDuration(description, false);

    if (duration.type === null) {
      // the parser intentionally emits null duration values, which the dnd5e schema accepts,
      // but I5eSystemDurationData.value only allows string | undefined
      this.data.duration = {
        value: "",
        units: "inst",
        special: "",
      };
      return;
    }

    this.data.duration = {
      value: duration.value ?? "",
      units: duration.units as TDurationUnit,
      special: duration.special,
    };
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange({ rangeOverride = null }: { rangeOverride?: I5eActivityRange | null } = {}) {
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
        const range = this.data.range ?? {};
        range.value = aoeSizeMatch.groups?.within ?? "";
        range.units = "ft";
        this.data.range = range;
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
          target.template.size = aoeSizeSecondaryMatch.groups?.within ?? "";
        }
      } else {
        const type = aoeSizeMatch[3]?.trim() ?? aoeSizeMatch[2]?.trim() ?? "radius";
        target.template.type = ["cone", "radius", "sphere", "line", "cube"].includes(type) ? type : "radius";
        target.template.size = aoeSizeMatch.groups?.within ?? "";
      }
    }

    const chooseRegex = /creature of your choice|choose (?<num>\w+) creatures within/ig;
    const chooseMatch = chooseRegex.exec(description);
    if (chooseMatch) {
      if ((this.buildData.damage?.parts?.length ?? 0) > 0 || ["save", "attack", "damage"].includes(this.type))
        target.affects.type = "enemy";
      else if (["heal"].includes(this.type))
        target.affects.type = "ally";
      target.affects.choice = true;
      const chooseNum = chooseMatch.groups?.num;
      if (chooseNum) {
        const number = Number.isInteger(parseInt(chooseNum))
          ? chooseNum
          : DICTIONARY.numbers.find((num) => chooseNum.toLowerCase() === num.natural)?.num ?? null;
        target.affects.count = number ? String(number) : "";
        if (!number) {
          target.affects.special = chooseNum;
        }
      }
    }

    return target;
  }

  _generateTarget({ targetOverride = null, targetSelf = null, noTemplate = null }: {
    targetOverride?: I5eActivityTarget | null;
    targetSelf?: IDDBFeatureActivityBuild["targetSelf"];
    noTemplate?: IDDBFeatureActivityBuild["noTemplate"];
  } = {}) {
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

    const ddbRange = this.ddbDefinition.range;
    if (ddbRange && ddbRange.aoeType && ddbRange.aoeSize) {
      const type = DICTIONARY.actions.aoeType.find((type) => type.id === ddbRange.aoeType)?.value ?? "";
      const size = type === "line" ? ddbRange.range : ddbRange.aoeSize;
      data = foundry.utils.mergeObject(data, {
        template: {
          type,
          size: size ? `${size}` : "",
          width: type === "line" ? `${ddbRange.aoeSize}` : "",
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

    this.data.target = data as unknown as I5eActivityTarget;

  }

  _generateDamage({ parts = null, includeBase = false }: {
    parts?: I5eDamagePart[] | null;
    includeBase?: boolean;
  } = {}) {
    if (!this.ddbParent.getDamage && !parts) {
      return;
    }
    const damage = (parts ?? [this.ddbParent.getDamage()])
      .filter((part) => {
        if (!part) return false;
        return part.denomination || part.custom?.enabled;
      });

    if (!damage || damage.length === 0) return;

    this.buildData.damage = {
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

  _generateHealing({ part = null }: { part?: any; healingPart?: any; healingChatFlavor?: string | null } = {}) {
    if (part) {
      this.buildData.healing = part;
      return;
    }

    if (!this.ddbParent.getDamage) return;
    const damage = this.ddbParent.getDamage();

    if (!damage) return;

    damage.types ??= [];
    if (damage.types.length === 0) damage.types.push("healing");
    this.buildData.healing = damage;
  }

  _generateSave({ saveOverride = null }: { saveOverride?: I5eActivitySave | null } = {}) {
    if (saveOverride) {
      this.buildData.save = saveOverride;
      return;
    }
    const fixedDC = this.ddbDefinition.fixedSaveDc ? this.ddbDefinition.fixedSaveDc : null;
    const calculation = fixedDC
      ? ""
      : (this.ddbDefinition.abilityModifierStatId)
        ? DICTIONARY.actor.abilities.find((stat) => stat.id === this.ddbDefinition.abilityModifierStatId)?.value ?? "spellcasting"
        : "spellcasting";

    const saveAbility = (this.ddbDefinition.saveStatId)
      ? DICTIONARY.actor.abilities.find((stat) => stat.id === this.ddbDefinition.saveStatId)?.value ?? null
      : null;

    if (!saveAbility) {
      if (this.ddbParent._descriptionSave) {
        this.buildData.save = this.ddbParent._descriptionSave;
        return;
      }
    }

    this.buildData.save = {
      ability: saveAbility ? [saveAbility] : [Object.keys(CONFIG.DND5E.abilities)[0]],
      dc: {
        calculation,
        formula: String(fixedDC ?? ""),
      },
    };
  }

  _generateAttack({ attackOverride = null, unarmed = false, spell = false }: {
    attackOverride?: I5eActivityAttack | null;
    unarmed?: boolean;
    spell?: boolean;
  } = {}) {
    if (attackOverride) {
      this.buildData.attack = attackOverride;
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

    const bonusParent = this.ddbParent as { getBonusDamage?: () => string | number };
    const bonus = bonusParent.getBonusDamage ? bonusParent.getBonusDamage() : "";

    const attack: I5eActivityAttack = {
      ability: this.ddbParent.getActionAttackAbility(),
      bonus: bonus && bonus !== 0 ? String(bonus) : "",
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
      const systemData = this.ddbParent.data.system as { properties?: string[] };
      systemData.properties = utils.addToProperties(systemData.properties ?? [], "fin");
    }

    this.buildData.attack = attack;
    if (this.buildData.damage) foundry.utils.setProperty(this.buildData.damage, "includeBase", true);

  }

  _generateRoll({ name = null, rollOverride = null, damageParts = null, includeBase = false }: {
    name?: string | null;
    rollOverride?: I5eActivityRoll | null;
    damageParts?: I5eDamagePart[] | null;
    includeBase?: boolean;
  } = {}) {
    if (rollOverride) {
      this.buildData.roll = rollOverride;
      return;
    }
    this._generateDamage({ parts: damageParts, includeBase });

    const generatedDamageParts = this.buildData.damage?.parts ?? [];
    if (generatedDamageParts.length > 0) {
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
      for (const part of generatedDamageParts) {
        if (part.custom?.enabled && part.custom.formula) {
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
      this.buildData.roll = {
        name: name ?? "Roll",
        formula: formulaParts.join(" + "),
      };
    }
    delete this.buildData.damage;

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
    if (generateAttack) this._generateAttack({ attackOverride });
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
      healingPart: (healingPart as { part?: I5eDamagePart } | null)?.part ?? healingPart ?? null,
      healingChatFlavor: (healingPart as { chatFlavor?: string | null } | null)?.chatFlavor ?? null,
      damageParts,
    });

  }

}
