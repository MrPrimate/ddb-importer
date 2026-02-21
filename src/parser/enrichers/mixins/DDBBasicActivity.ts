import { utils, logger } from "../../../lib/_module";
import { SystemHelpers } from "../../lib/_module";
import { Effects } from "../_module";

export default class DDBBasicActivity {

  type: string;
  activityType: any;
  name: string | null;
  ddbParent: any;
  actor: any;
  foundryFeature: any;
  nameIdPrefix: string;
  nameIdPostfix: string;
  id: string | null;
  data: any;

  _init(): void {
    logger.debug(`Generating DDBBasicActivity ${this.name}`);
  }

  _generateDataStub(): void {
    const rawStub = new this.activityType.documentClass({
      name: this.name,
      type: this.type,
    });

    this.data = rawStub.toObject();
    if (!this.id) {
      this.id = utils.namedIDStub(this.name ?? this.foundryFeature?.name ?? this.type, {
        prefix: this.nameIdPrefix,
        postfix: this.nameIdPostfix,
      });
    }

    this.data._id = this.id;

    // midi defaults
    this.data.midiProperties = {
      ignoreTraits: [],
      triggeredActivityId: "none",
      triggeredActivityConditionText: "",
      triggeredActivityTargets: "targets",
      triggeredActivityRollAs: "self",
      forceDialog: false,
      confirmTargets: "default",
      automationOnly: false,
      identifier: "",
    };

    if (["summon", "enchant"].includes(this.type)) {
      this.data.midiProperties.confirmTargets = "never";
      this.data.midiProperties.forceDialog = true;
    }
    this.data.otherActivityId = "none"; // auto is clear
  }


  constructor({
    type, name, actor = null, ddbParent = null,
    nameIdPrefix = null, nameIdPostfix = null, id = null,
    foundryFeature = null,
  }: {
    type: string;
    name?: string | null;
    actor?: any;
    ddbParent?: any;
    nameIdPrefix?: string | null;
    nameIdPostfix?: string | null;
    id?: string | null;
    foundryFeature?: any;
  } = { type: "" }) {

    this.type = type.toLowerCase();
    this.activityType = (CONFIG as any).DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys((CONFIG as any).DND5E.activityTypes)}`);
    }
    const actionName = this.ddbParent?.isAction ? this.ddbParent.name : null;
    this.name = name ?? actionName;
    this.ddbParent = ddbParent;
    this.actor = actor;
    this.foundryFeature = foundryFeature ?? ddbParent.data;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";
    this.id = id;

    this._init();
    this._generateDataStub();

  }

  getParsedAction(): string | undefined {
    const description = this.foundryFeature?.system?.description?.value;
    if (!description) return undefined;
    // pcs don't have mythic
    const actionAction = description.match(/(?:as|spend|use) (?:a|an|your|a magic) action/ig);
    if (actionAction) return "action";
    const bonusAction = description.match(/(?:as|use|spend) (?:a|an|your) bonus action/ig);
    if (bonusAction) return "bonus";
    const reAction = description.match(/(?:as|use|spend) (?:a|an|your) reaction/ig);
    if (reAction) return "reaction";

    return undefined;
  }

  // note spells do not have activation
  _generateActivation({ activationOverride = null, noManual = false }: { activationOverride?: any; noManual?: boolean } = {}): void {
    if (activationOverride) {
      this.data.activation = activationOverride;
      this.data.activation.override = true;
      return;
    }

    if (noManual) return;

    const description = this.foundryFeature.system?.description?.value;

    if (!description) return;
    const actionType = this.getParsedAction();
    if (!actionType) return;
    logger.debug(`Parsed manual activation type: ${actionType} for ${this.name}`);
    this.data.activation = {
      type: actionType,
      value: 1,
      condition: "",
    };
  }

  _generateConsumption({ targetOverrides = null, consumptionOverride = null, additionalTargets = [], consumeActivity = false, consumeItem = null }: { targetOverrides?: any; consumptionOverride?: any; additionalTargets?: any[]; consumeActivity?: boolean; consumeItem?: any } = {}): void {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    let targets: any[] = [];
    let scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    // this is a spell with limited uses such as one granted by a feat
    if (consumeActivity) {
      targets.push({
        type: "activityUses",
        target: "", // this item
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (consumeItem) {
      targets.push({
        type: "itemUses",
        target: "", // this item
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }

    // Future check for hit dice expenditure?
    // expend one of its Hit Point Dice,
    // you can spend one Hit Die to heal yourself.
    // right now most of these target other creatures

    // const kiPointRegex = /(?:spend|expend) (\d) (?:ki|focus) point/;
    // const match = this.foundryFeature.system?.description?.value.match(kiPointRegex);
    // if (match) {
    //   targets.push({
    //     type: "itemUses",
    //     target: "", // adjusted later
    //     value: match[1],
    //     scaling: {
    //       mode: "",
    //       formula: "",
    //     },
    //   });
    // }

    if (additionalTargets && additionalTargets.length > 0) targets.push(...additionalTargets);

    this.data.consumption = {
      targets: targetOverrides ?? targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  _generateDescription({ overRide = null }: { overRide?: any } = {}): void {
    this.data.description = {
      chatFlavor: overRide ?? this.foundryFeature.system?.chatFlavor ?? "",
    };
  }

  _generateEnchant(): void {
    logger.debug(`Stubbed enchantment generation for ${this.name}`);
  }

  _generateSummon(): void {
    logger.debug(`Stubbed summon generation for ${this.name}`);
  }

  _generateDuration({ durationOverride = null }: { durationOverride?: any } = {}): void {
    if (durationOverride) {
      this.data.duration = durationOverride;
      this.data.duration.override = true;
    }
  }

  _generateEffects(): void {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange({ rangeOverride = null }: { rangeOverride?: any } = {}): void {
    if (rangeOverride) {
      this.data.range = rangeOverride;
      this.data.range.override = true;
    }
  }

  _generateTarget({ targetOverride = null }: { targetOverride?: any } = {}): void {
    if (targetOverride) {
      this.data.target = targetOverride;
      this.data.target.override = true;
    }
  }

  _generateUses({ usesOverride = null }: { usesOverride?: any } = {}): void {
    if (usesOverride) {
      this.data.uses = usesOverride;
      this.data.uses.override = true;
    }
  }

  _generateCheck({ checkOverride = null }: { checkOverride?: any } = {}): void {
    if (checkOverride) {
      this.data.check = checkOverride;
    };
  }

  _generateSpell({ spellOverride = null }: { spellOverride?: any } = {}): void {
    if (spellOverride) {
      this.data.spell = spellOverride;
    } else {
      this.data.spell = {
        properties: [],
      };
    }
  }

  _generateDamage({
    allowCritical = null, includeBase = false, damageParts = null, onSave = null, scalingOverride = null,
    criticalDamage = null,
  }: {
    allowCritical?: boolean | null;
    includeBase?: boolean;
    damageParts?: any[] | null;
    onSave?: string | null;
    scalingOverride?: any;
    criticalDamage?: string | null;
  } = {}): void {
    if (damageParts) {
      this.data.damage = {
        parts: damageParts,
        onSave: onSave ?? "",
        includeBase,
        scaling: scalingOverride ?? undefined,
        critical: {
          allow: allowCritical ?? (this.type === "attack" || this.foundryFeature.type === "weapon"),
          bonus: criticalDamage ?? "",
        },
      };
      return;
    }

    this.data.damage = {
      critical: {
        allow: allowCritical ?? (this.type === "attack" || this.foundryFeature.type === "weapon"),
      },
      onSave: onSave ?? "",
      includeBase,
      parts: [],
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

  _generateHealing({ healingPart, healingChatFlavor = null }: { healingPart?: any; healingChatFlavor?: string | null } = {}): void {
    if (healingChatFlavor) this.data.description.chatFlavor = healingChatFlavor;
    this.data.healing = healingPart;
  }

  _generateSave({ saveOverride = null }: { saveOverride?: any } = {}): void {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    this.data.save = {
      ability: [Object.keys((CONFIG as any).DND5E.abilities)[0]],
      dc: {
        calculation: "",
        formula: "",
      },
    };
  }

  static deriveAttackClassification({ unarmed = false, spell = false }: { unarmed?: boolean; spell?: boolean } = {}): string {
    return unarmed
      ? "unarmed"
      : spell
        ? "spell"
        : "weapon";
  }

  _generateAttack({
    type = "melee", unarmed = false, spell = false, classification = null,
    ability = null, bonus = "", criticalThreshold = undefined, flat = false,
  }: {
    type?: string;
    unarmed?: boolean;
    spell?: boolean;
    classification?: string | null;
    ability?: string | null;
    bonus?: string;
    criticalThreshold?: number | undefined;
    flat?: boolean;
  } = {}): void {

    const attack = {
      ability: ability ? ability : "",
      bonus,
      critical: {
        threshold: criticalThreshold,
      },
      flat, // almost never false for PC features
      type: {
        value: type,
        classification: classification ?? DDBBasicActivity.deriveAttackClassification({ unarmed, spell }),
      },
    };

    this.data.attack = attack;

  }

  _generateRoll({ rollOverride = null }: { rollOverride?: any } = {}): void {
    if (rollOverride) {
      this.data.roll = rollOverride;
    }
  }


  _generateDDBMacro({ ddbMacroOverride = null }: { ddbMacroOverride?: any } = {}): void {
    if (ddbMacroOverride) {
      this.data.macro = ddbMacroOverride;
    }
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
  // type
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
  // type
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
  // type
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
  // type
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
  // type
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
  // type
  // uses

  build({
    activationOverride = null,
    additionalTargets = [],
    allowCritical = null,
    attackData = {},
    spellOverride = null,
    chatFlavor = null,
    checkOverride = null,
    consumeActivity = null,
    consumeItem = null,
    consumptionOverride = null,
    consumptionTargetOverrides = null,
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
    healingChatFlavor = null,
    healingPart = null,
    img = null,
    includeBaseDamage = false,
    noeffect = false,
    noManualActivation = false,
    onSave = null,
    partialDamageParts = null,
    rangeOverride = null,
    rollOverride = null,
    saveOverride = null,
    targetOverride = null,
    usesOverride = null,
  }: {
    activationOverride?: any;
    additionalTargets?: any[];
    allowCritical?: boolean | null;
    attackData?: any;
    spellOverride?: any;
    chatFlavor?: string | null;
    checkOverride?: any;
    consumeActivity?: any;
    consumeItem?: any;
    consumptionOverride?: any;
    consumptionTargetOverrides?: any;
    criticalDamage?: string | null;
    damageParts?: any[] | null;
    damageScalingOverride?: any;
    data?: any;
    ddbMacroOverride?: any;
    durationOverride?: any;
    generateActivation?: boolean;
    generateAttack?: boolean;
    generateSpell?: boolean;
    generateCheck?: boolean;
    generateConsumption?: boolean;
    generateDamage?: boolean;
    generateDDBMacro?: boolean;
    generateDescription?: boolean;
    generateDuration?: boolean;
    generateEffects?: boolean;
    generateEnchant?: boolean;
    generateHealing?: boolean;
    generateRange?: boolean;
    generateRoll?: boolean;
    generateSave?: boolean;
    generateSummon?: boolean;
    generateTarget?: boolean;
    generateUses?: boolean;
    healingChatFlavor?: string | null;
    healingPart?: any;
    img?: string | null;
    includeBaseDamage?: boolean;
    noeffect?: boolean;
    noManualActivation?: boolean;
    onSave?: string | null;
    partialDamageParts?: any;
    rangeOverride?: any;
    rollOverride?: any;
    saveOverride?: any;
    targetOverride?: any;
    usesOverride?: any;
  } = {}): void {

    if (generateActivation) this._generateActivation({ activationOverride, noManual: noManualActivation });
    if (generateAttack) this._generateAttack(attackData);
    if (generateConsumption) this._generateConsumption({
      targetOverrides: consumptionTargetOverrides,
      consumptionOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
    });
    if (generateDescription) this._generateDescription({ overRide: chatFlavor });
    if (generateEffects) this._generateEffects();
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({
      damageParts,
      onSave,
      includeBase: includeBaseDamage,
      scalingOverride: damageScalingOverride,
      criticalDamage,
      allowCritical,
    });
    if (generateEnchant) this._generateEnchant();
    if (generateSummon) {
      this._generateSummon();
      if (!generateTarget) {
        this._generateTarget({
          targetOverride: {
            "template": {
              "contiguous": false,
              "units": "ft",
              "type": "",
            },
            "affects": {
              "choice": false,
              "type": "space",
              "count": "1",
              "special": "unoccupied",
            },
          },
        });
      }
    }
    if (generateHealing) this._generateHealing({ healingPart, healingChatFlavor });
    if (generateRange) this._generateRange({ rangeOverride });
    if (generateTarget) this._generateTarget({ targetOverride });
    if (generateDuration) this._generateDuration({ durationOverride });
    if (generateDDBMacro) this._generateDDBMacro({ ddbMacroOverride });
    if (generateUses) this._generateUses({ usesOverride });
    if (generateRoll) this._generateRoll({ rollOverride });
    if (generateCheck) this._generateCheck({ checkOverride });
    if (generateSpell) this._generateSpell({ spellOverride });

    if (noeffect) {
      const ids = (foundry as any).utils.getProperty(this.foundryFeature, "flags.ddbimporter.noeffect") ?? [];
      ids.push(this.data._id);
      (foundry as any).utils.setProperty(this.foundryFeature, "flags.ddbimporter.noEffectIds", ids);
      (foundry as any).utils.setProperty(this.data, "flags.ddbimporter.noeffect", true);
    }
    if (img) (foundry as any).utils.setProperty(this.data, "img", img);
    if (data) (foundry as any).utils.mergeObject(this.data, data);

  }

  static async createActivity({ document, type, name, character, enricher }: { document?: any; type?: string; name?: string | null; character?: any; enricher?: any } = {}, options: any = {}): Promise<string> {
    const activity = new DDBBasicActivity({
      name: name ?? null,
      type,
      foundryFeature: document,
      actor: character,
    });

    activity.build(options);
    await enricher?.applyActivityOverride(activity.data);

    const effects = await enricher?.createEffects() ?? [];
    document.effects.push(...effects);
    enricher?.createDefaultEffects();
    await enricher?.addDocumentOverride();
    (foundry as any).utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);
    await enricher?.addAdditionalActivities(enricher?.ddbParent);

    return activity.data._id;

  }

  static buildDamagePart({ dice = null, damageString = "", type, stripMod = false }: { dice?: any; damageString?: string; type?: string; stripMod?: boolean } = {}): any {
    return SystemHelpers.buildDamagePart({ dice, damageString, type, stripMod });
  }

  static async addQuickCastActivity({ uuid, actor, document, spellOverride = null, consumptionTargetOverrides = null, activityData = {} }: { uuid?: string; actor?: any; document?: any; spellOverride?: any; consumptionTargetOverrides?: any; activityData?: any } = {}): Promise<string | null> {
    const foundryData = document.toObject();
    const spellData = await (globalThis as any).fromUuid(uuid);

    if (!spellData) {
      (ui as any).notifications.error(`Could not find spell with UUID: ${uuid}`);
      return null;
    }

    const ddbActivityId = await DDBBasicActivity.createActivity(
      {
        type: "cast",
        character: actor,
        document: foundryData,
        name: `Cast ${spellData.name}`,
      },
      {
        generateActivation: false,
        generateTarget: false,
        generateDuration: false,
        generateRange: false,
        generateUses: false,
        generateSpell: true,
        spellOverride: spellOverride ?? {
          uuid,
          properties: [],
          level: null,
          challenge: {
            attack: null,
            save: null,
            override: false,
          },
          spellbook: true,
        },
        consumeItem: true,
        generateConsumption: true,
        consumptionTargetOverrides: consumptionTargetOverrides ?? [
          {
            type: "itemUses",
            target: "", // adjusted later
            value: 1,
            scaling: {
              mode: "",
              formula: "",
            },
          },
        ],
      },
    );

    (foundry as any).utils.mergeObject(foundryData.system.activities[ddbActivityId], activityData);
    await document.update(foundryData);
    return ddbActivityId;

  }

  static async addQuickEnchantmentActivity({
    actor, document, activityData = {}, riderActionIds = [], riderEffectIds = [],
    label, changes = [],
  }: {
    actor?: any;
    document?: any;
    activityData?: any;
    riderActionIds?: string[];
    riderEffectIds?: string[];
    label?: string;
    changes?: any[];
  } = {}): Promise<string> {
    const foundryData = document.toObject();

    const activity = new DDBBasicActivity({
      type: "enchant",
      actor,
      foundryFeature: foundryData,
    });

    activity.data.restrictions = {
      type: "",
      allowMagical: true,
    };

    const enchantmentEffect = Effects.EnchantmentEffects.EnchantmentEffect(foundryData, label, {
      origin: document.uuid,
    });
    enchantmentEffect.changes.push(...changes);
    (foundry as any).utils.mergeObject(activity.data, activityData);

    const effectLink = {
      _id: enchantmentEffect._id,
      level: {
        min: null,
        max: null,
      },
      riders: {
        activity: riderActionIds,
        effect: riderEffectIds,
        item: [],
      },
    };
    activity.data.effects.push(effectLink);

    let effects = [enchantmentEffect];

    foundryData.effects.push(...effects);
    (foundry as any).utils.setProperty(foundryData, `system.activities.${activity.data._id}`, activity.data);

    const riderFlags = (foundry as any).utils.getProperty(foundryData, "flags.dnd5e.riders") ?? { activity: [], effect: [] };

    riderFlags.activity.push(...riderActionIds);
    riderFlags.effect.push(...riderEffectIds);

    (foundry as any).utils.setProperty(foundryData, "flags.dnd5e.riders", riderFlags);
    await document.update(foundryData);
    return activity.data._id;

  }

}
