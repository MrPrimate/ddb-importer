import { logger } from "../../../lib/_module.mjs";
import SystemHelpers from "../../lib/SystemHelpers.mjs";

export default class DDBActivityFactoryMixin {

  activities = [];

  activityType = null;

  activityTypes = [];

  additionalActivities = [];

  enricher = null;

  activityGenerator = null;

  documentType = null;

  notifier = null;

  useMidiAutomations = false;

  usesOnActivity = false;

  ignoreActivityGeneration = false;

  forceDefaultActionBuild = false;

  data = null;

  constructor({
    enricher = null, activityGenerator, documentType = null, notifier = null, useMidiAutomations = false,
    usesOnActivity = false,
  } = {}) {
    this.enricher = enricher;
    this.activityGenerator = activityGenerator;
    this.documentType = documentType;
    this.notifier = notifier;
    this.useMidiAutomations = useMidiAutomations;
    this.usesOnActivity = usesOnActivity;
  }

  async loadEnricher() {
    await this.enricher.init();
    await this.enricher.load({
      ddbParser: this,
    });
  }

  cleanup() {
    if (this.usesOnActivity) {
      foundry.utils.setProperty(this.data, "system.uses", {
        spent: null,
        max: null,
        recovery: [],
      });
    }
  }

  _getSaveActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "save",
      ddbParent: this,
      nameIdPrefix: "save",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateSave: true,
      generateDamage: !["weapon"].includes(this.documentType),
      generateRange: !["spell", "weapon"].includes(this.documentType),
    }, options));

    return activity;
  }

  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "attack",
      ddbParent: this,
      nameIdPrefix: "attack",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: true,
      generateDamage: !["weapon"].includes(this.documentType),
      generateRange: !["spell", "weapon"].includes(this.documentType),
    }, options));
    return activity;
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "utility",
      ddbParent: this,
      nameIdPrefix: "utility",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateDamage: false,
      generateRange: !["spell", "weapon"].includes(this.documentType),
    }, options));

    return activity;
  }

  _getForwardActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "forward",
      ddbParent: this,
      nameIdPrefix: "forward",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject(options));

    return activity;
  }

  _getHealActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "heal",
      ddbParent: this,
      nameIdPrefix: "heal",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateActivation: true,
      generateDamage: false,
      generateHealing: true,
      generateRange: !["spell"].includes(this.documentType),
    }, options));

    return activity;
  }

  _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "damage",
      ddbParent: this,
      nameIdPrefix: "damage",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateDamage: !["weapon"].includes(this.documentType),
      generateRange: !["spell", "weapon"].includes(this.documentType),
    }, options));
    return activity;
  }

  _getEnchantActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "enchant",
      ddbParent: this,
      nameIdPrefix: "enchant",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: !["spell"].includes(this.documentType),
      generateDamage: false,
    }, options));
    return activity;
  }

  _getSummonActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "summon",
      ddbParent: this,
      nameIdPrefix: "summon",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: !["spell"].includes(this.documentType),
      generateDamage: false,
    }, options));
    return activity;
  }

  _getCheckActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "check",
      ddbParent: this,
      nameIdPrefix: "check",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: true,
      generateActivation: true,
    }, options));
    return activity;
  }

  _getDDBMacroActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "ddbmacro",
      ddbParent: this,
      nameIdPrefix: "mac",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: false,
      generateActivation: true,
      generateTarget: true,
      generateDDBMacro: true,
      targetOverride: {
        override: true,
        template: {
          contiguous: false,
          type: "",
          size: "",
          units: "ft",
        },
        affects: {},
      },
    }, options));
    return activity;
  }

  _getCastActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "cast",
      ddbParent: this,
      nameIdPrefix: "cast",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    const buildOptions = foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateSpell: true,
      generateActivation: true,
    }, options);

    activity.build(buildOptions);
    return activity;
  }

  // eslint-disable-next-line class-methods-use-this
  _getActivitiesType() {
    logger.error(`This method should be over ridden`, {
      this: this,
    });
    return null;
  }

  _getTransformActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const activity = new this.activityGenerator({
      name,
      type: "transform",
      ddbParent: this,
      nameIdPrefix: "tran",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    const buildOptions = foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
      generateSpell: false,
      generateActivation: true,
    }, options);

    activity.build(buildOptions);
    return activity;
  }

  getActivity({ typeOverride = null, typeFallback = null, name = null, nameIdPostfix = null } = {}, options = {}) {
    const type = typeOverride ?? this._getActivitiesType();
    this.activityTypes.push(type);
    const data = { name, nameIdPostfix };
    switch (type) {
      case "save":
        return this._getSaveActivity(data, options);
      case "attack":
        return this._getAttackActivity(data, options);
      case "damage":
        return this._getDamageActivity(data, options);
      case "heal":
        return this._getHealActivity(data, options);
      case "utility":
        return this._getUtilityActivity(data, options);
      case "enchant":
        return this._getEnchantActivity(data, options);
      case "summon":
        return this._getSummonActivity(data, options);
      case "check":
        return this._getCheckActivity(data, options);
      case "ddbmacro":
        return this._getDDBMacroActivity(data, options);
      case "forward":
        return this._getForwardActivity(data, options);
      case "cast":
        return this._getCastActivity(data, options);
      case "transform":
        return this._getTransformActivity(data, options);
      case "teleport":
      default:
        if (typeFallback) return this.getActivity({ typeOverride: typeFallback, name, nameIdPostfix }, options);
        return undefined;
    }
  }

  async _generateActivity({
    hintsOnly = false, name = null, nameIdPostfix = null, typeOverride = null, typeFallback = null,
  } = {}, optionsOverride = {},
  ) {
    if (this.ignoreActivityGeneration) return undefined;
    if (hintsOnly && !this.enricher.activity) return undefined;
    if (this.enricher.type === "none" || this.enricher.activity?.type === "none") return undefined;

    const activityOptions = this.enricher.activity?.options ?? {};
    const options = foundry.utils.mergeObject(
      foundry.utils.deepClone(optionsOverride),
      foundry.utils.deepClone(activityOptions),
    );

    if (this.usesOnActivity || this.enricher.usesOnActivity) {
      options.usesOverride = foundry.utils.deepClone(this.data.system.uses);
      options.usesOverride.override = true;
      options.generateUses = true;
    }

    const activity = this.getActivity({
      typeOverride: typeOverride ?? this.enricher.type ?? this.enricher.activity?.type,
      name,
      nameIdPostfix,
      typeFallback,
    }, options);


    if (!activity) {
      logger.debug(`No Activity type found for ${this.data.name}`, {
        this: this,
      });
      return undefined;
    }

    if (!this.activityType) this.activityType = activity.data.type;

    await this.enricher.applyActivityOverride(activity.data);
    this.activities.push(activity);

    if (this.enricher.activity?.addSingleFreeUse) {
      const singleActivity = foundry.utils.deepClone(activity.data);
      singleActivity.name = `${singleActivity.name} (Free use)`;
      singleActivity._id = `${singleActivity._id.slice(0, -3)}fre`;
      foundry.utils.setProperty(singleActivity, "consumption.targets", [
        {
          type: "activityUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ]);
      const period = this.enricher.activity.addSingleFreeRecoveryPeriod ?? "lr";
      foundry.utils.setProperty(singleActivity, "uses", {
        override: true,
        max: "1",
        spent: 0,
        recovery: [{ period, type: 'recoverAll', formula: undefined }],
      });
      foundry.utils.setProperty(this.data, `system.activities.${singleActivity._id}`, singleActivity);
    }

    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  async _generateAdditionalActivities() {
    if (!this.enricher.addAutoAdditionalActivities) return;
    if (this.additionalActivities.length === 0) return;
    let i = 0;
    for (const activityData of this.additionalActivities) {
      const id = await this._generateActivity({
        hintsOnly: false,
        name: activityData.name,
        nameIdPostfix: i,
        typeOverride: activityData.type,
      }, activityData.options);
      logger.debug(`Generated additional Activity with id ${id}`, {
        this: this,
        activityData,
        id,
      });
      i++;
    }
  }


  // eslint-disable-next-line complexity
  _activityEffectLinking() {
    if (this.data.effects.length === 0) return;
    if (!foundry.utils.hasProperty(this.data, "system.activities")) return;
    for (const activityId of Object.keys(this.data.system.activities)) {
      const activity = this.data.system.activities[activityId];
      if (!activity.effects || activity.effects.length !== 0) continue;
      if (foundry.utils.getProperty(activity, "flags.ddbimporter.noeffect")) continue;
      for (const effect of this.data.effects) {
        const ignoreTransfer = foundry.utils.getProperty(effect, "flags.ddbimporter.ignoreTransfer") ?? false;
        if (effect.transfer && !ignoreTransfer) continue;
        if (foundry.utils.getProperty(effect, "flags.ddbimporter.noeffect")) continue;
        const activityNamesRequired = foundry.utils.hasProperty(effect, "flags.ddbimporter.activitiesMatch")
          ? foundry.utils.getProperty(effect, "flags.ddbimporter.activitiesMatch")
          : foundry.utils.hasProperty(effect, "flags.ddbimporter.activityMatch")
            ? [foundry.utils.getProperty(effect, "flags.ddbimporter.activityMatch")]
            : [];
        if (activityNamesRequired.length > 0 && !activityNamesRequired.includes(activity.name)) continue;
        if (!effect._id) effect._id = foundry.utils.randomID();
        activity.effects.push({
          _id: effect._id,
          level: foundry.utils.getProperty(effect, "flags.ddbimporter.effectIdLevel") ?? { min: null, max: null },
          riders: {
            activity: foundry.utils.getProperty(effect, "flags.ddbimporter.activityRiders") ?? [],
            effect: foundry.utils.getProperty(effect, "flags.ddbimporter.effectRiders") ?? [],
            item: foundry.utils.getProperty(effect, "flags.ddbimporter.itemRiders") ?? [],
          },
        });
      }
      this.data.system.activities[activityId] = activity;
    }

    // Track changes to rider activities & effects and store in item flags
    const riders = { activity: new Set(), effect: new Set() };
    for (const activityId of Object.keys(this.data.system.activities)) {
      const activity = this.data.system.activities[activityId];
      if (activity.type !== "enchant") continue;
      for (const e of activity.effects) {
        e.riders.activity.forEach((activity) => {
          riders.activity.add(activity);
        });
        e.riders.effect.forEach((effect) => {
          riders.effect.add(effect);
        });
      }
    }

    foundry.utils.setProperty(this.data, "flags.dnd5e.riders", {
      activity: Array.from(riders.activity),
      effect: Array.from(riders.effect),
    });

  }


  static getDamageParts(modifiers, typeOverride = null) {
    return modifiers
      .filter((mod) => Number.isInteger(mod.value)
        || (mod.dice ? mod.dice : mod.die ? mod.die : undefined) !== undefined,
      )
      .map((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        if (die) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: die.diceString,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.value) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: mod.value,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.fixedValue) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: mod.fixedValue,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else {
          return null;
        }
      }).filter((part) => part !== null);
  }

  static filterCombinedDamageParts(damageParts) {
    const tracker = {};

    for (const part of damageParts) {
      const partKey = `${part.number ?? ""}${part.denomination ?? ""}${part.bonus ?? ""}${part.custom}${part.formula}`;
      if (tracker[partKey]) {
        tracker[partKey].types.push(...part.types);
      } else {
        tracker[partKey] = part;
      }
    }

    return Object.values(tracker);
  }

  static getCombinedDamageModifiers(modifiers) {
    const damageModifiers = modifiers.filter((m) => m.type === "damage");

    const additionalDamageParts = DDBActivityFactoryMixin.getDamageParts(
      damageModifiers
        .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === "")),
    );

    return DDBActivityFactoryMixin.filterCombinedDamageParts(additionalDamageParts);

  }
}
