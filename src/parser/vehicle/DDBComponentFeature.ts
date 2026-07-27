import { utils, logger } from "../../lib/_module";
import { DICTIONARY } from "../../config/_module";
import { DDBMonsterFeatureEnricher, Effects } from "../enrichers/_module";
import { DDBTable, DDBReferenceLinker, DDBDescriptions, SystemHelpers } from "../lib/_module";
import { DDBVehicleActivity } from "../activities/_module";
import { DDBMonsterDamage } from "../monster/features/DDBMonsterDamage";
import DDBVehicle, { IDDBVehicleFeatureComponent } from "../DDBVehicle";
import DDBActivityFactoryMixin from "../activities/mixins/DDBActivityFactoryMixin";
import type DDBMonsterFeature from "../monster/features/DDBMonsterFeature";
import type { IMonsterWeaponDictionary } from "../../config/dictionary/actor/monsters";

interface IDDBComponentFeature {
  ddbVehicle: DDBVehicle;
  component: IDDBVehicleComponent | IDDBVehicleFeatureComponent;
  updateExisting?: boolean;
  hideDescription?: boolean;
  sort?: number;
  action: IDDBVehicleAction;
}

interface IDDBVehicleActionDataTemplate {
  count?: string;
  contiguous?: boolean;
  type?: string;
  size?: string | number;
  width?: string;
  height?: string;
  units?: string;
}

interface IDDBVehicleActionData {
  type: string | null;
  activationType: string | null;
  targetType: string;
  targetCount: number | null;
  fixedToHit: string | null;
  fixedSaveDc: number | null;
  saveAbility: string | string[] | null;
  damageType: string | null;
  diceString: string | null;
  baseAbility?: string | null;
  range?: unknown;
  consumptionValue: string | number | null;
  consumptionTargets: I5eConsumptionTarget[];
  diceParts: I5eDamagePart[];
  healingParts: IDDBMonsterActionDataHealingPart[];
  saveParts: I5eDamagePart[];
  damageParts: IDDBMonsterActionDataDamagePart[];
  versatileParts: I5eDamagePart[];
  data: {
    damage: {
      base: I5eDamagePart | null;
      onSave: string | null;
    };
    target: {
      template: IDDBVehicleActionDataTemplate;
      affects: {
        count?: string;
        type?: string;
        choice?: boolean;
        special?: string;
      };
      prompt: boolean;
      override: boolean;
    };
    duration: {
      value: string;
      units: string;
    };
    range: {
      value: number | null;
      long: number | string | null;
      units: TDistanceUnit;
      reach: number | null;
    };
    activation: {
      type: TActivationCost | "";
      value: number | null;
      condition: string;
    };
    save: {
      ability: string | string[] | null;
      dc: {
        calculation: string | number;
        formula: string | null;
      };
    };
    uses: {
      spent: number | null;
      max: string | number | null;
      recovery: { period: string; type: string; formula?: string }[];
    };
  };
}

export default class DDBComponentFeature extends DDBActivityFactoryMixin<"vehicle" | "feat" | "weapon"> {

  declare name: string;
  declare isAction: null;
  declare legacy: boolean;
  declare is2014: boolean;
  declare is2024: boolean;
  declare originalName: string;
  declare rawCharacter: null;

  static TYPE_MAPPING: Record<string, "equipment" | "weapon" | "feat"> = {
    hull: "equipment",
    helm: "equipment",
    weapon: "weapon",
    movement: "equipment",
    control: "equipment",
    // "crew" action: feat
    // "action", action: feat
    feature: "feat",
    // "loot": loot
  };
  // fields marked with ! are assigned in prepare(), which the constructor always calls
  descriptionParse!: IFeatureBasicsResult;
  strippedHtml!: string;
  isAttack!: boolean;
  isSpellSave!: boolean;
  isSavingThrow!: boolean;
  isSave!: boolean;
  halfDamage!: boolean;
  pbToAttack!: boolean;
  weaponAttack!: boolean;
  spellAttack!: boolean;
  meleeAttack!: boolean;
  rangedAttack!: boolean;
  healingAction!: boolean;
  toHit!: number;
  descriptionSave!: IFeatureBasicsSave;
  count: number;
  html: string;
  parseHtml: string;
  sort: number | null;
  hideDescription: boolean;
  updateExisting: boolean;
  stripName: boolean;
  nameSplit?: string;
  ddbVehicle: DDBVehicle;
  declare data: I5eVehicleItem;
  declare enricher: DDBMonsterFeatureEnricher;
  component: IDDBVehicleComponent | IDDBVehicleFeatureComponent;
  action: IDDBVehicleAction;
  types!: string[];
  primaryType!: string;
  isRecharge!: RegExpMatchArray | null;
  templateType!: "equipment" | "weapon" | "feat";
  weaponLookup: IMonsterWeaponDictionary | undefined;
  identifier!: string;
  summonSave?: boolean;
  isSummonAttack?: boolean;
  // assigned in #generateActionData() before its reads in the same method
  crew!: boolean;
  // assigned at the start of #generateDamageInfo() before any read
  ddbVehicleDamage!: DDBMonsterDamage;
  // assigned by #generateActionDataStub(), which the constructor always calls
  actionData!: IDDBVehicleActionData;

  constructor({ ddbVehicle, updateExisting, hideDescription, sort, component, action }: IDDBComponentFeature) {

    const enricher = new DDBMonsterFeatureEnricher({ activityGenerator: DDBVehicleActivity });
    super({
      enricher,
      activityGenerator: DDBVehicleActivity,
      useMidiAutomations: ddbVehicle.addMonsterEffects ?? false,
    });

    this.name = `${component.definition.name}`.trim();
    if (action?.name) this.name += `: ${action.name}`;
    this.originalName = `${this.name}`;
    this.ddbVehicle = ddbVehicle;
    this.count = component.count ?? 1;
    this.component = component;
    this.action = action;
    this.is2014 = ddbVehicle.is2014;
    this.is2024 = ddbVehicle.is2024;
    let description = "";
    if (component.description) description = `${component.description}`;
    if (action.description) description += `\n${action.description}`;
    this.parseHtml = action.description
      ? action.description
      : (component.description ?? "");
    this.html = description.trim();

    this.sort = sort ?? null;

    this.hideDescription = hideDescription ?? utils.getSetting<boolean>("munching-policy-hide-description");
    this.updateExisting = updateExisting ?? utils.getSetting<boolean>("munching-policy-update-existing");
    this.stripName = utils.getSetting<boolean>("munching-policy-monster-strip-name");

    this.prepare();

    // copy source details from parent
    if (this.ddbVehicle.data.system?.source)
      this.data.system.source = this.ddbVehicle.data.system.source;

    this.#generateActionDataStub();

  }

  #generateAdjustedName() {
    if (!this.stripName) return;
    const regex = /(.*)\s*\((:?costs? \d actions|Recharges after a (Short or Long|Long) Rest|(?!Spell;|Psionics;).*\d\/day|recharge \d ?- ?\d|Recharge \d)\)/i;
    const nameMatch = this.name.replace(/[–-–−]/g, "-").match(regex);
    if (nameMatch) {
      this.data.name = nameMatch[1].trim();
      this.nameSplit = nameMatch[2];
    } else {
      const regex2 = /(.*)\s*\((.*); (:?costs \d actions|Recharges after a (Short or Long|Long) Rest|(?!Spell;|Psionics;).*\d\/day|recharge \d-\d|Recharge \d)\)/i;
      const nameMatch2 = this.name.replace(/[–-–−]/g, "-").match(regex2);
      if (nameMatch2) {
        this.data.name = `${nameMatch2[1].trim()} (${nameMatch2[2].trim()})`;
        this.nameSplit = nameMatch2[3];
      }
    }
  }

  createBaseFeature() {
    this.data = {
      _id: utils.namedIDStub(this.name, { postfix: this.count }),
      name: this.name,
      type: this.templateType,
      system: SystemHelpers.getTemplate(this.templateType),
      effects: [],
      flags: {
        ddbimporter: {
          dndbeyond: {
          },
        },
      },
    };
    // these templates not good
    (this.data.system as I5eFeatSystemData).requirements = "";
    if (this.sort !== null) this.data.sort = this.sort;
  }

  #matchRecharge() {
    const matches = this.originalName.toLowerCase().match(/(?:\(|; )recharge ([0-9––−-]+)\)/);
    return matches;
  }

  // prepare the html in this.html for a parse, runs some checks and pregen to calculate values
  prepare() {
    this.strippedHtml = utils.stripHtml(`${this.parseHtml}`).trim();

    const descriptionParse: IFeatureBasicsResult = DDBDescriptions.featureBasics({ text: this.strippedHtml });
    this.descriptionParse = descriptionParse;

    this.types = this.component.definition.types.map((t) => t.type);
    this.primaryType = this.types[0];

    // set calc flags
    this.isAttack = descriptionParse.properties.isAttack;
    this.isSpellSave = descriptionParse.properties.isSpellSave;
    this.isSavingThrow = descriptionParse.properties.isSavingThrow;
    this.isSave = descriptionParse.properties.isSave;
    this.halfDamage = descriptionParse.properties.halfDamage;
    this.pbToAttack = descriptionParse.properties.pbToAttack;
    this.weaponAttack = descriptionParse.properties.weaponAttack;
    // warning - unclear how to parse these out for 2024 monsters
    // https://comicbook.com/gaming/news/dungeons-dragons-first-look-2025-monster-manual/
    this.spellAttack = descriptionParse.properties.spellAttack;
    this.meleeAttack = descriptionParse.properties.meleeAttack;
    this.rangedAttack = descriptionParse.properties.rangedAttack;
    this.healingAction = descriptionParse.properties.healingAction;
    this.toHit = descriptionParse.properties.toHit;
    this.descriptionSave = descriptionParse.save;

    if (this.action.actionType === 1) {
      if (this.action.attackTypeRange === 2) {
        this.rangedAttack = true;
      } else {
        this.meleeAttack = true;
      }
    } else if (this.action.attackTypeRange === 1) {
      this.meleeAttack = true;
    } else if (this.action.attackTypeRange === 2) {
      this.rangedAttack = true;
    }

    this.isRecharge = this.#matchRecharge();
    this.templateType = DDBComponentFeature.TYPE_MAPPING[this.primaryType] ?? "feat";
    // this.templateType = this.isAttack && this.isRecharge === null ? "weapon" : "feat";
    this.weaponLookup = DICTIONARY.monsters.weapons.find((weapon) => this.name.startsWith(weapon.name));

    if (!this.data) this.createBaseFeature();
    this.#generateAdjustedName();

    foundry.utils.setProperty(this.data, "flags.midiProperties", descriptionParse.midiProperties);

    this.identifier = utils.referenceNameString(this.data.name.toLowerCase());
    this.data.system.identifier = this.identifier;

    // if not attack set to a monster type action
    if (this.primaryType === "equipment") {
      foundry.utils.setProperty(this.data, "system.type.value", "vehicle");
    } else if (this.primaryType === "weapon") {
      foundry.utils.setProperty(this.data, "system.type.value", "siege");
    }

    if (this.summonSave) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.spellSave", true);
    }
    if (this.isSummonAttack) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.spellAttack", true);
    }


  }

  #generateActionDataStub() {
    this.actionData = {
      "type": null,
      "activationType": null,
      "targetType": "creature",
      "targetCount": 1,
      "fixedToHit": null,
      "fixedSaveDc": null,
      "saveAbility": null,
      "damageType": null,
      "diceString": null,
      consumptionValue: null,
      consumptionTargets: [],
      diceParts: [],
      healingParts: [],
      damageParts: [],
      versatileParts: [],
      saveParts: [],
      data: {
        damage: {
          base: null,
          onSave: null,
          // parts: [],
          // versatile: "",
        },

        target: {
          template: {
            count: "",
            contiguous: false,
            type: "", // line
            size: "", // 60
            width: "",
            height: "",
            units: "", // ft
          },
          affects: {
            count: "",
            type: "",
            choice: false,
            special: "",
          },
          prompt: true,
          override: false,
        },
        duration: {
          "value": "",
          "units": "inst",
        },
        range: {
          value: null,
          long: null,
          units: "",
          reach: null,
        },
        activation: {
          type: "",
          value: null,
          condition: "",
        },
        save: {
          ability: [],
          dc: {
            calculation: "",
            formula: null,
          },
        },
        uses: {
          spent: null,
          max: null,
          recovery: [
            // { period: "", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

  getLimitedUse(): I5eSystemLimitedUses {
    const limitedUse = this.action.limitedUse;
    if (limitedUse && limitedUse.maxUses) {
      const resetType = DICTIONARY.resets.find((type) => type.id === limitedUse.resetType);
      const maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : 0;

      const finalMaxUses = (maxUses) ? parseInt(maxUses as unknown as string) : null;

      return {
        spent: limitedUse.numberUsed ?? 0,
        max: (finalMaxUses != 0) ? `${finalMaxUses}` : null,
        recovery: resetType
          ? [
            // KNOWN_ISSUE_4_0: ensure charges is not returned here
            { period: resetType.value, type: "recoverAll", formula: undefined as string | undefined },
          ]
          : [],
      };
    } else {
      return {
        spent: null,
        max: null,
        recovery: [],
      };
    }
  }

  damageModReplace(text: string) {
    let result;
    const diceParse = utils.parseDiceString(text);
    if (this.actionData.baseAbility) {
      const baseAbilityMod = (this.ddbVehicle as unknown as { abilities: Record<string, { mod: number }> })
        .abilities[this.actionData.baseAbility].mod;
      const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : 0;
      const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? " + @mod " : "";
      const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, useMod);
      result = reParse.diceString;
    } else {
      result = diceParse.diceString;
    }

    return result;
  }

  #generateDamageInfo() {
    const hitIndex = this.strippedHtml.indexOf("Hit:");
    let hit = (hitIndex > 0)
      ? `${this.strippedHtml.slice(hitIndex)}`.trim()
      : `${this.strippedHtml}`.replace(this.name, "").trim();
    hit = hit.replace(/[–-–−]/g, "-");

    this.ddbVehicleDamage = new DDBMonsterDamage(hit, {
      ddbMonsterFeature: this as unknown as DDBMonsterFeature,
      splitSaves: true,
    });

    this.ddbVehicleDamage.generateDamage();
    this.ddbVehicleDamage.generateRegain();

    this.actionData.damageParts = this.ddbVehicleDamage.damageParts;
    this.actionData.versatileParts = this.ddbVehicleDamage.versatileParts;
    this.actionData.saveParts = this.ddbVehicleDamage.saveParts;

    this._generateEscapeCheck(hit);

  }


  #generateActionData() {
    this.#generateDamageInfo();

    if (this.action.fixedToHit !== null) {
      // item.system.attack.bonus = `${action.fixedToHit}`;
      this.actionData.fixedToHit = `${this.action.fixedToHit}`;
    }

    if (Number.isInteger(this.action.numberOfTargets)) {
      // item.system.target.value = action.numberOfTargets;
      this.actionData.targetCount = this.action.numberOfTargets;
    }

    if (this.action.damageTypeId) {
      const damageType = DICTIONARY.actions.damageType.find((type) => type.id === this.action.damageTypeId);
      if (damageType) {
        this.actionData.damageType = damageType.name;
      } else {
        logger.warn(`Unknown damage type id ${this.action.damageTypeId} for vehicle component feature ${this.name}`);
      }
    }


    if (this.action.dice?.diceString) {
      // item.system.damage.parts = [[action.dice.diceString, damageType]];
      this.actionData.diceString = this.action.dice.diceString;
    }

    if (typeof this.action.saveStatId === "number" || this.action.fixedSaveDc) {
      this.actionData.type = "save";
    }
    if (this.action.saveStatId) {
      this.actionData.saveAbility = DICTIONARY.actor.abilities.find((stat) => stat.id === this.action.saveStatId)?.value
        ?? this.descriptionSave.ability;
      this.actionData.data.save.ability = this.actionData.saveAbility;
    }

    if (this.action.fixedSaveDc) {
      this.actionData.fixedSaveDc = Number.parseInt(this.action.fixedSaveDc as unknown as string);
      this.actionData.data.save.dc.calculation = this.action.fixedSaveDc;
    }

    const actionRange = this.action.range;
    if (actionRange && actionRange.aoeType && actionRange.aoeSize) {
      if (!this.actionData.range) this.actionData.data.range.units = "self";
      this.actionData.data.target.template = DICTIONARY.actions.aoeType
        .find((type) => type.id === actionRange.aoeType)?.value as unknown as IDDBVehicleActionDataTemplate;
      this.actionData.data.target.template.size = actionRange.aoeSize;
      this.actionData.data.target.template.units = "ft";
    }
    if (this.action.range && this.action.range.range) {
      this.actionData.data.range.units = "ft";
      this.actionData.data.range.value = this.action.range.range;
      this.actionData.data.range.long = this.action.range.longRange || "";
    }

    this.crew = this.component.groupType === "action-station";

    const activationType = DICTIONARY.actions.activationTypes.find((type) => type.id === this.action.activation?.activationType);
    if (activationType) {
      this.actionData.data.activation.type = this.crew
        ? "crew"
        : activationType
          ? activationType.value
          : "action";
      this.actionData.data.activation.value = this.action.activation?.activationTime || 1;
    }

    if (this.crew) {
      this.actionData.type = "utility";
    }

    if (this.action.dice && this.action.dice.diceString) {
      const damageString = utils.parseDiceString(this.action.dice.diceString).diceString;
      const damage = SystemHelpers.buildDamagePart({
        damageString,
        type: this.actionData.damageType,
      });
      this.actionData.diceParts.push(damage);
    }

  }

  async loadEnricher() {
    await this.enricher.init();
    await this.enricher.load({
      // TODO: add vehicle enricher
      ddbParser: this as unknown as DDBMonsterFeature,
      monster: this.ddbVehicle.data as unknown as I5eMonsterData,
      name: this.name,
    });
  }

  _generateEscapeCheck(hit: any) {
    const escape = hit.match(/escape DC ([0-9]+)/);
    if (escape) {
      this.additionalActivities.push({
        type: "check",
        name: `Escape Check`,
        options: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          checkOverride: {
            "associated": [
              "acr",
              "ath",
            ],
            "ability": "",
            "dc": {
              "calculation": "",
              "formula": escape[1],
            },
          },
        },
      });
    }
  }

  _getSaveActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: string | null } = {}, options = {}) {
    const saveOverride = this.actionData.saveAbility
      ? null
      : this.descriptionSave;

    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: false,
      damageParts: this.actionData.saveParts,
      saveOverride,
      onSave: this.descriptionSave.half ? "half" : "none",
      saveData: {
        dc: this.actionData.fixedSaveDc,
        ability: this.actionData.saveAbility,
      },
    }, options);

    return super._getSaveActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getAttackActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: string | null } = {}, options = {}) {

    const itemOptions = foundry.utils.mergeObject({
      generateAttack: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: this.actionData.damageParts.length > 0 || !this.isSave,
      includeBaseDamage: false,
      damageParts: this.actionData.damageParts.map((dp) => dp.part),
      attackData: {
        flat: this.actionData.fixedToHit !== null,
        bonus: this.actionData.fixedToHit,
      },
    }, options);

    return super._getAttackActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: string | null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
    }, options);

    return super._getUtilityActivity({ name, nameIdPostfix }, itemOptions);
  }

  #addSaveAdditionalActivity(includeBase = false) {
    const parts = this.actionData.saveParts;
    const saveOverride = this.actionData.saveAbility
      ? null
      : this.descriptionSave;

    this.additionalActivities.push({
      name: "Save",
      type: "save",
      options: {
        generateDamage: parts.length > 0,
        damageParts: parts ?? parts,
        includeBaseDamage: includeBase,
        saveOverride,
        onSave: this.descriptionSave.half ? "half" : "none",
        saveData: {
          dc: this.actionData.fixedSaveDc,
          ability: this.actionData.saveAbility,
        },
      } as IDDBVehicleActivityBuild,
    });
  }


  _getActivitiesType() {
    if (this.healingAction) {
      if (!this.isAttack && !this.isSave && this.actionData.damageParts.length === 0) {
        // we generate heal activities as additionals;
        return null;
      }
    }
    if (this.isAttack) {
      // some attacks will have a save and attack
      // console.warn("isAttack", this.isAttack, this.isSave);
      if (this.isSave) {
        // console.warn("add save additional activity");
        this.#addSaveAdditionalActivity();
      }
      return "attack";
    }
    if (this.isSave) return "save";
    if (this.actionData.damageParts.length > 0) return "damage";
    // we generate heal activities as additionals;
    if (!this.healingAction && this.actionData.healingParts.length > 0) return null;
    if (this.actionData.data.activation.type === "special" && !this.actionData.data.uses.max) {
      return null;
    }
    if (this.actionData.data.activation.type && !this.healingAction) return "utility";

    return null;
  }

  #getHiddenDescription() {
    const nameChoice = utils.getSetting<string>("munching-policy-hide-description-choice");
    const hideItemName = utils.getSetting<boolean>("munching-policy-hide-item-name");
    let actorDescriptor = `[[lookup @name]]`;

    if (nameChoice === "TYPE") {
      actorDescriptor = `[[lookup @details.type.config.label]]`;
    } else if (nameChoice === "MONSTER") {
      actorDescriptor = "Monster";
    } else if (nameChoice === "NPC") {
      actorDescriptor = "NPC";
    }

    let description = `<section class="secret">\n${this.html}`;
    if (this.activityType === "attack" && !this.spellAttack) {
      const featureName = hideItemName ? "" : ` with its [[lookup @item.name]]`;
      description += `\n</section>\nThe ${actorDescriptor} attacks${featureName}.`;
    } else if (this.spellAttack || this.isSpellSave) {
      const featureName = hideItemName ? "a spell" : "[[lookup @item.name]]";
      description += `\n</section>\nThe ${actorDescriptor} casts ${featureName}.`;
    } else if (this.activityType === "save") {
      const featureName = hideItemName ? "a feature" : "[[lookup @item.name]]";
      description += `\n</section>\nThe ${actorDescriptor} uses ${featureName} and a save is required.`;
    } else {
      description += `\n</section>\nThe ${actorDescriptor} uses ${hideItemName ? "a feature" : "[[lookup @item.name]]"}.`;
    }
    return description;
  }


  async #generateDescription() {
    this.html = this.html.replace(/<strong> \.<\/strong>/, "").trim().replaceAll("<strong></strong>", "").replaceAll("<em></em>", "");
    let description = this.hideDescription ? this.#getHiddenDescription() : `${this.html}`;
    description = description.replaceAll("<em><strong></strong></em>", "");
    // if (this.originalName === "Multiattack") {
    //   description = this.#processMultiAttack(description);
    // }
    description = DDBReferenceLinker.replaceMonsterALinks(description, this.ddbVehicle.data);

    description = DDBReferenceLinker.parseDamageRolls({ text: description, document: this.data, actor: this.ddbVehicle.data })
      ?? description;
    description = DDBReferenceLinker.parseToHitRoll({ text: description, document: this.data });
    description = DDBReferenceLinker.parseTags(description);
    description = await DDBReferenceLinker.replaceMonsterNameBadLinks(description, this.ddbVehicle.data);

    this.data.system.description.value = await DDBTable.generateTable({
      parentName: this.ddbVehicle.data.name,
      html: description,
      updateExisting: this.updateExisting,
      sourceBook: this.data.system?.source?.book ?? this.ddbVehicle.data.system?.source?.book,
      notifier: this.notifier,
    });
    this.data.system.description.value = `<div class="ddb">
${this.data.system.description.value}
</div>`;


  }

  _generateAutoEffects({ html, addToMonster = true }: { html?: string; addToMonster?: boolean } = {}) {
    const flags: { ddbimporter: { activityMatch?: string } } = {
      ddbimporter: {},
    };

    if (this.isAttack && this.isSave) {
      flags.ddbimporter.activityMatch = "Save";
    }

    const overtimeGenerator = new Effects.MidiOverTimeEffect({
      document: this.data,
      actor: this.ddbVehicle.data as unknown as I5eActorData,
      otherDescription: html,
      flags,
      addToMonster,
    });

    const deps = Effects.AutoEffects.effectModules();
    if (!deps.hasCore || !this.ddbVehicle.addMonsterEffects) {
      logger.debug(`Adding Condition Effects to ${this.name}`);
      overtimeGenerator.generateConditionOnlyEffect();
    } else if (this.ddbVehicle.addMonsterEffects) {
      logger.debug(`Adding Over Time Effects to ${this.name}`);
      overtimeGenerator.generateOverTimeEffect();
    }
    return overtimeGenerator;
  }

  async _generateEffects() {
    this._generateAutoEffects({ html: this.strippedHtml });

    if (this.enricher.clearAutoEffects) this.data.effects = [];
    const effects = await this.enricher.createEffects();
    (this.data.effects ??= []).push(...effects);
    this.enricher.createDefaultEffects();

    this._activityEffectLinking();
    Effects.AutoEffects.forceDocumentEffect(this.data);
  }

  #generateCost() {
    for (const cost of this.component.definition.costs ?? []) {
      if (!cost.value) continue;
      (this.data.system as I5eVehicleEquipmentSystemData).price = {
        "value": cost.value,
        "denomination": "gp",
      };
      break; // only first cost
    }
  }


  async parse() {

    await this.enricher.init();

    this.#generateActionData();
    this.data.system.uses = this.getLimitedUse();

    if (this.data.type === "equipment") {
      this.data.system.type.value = "vehicle";
    }

    // this.data.system.quantity = this.component.count;

    const system = this.data.system as I5eVehicleEquipmentSystemData;

    system.hp = {
      value: null,
      max: null,
      dt: null,
      conditions: "",
    };

    if (this.component.groupType === "action-station") {
      switch (this.component.definition.coverType) {
        case "full":
          system.cover = 1;
          break;
        case "half":
          system.cover = 0.5;
          break;
        case "three-quarters":
          system.cover = 0.75;
          break;
        default:
          system.cover = undefined;
          break;
      }

    } else if (this.component.definition.groupType === "component") {

      if (this.component.definition.speeds && this.component.definition.speeds.length > 0) {
        const speed = {
          value: this.component.definition.speeds[0].modes[0].value,
          conditions: this.component.definition.speeds[0].modes[0].description
            ? this.component.definition.speeds[0].modes[0].description
            : "",
        };
        system.speed = speed;
        if (this.component.definition.speeds[0].modes.length > 1) {
          const speedConditions = [];
          for (let i = 1; i < this.component.definition.speeds[0].modes.length; i++) {
            const speedValue = this.component.definition.speeds[0].modes[i].value;
            const speedCondition = this.component.definition.speeds[0].modes[i].description
              ? this.component.definition.speeds[0].modes[i].description
              : "";
            const speedRestriction = this.component.definition.speeds[0].modes[i].restrictionsText
              ? this.component.definition.speeds[0].modes[i].restrictionsText
              : "";
            speedConditions.push(`${speedValue} ${speedCondition}${speedRestriction}`);
          }

          const speedAdjustment = this.component.definition.types.find((t) => t.type === "movement");
          if (speedAdjustment && speedAdjustment.adjustments && speedAdjustment.adjustments.length > 0) {
            speedAdjustment.adjustments.filter((a) => a.type === "speed").forEach((a) => {
              a.values.forEach((v) => {
                speedConditions.push(`-${v.perDamageValue}ft speed per ${v.perDamageTaken} damage taken`);
              });
            });
          }
          if (speedConditions.length > 0) {
            speed.conditions += speedConditions.join("; ");
          }
        }
      }

      if (Number.isInteger(this.component.definition.armorClass)) {
        system.armor.value = parseInt(this.component.definition.armorClass as unknown as string);
      }

      if (Number.isInteger(this.component.definition.hitPoints)) {
        const hp: I5eVehicleComponentHP = {
          value: parseInt(this.component.definition.hitPoints as unknown as string),
          max: parseInt(this.component.definition.hitPoints as unknown as string),
          dt: null,
          conditions: "",
        };
        system.hp = hp;
        if (this.component.definition.damageThreshold) {
          hp.dt = this.component.definition.damageThreshold;
        }
      }
    }

    if (this.templateType === "weapon") {
      (this.data.system as I5eVehicleWeaponSystemData).range = this.actionData.data.range as I5eWeaponRange;
    }

    this.#generateCost();

    await this._generateActivity();

    if (this.enricher.addAutoAdditionalActivities)
      await this._generateAdditionalActivities();
    await this.enricher.addAdditionalActivities(this);

    await this._generateEffects();

    await this.#generateDescription();

    await this.enricher.addDocumentAdvancements();
    await this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(this.data.name.toLowerCase());

    logger.debug(`Parsed Feature ${this.name} for ${(this.ddbVehicle as unknown as { name?: string }).name}`, { feature: this });

  }

}
