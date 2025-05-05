import { utils, logger } from "../../lib/_module.mjs";
import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { DDBMonsterFeatureEnricher, mixins } from "../enrichers/_module.mjs";
import { DDBTable, DDBReferenceLinker, DDBDescriptions, SystemHelpers } from "../lib/_module.mjs";

import DDBVehicleActivity from "../activities/DDBVehicleActivity.mjs";

export default class DDBComponentFeature extends mixins.DDBActivityFactoryMixin {

  static TYPE_MAPPING = {
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
      _id: foundry.utils.randomID(),
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
    this.data.system.requirements = "";
    this.data.sort = this.sort;
  }

  #matchRecharge() {
    const matches = this.originalName.toLowerCase().match(/(?:\(|; )recharge ([0-9––−-]+)\)/);
    return matches;
  }

  // prepare the html in this.html for a parse, runs some checks and pregen to calculate values
  prepare() {
    this.strippedHtml = utils.stripHtml(`${this.html}`).trim();

    const descriptionParse = DDBDescriptions.featureBasics({ text: this.strippedHtml });
    this.descriptionParse = descriptionParse;

    this.types = this.component.definition.types.map((t) => t.type);
    this.primaryType = this.types[0];

    // set calc flags
    this.isAttack = descriptionParse.properties.isAttack;
    this.spellSave = descriptionParse.properties.spellSave;
    this.savingThrow = descriptionParse.properties.savingThrow;
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
      this.isAttack = true;
      if (this.action.attackTypeRange === 2) {
        this.rangedAttack = true;
      } else {
        this.meleeAttack = true;
      }
    } else if (this.action.attackTypeRange === 1) {
      this.meleeAttack = true;
      this.isAttack = true;
    } else if (this.action.attackTypeRange === 2) {
      this.isAttack = true;
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
      damageParts: [],
      healingParts: [],
      // versatileParts: [],
      // saveParts: [],
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

  getLimitedUse() {
    if (
      this.action.limitedUse
      && (this.action.limitedUse.maxUses)
    ) {
      const resetType = DICTIONARY.resets.find((type) => type.id === this.action.limitedUse.resetType);
      let maxUses = (this.action.limitedUse.maxUses && this.action.limitedUse.maxUses !== -1) ? this.action.limitedUse.maxUses : 0;

      const finalMaxUses = (maxUses) ? parseInt(maxUses) : null;

      return {
        spent: this.action.limitedUse.numberUsed ?? 0,
        max: (finalMaxUses != 0) ? `${finalMaxUses}` : null,
        per: resetType ? resetType.value : "",
        recovery: resetType
          ? [
            // KNOWN_ISSUE_4_0: ensure charges is not returned here
            { period: resetType.value, type: 'recoverAll', formula: undefined },
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

  // eslint-disable-next-line complexity
  #generateActionData() {
    if (this.action.fixedToHit !== null) {
      // item.system.attack.bonus = `${action.fixedToHit}`;
      this.actionData.fixedToHit = `${this.action.fixedToHit}`;
    }

    if (Number.isInteger(this.action.numberOfTargets)) {
      // item.system.target.value = action.numberOfTargets;
      this.actionData.targetCount = this.action.numberOfTargets;
    }

    if (this.action.damageTypeId) {
      const damageType = DICTIONARY.actions.damageType.find((type) => type.id === this.action.damageTypeId).name;
      this.actionData.damageType = damageType;
    }


    if (this.action.dice?.diceString) {
      // item.system.damage.parts = [[action.dice.diceString, damageType]];
      this.actionData.diceString = this.action.dice.diceString;
    }

    if (typeof this.action.saveStatId === "number" || this.action.fixedSaveDc) {
      this.actionData.type = "save";
    }
    if (this.action.saveStatId) {
      this.actionData.saveAbility = (this.action.saveStatId)
        ? DICTIONARY.actor.abilities.find((stat) => stat.id === this.action.saveStatId).value
        : this.descriptionSave.ability;
      this.actionData.data.save.ability = this.actionData.saveAbility;
    }

    if (this.action.fixedSaveDc) {
      this.actionData.fixedSaveDc = Number.parseInt(this.action.fixedSaveDc);
      this.actionData.data.save.dc.calculation = this.action.fixedSaveDc;
    }

    if (this.action.range && this.action.range.aoeType && this.action.range.aoeSize) {
      if (!this.actionData.range) this.actionData.data.range.units = "self";
      this.actionData.data.target.template = DICTIONARY.actions.aoeType.find((type) => type.id === this.action.range.aoeType)?.value;
      this.actionData.data.target.template.size = this.action.range.aoeSize;
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
      this.actionData.damageParts.push(damage);
    }

    console.warn("DDBComponentFeature", {
      action: this.action,
      actionData: this.actionData,
      component: this.component,
      this: this,
    });

  }

  async loadEnricher() {
    await this.enricher.init();
    await this.enricher.load({
      ddbParser: this,
      monster: this.ddbVehicle.vehicle,
      name: this.name,
    });
  }

  constructor(name, { ddbVehicle, updateExisting, hideDescription, sort, component, action } = {}) {

    console.warn("DDBComponentFeature",
      {
        name, ddbVehicle, updateExisting, hideDescription, sort, component, action}
      );

    const enricher = new DDBMonsterFeatureEnricher({ activityGenerator: DDBVehicleActivity });
    super({
      enricher,
      activityGenerator: DDBVehicleActivity,
      useMidiAutomations: ddbVehicle.addMonsterEffects ?? false,
    });

    this.name = name.trim();
    this.originalName = `${this.name}`;
    this.ddbVehicle = ddbVehicle;
    this.component = component;
    this.action = action;
    this.is2014 = ddbVehicle.is2014;
    this.is2024 = !this.is2014;
    let description = "";
    if (component.description) description = `${component.description}`;
    if (action.description) description += `\n${action.description}`;
    this.html = description.trim();

    this.sort = sort ?? null;

    this.hideDescription = hideDescription ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description");
    this.updateExisting = updateExisting ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    this.stripName = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-strip-name");

    this.prepare();

    // copy source details from parent
    if (this.ddbVehicle?.vehicle?.system.details?.source)
      this.data.system.source = this.ddbVehicle.vehicle.system.details.source;

    this.#generateActionDataStub();

  }

  _generateEscapeCheck(hit) {
    const escape = hit.match(/escape DC ([0-9]+)/);
    if (escape) {
      this.additionalActivities.push({
        type: "check",
        name: `Escape Check`,
        options: {
          generateCheck: true,
          generateTargets: false,
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

  _getSaveActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: false,
      damageParts: this.actionData.damageParts,
    }, options);

    return super._getSaveActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {

    const itemOptions = foundry.utils.mergeObject({
      generateAttack: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: this.actionData.damageParts.length > 0 || !this.isSave,
      includeBaseDamage: false,
      damageParts: this.actionData.damageParts,
    }, options);

    return super._getAttackActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
    }, options);

    return super._getUtilityActivity({ name, nameIdPostfix }, itemOptions);
  }

  #addSaveAdditionalActivity(includeBase = false) {
    const parts = this.templateType !== "weapon" || includeBase
      ? this.actionData.damageParts.map((dp) => dp.part)
      : this.actionData.damageParts.slice(1).map((dp) => dp.part);

    this.additionalActivities.push({
      name: "Save",
      type: "save",
      options: {
        generateDamage: parts.length > 0,
        damageParts: parts ?? parts,
        includeBaseDamage: false,
      },
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
    const nameChoice = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description-choice");
    const hideItemName = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-item-name");
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
    } else if (this.spellAttack || this.spellSave) {
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
    description = DDBReferenceLinker.replaceMonsterALinks(description, this.ddbVehicle.vehicle);

    description = DDBReferenceLinker.parseDamageRolls({ text: description, document: this.data, actor: this.ddbVehicle.vehicle });
    description = DDBReferenceLinker.parseToHitRoll({ text: description, document: this.data, actor: this.ddbVehicle.vehicle });
    description = DDBReferenceLinker.parseTags(description);
    description = await DDBReferenceLinker.replaceMonsterNameBadLinks(description, this.ddbVehicle.vehicle);

    this.data.system.description.value = await DDBTable.generateTable({
      parentName: this.ddbVehicle.vehicle.name,
      html: description,
      updateExisting: this.updateExisting,
      notifier: this.notifier,
    });
    this.data.system.description.value = `<div class="ddb">
${this.data.system.description.value}
</div>`;


  }

  async parse() {

    await this.enricher.init();

    this.#generateActionData();
    this.data.system.uses = this.getLimitedUse();

    this.data.system.quantity = this.component.count;

    this.data.system.hp = {
      value: null,
      max: null,
      dt: null,
      conditions: "",
    };

    if (this.component.groupType === "action-station") {
      switch (this.component.definition.coverType) {
        case "full":
          this.data.system.cover = 1;
          break;
        case "half":
          this.data.system.cover = 0.5;
          break;
        case "three-quarters":
          this.data.system.cover = 0.75;
          break;
        default:
          this.data.system.cover = undefined;
          break;
      }

    } else if (this.component.definition.groupType === "component") {

      if (this.component.definition.speeds && this.component.definition.speeds.length > 0) {
        this.data.system.speed = {
          value: this.component.definition.speeds[0].modes[0].value,
          conditions: this.component.definition.speeds[0].modes[0].description
            ? this.component.definition.speeds[0].modes[0].description
            : "",
        };
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
            this.data.system.speed.conditions += speedConditions.join("; ");
          }
        }
      }

      if (Number.isInteger(this.component.definition.armorClass)) {
        this.data.system.armor.value = parseInt(this.component.definition.armorClass);
      }

      if (Number.isInteger(this.component.definition.hitPoints)) {
        this.data.system.hp = {
          value: parseInt(this.component.definition.hitPoints),
          max: parseInt(this.component.definition.hitPoints),
          dt: null,
          conditions: "",
        };
        if (this.component.definition.damageThreshold) {
          this.data.system.hp.dt = this.component.definition.damageThreshold;
        }
      }
    }

    console.warn("DDBComponentFeature", {
      this: this,
      data: this.data,
    });
    await this._generateActivity();

    await this.#generateDescription();

    await this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(this.data.name.toLowerCase());

    logger.debug(`Parsed Feature ${this.name} for ${this.ddbVehicle.name}`, { feature: this });

  }

}
