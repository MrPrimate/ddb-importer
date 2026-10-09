import { utils, logger, CompendiumHelper } from "../../../lib/_module";
import { DICTIONARY } from "../../../config/_module";
import { DDBMonsterFeatureActivity } from "../../activities/_module";
import { DDBMonsterFeatureEnricher, Effects } from "../../enrichers/_module";
import { DDBTable, DDBReferenceLinker, DDBDescriptions, SystemHelpers } from "../../lib/_module";
import { DDBMonsterDamage } from "./DDBMonsterDamage";
import { monsterDamageAppliedStatuses, monsterDamageModeName } from "./MonsterDamageModes";
import DDBMonster from "../../DDBMonster";
import { IMonsterWeaponDictionary } from "../../../config/dictionary/actor/monsters";
import DDBActivityFactoryMixin from "../../activities/mixins/DDBActivityFactoryMixin";


interface IDDBMonsterFeature {
  ddbMonster?: DDBMonster;
  html?: string;
  type?: TDDBMonsterActionType;
  titleHTML?: string;
  fullName?: string;
  actionCopy?: boolean;
  updateExisting?: boolean;
  hideDescription?: boolean;
  sort?: number | null;
  // policy overrides; when undefined the matching game setting supplies the value
  stripName?: boolean;
  stripFlagData?: boolean;
}

type TDDBMonsterFeatureDocumentType = "feat" | "weapon";

export default class DDBMonsterFeature extends DDBActivityFactoryMixin<TDDBMonsterFeatureDocumentType> {

  declare rawCharacter: I5eMonsterData | null;
  declare data: I5eWeaponItem | I5eFeatItem;

  // every use is behind a this.templateType === "weapon" guard, which cannot
  // narrow the union on this.data, so expose the weapon view directly
  get weaponData(): I5eWeaponItem {
    return this.data as I5eWeaponItem;
  }

  declare enricher: DDBMonsterFeatureEnricher;
  declare type: TDDBMonsterActionType;
  actionData: IDDBMonsterActionData;
  // fields marked with ! are assigned in prepare(), which the constructor always calls
  descriptionParse!: IFeatureBasicsResult;
  descriptionSave!: IFeatureBasicsSave;
  // memoised by the multiSaveSections getter; [] means "one save, do not reshape"
  #multiSaveSectionCache?: { slice: ISectionSlice; save: IParsedSave }[];
  name: string;
  isAction = null;
  legacy: boolean;
  is2014: boolean;
  is2024: boolean;
  originalName!: string;
  ddbMonster: DDBMonster;
  html: string;
  strippedHtml!: string;
  levelBonus!: boolean;
  profBonus!: boolean;
  sort: number | null;
  isAttack!: boolean;
  isSummonAttack!: boolean;
  isSave!: boolean;
  isRecharge!: RegExpMatchArray | null;
  fullName: string;
  stripName: boolean;
  hideDescription: boolean;
  updateExisting: boolean;
  stripFlagData: boolean;
  titleHTML?: string;
  actionCopy: boolean;
  isSpellSave!: boolean;
  isSavingThrow!: boolean;
  isSummonSave!: boolean;
  halfDamage!: boolean;
  pbToAttack!: boolean;
  weaponAttack!: boolean;
  spellAttack!: boolean;
  meleeAttack!: boolean;
  rangedAttack!: boolean;
  healingAction!: boolean;
  toHit!: number;
  yourSpellAttackModToHit!: boolean;
  templateType!: "feat" | "weapon";
  weaponLookup: IMonsterWeaponDictionary | undefined;
  identifier!: string;
  isCompanion!: boolean;
  nameSplit?: string;
  use2024Spells: boolean;
  useCastActivity: boolean;
  // assigned at the start of generateDamageInfo() before any read
  ddbMonsterDamage!: DDBMonsterDamage;
  #damageModeQueued = false;
  // assigned by #generateSpellcastingData() before spell activity generation reads it
  spellCastingData!: IMonsterSpellcastingData;

  #generateAdjustedName() {
    this.originalName = `${this.name}`;
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
          levelBonus: false,
          profBonus: false,
          spellSave: false,
          dndbeyond: {
          },
        },
        monsterMunch: {
          titleHTML: this.titleHTML ?? "",
          fullName: this.fullName,
          actionCopy: this.actionCopy,
          type: this.type,
          description: this.html,
        },
      },
    };
    // these templates not good
    if ("requirements" in this.data.system) {
      this.data.system.requirements = "";
    }
    this.data.sort = this.sort ?? undefined;
    this.levelBonus = false;
    this.profBonus = false;
  }

  #derivedWeapon = false;
  #bonusWeapon = false;

  /**
   * Whether alternate damage becomes extra attack activities ("Versatile", damage modes) in the
   * feature slots. Weapons from the dictionary keep their own ids for these, but the attacks made
   * weapons from their text (#derivedWeaponLookup) were features until then and keep those ids.
   */
  get #keepsDamageModeActivities(): boolean {
    return this.templateType !== "weapon" || this.#derivedWeapon;
  }

  /**
   * A parsed part as a weapon roll part, without the ability modifier, which dnd5e adds to a
   * weapon's base roll itself. The parsed parts keep it, as they also serve activities that do not
   * include the base (a save, an ongoing grapple's damage) and would otherwise roll without it.
   */
  static weaponDamagePart(damagePart: IDDBMonsterActionDataDamagePart): I5eDamagePart {
    return SystemHelpers.buildDamagePart({
      damageString: damagePart.damageString,
      types: damagePart.damageTypes,
      stripMod: true,
    });
  }

  /**
   * A dictionary weapon carrying a magic bonus before its name ("+1 Rapier"). The bonus after the
   * name ("Longsword +1") already matches the dictionary by prefix.
   */
  static bonusWeaponMatch(name: string): IMonsterWeaponDictionary | undefined {
    const baseName = name.replace(/\s*\(.*$/, "").trim();
    const bonus = baseName.match(/^\+\d+\s+(.+)$/);
    if (!bonus) return undefined;
    const weapon = DICTIONARY.monsters.weapons.find((w) => w.weaponType !== "natural" && bonus[1].startsWith(w.name));
    return weapon ? { ...weapon, properties: { ...weapon.properties, mgc: true } } : undefined;
  }

  /**
   * Weapon lookup for an attack the weapon dictionary does not name by prefix. Following the
   * official Monster Manual, every such attack is a natural weapon (claws and gores, but also
   * rocks, rays, bursts and touches, which keep their spell classification on the activity),
   * except a dictionary weapon with a leading magic bonus. Recharge attacks stay features.
   */
  #derivedWeaponLookup(): IMonsterWeaponDictionary | undefined {
    if (!this.isAttack || this.isRecharge !== null) return undefined;
    this.#derivedWeapon = true;
    const bonusWeapon = DDBMonsterFeature.bonusWeaponMatch(this.name);
    if (bonusWeapon) {
      this.#bonusWeapon = true;
      return bonusWeapon;
    }
    return {
      name: this.name.replace(/\s*\(.*$/, "").trim(),
      actionType: this.rangedAttack && !this.meleeAttack ? "rwak" : "mwak",
      weaponType: "natural",
      properties: {},
    };
  }

  // prepare the html in this.html for a parse, runs some checks and pregen to calculate values
  prepare() {
    this.strippedHtml = utils.stripHtml(`${this.html}`).trim();

    const descriptionParse: IFeatureBasicsResult = DDBDescriptions.featureBasics({ text: this.strippedHtml });
    this.descriptionParse = descriptionParse;

    // set calc flags
    this.isAttack = descriptionParse.properties.isAttack;
    this.isSummonAttack = descriptionParse.properties.isSummonAttack;
    this.isSpellSave = descriptionParse.properties.isSpellSave;
    this.isSavingThrow = descriptionParse.properties.isSavingThrow;
    this.isSummonSave = descriptionParse.properties.isSummonSave;
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
    this.yourSpellAttackModToHit = descriptionParse.properties.yourSpellAttackModToHit;
    this.descriptionSave = descriptionParse.save;

    this.isRecharge = this.#matchRecharge();
    this.templateType = this.isAttack && this.isRecharge === null ? "weapon" : "feat";
    this.weaponLookup = DICTIONARY.monsters.weapons.find((weapon) => this.name.startsWith(weapon.name))
      ?? this.#derivedWeaponLookup();

    if (this.name === "Legendary Actions" || !this.weaponLookup) {
      this.templateType = "feat";
    } else if (this.weaponLookup) {
      this.templateType = "weapon";
    }

    if (!this.data) this.createBaseFeature();
    this.#generateAdjustedName();

    foundry.utils.setProperty(this.data, "flags.midiProperties", descriptionParse.midiProperties);

    this.identifier = utils.referenceNameString(this.data.name.toLowerCase());
    this.data.system.identifier = this.identifier;

    // if not attack set to a monster type action
    if (this.templateType !== "weapon") foundry.utils.setProperty(this.data, "system.type.value", "monster");

    this.isCompanion = foundry.utils.getProperty(this.ddbMonster, "npc.flags.ddbimporter.entityTypeId") === "companion-feature";

    if (this.isSummonSave) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.spellSave", true);
    }
    if (this.isSummonAttack) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.spellAttack", true);
    }


  }

  override async loadEnricher() {
    await this.enricher.init();
    await this.enricher.load({
      ddbParser: this,
      monster: this.ddbMonster.npc,
      name: this.name,
    });
  }

  resetActionData() {
    this.actionData = {
      baseWeapon: null,
      baseTool: null,
      damage: {
        base: undefined,
        onSave: null,
        // parts: [],
        // versatile: "",
      },
      damageParts: [],
      healingParts: [],
      versatileParts: [],
      saveParts: [],
      formula: "",
      target: {
        template: {
          count: "",
          contiguous: false,
          type: "", // line
          size: "", // 60
          width: "",
          height: "",
          units: "ft", // ft
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
      extraAttackBonus: 0,
      baseAbility: null,
      proficient: false,
      properties: {
        "amm": false,
        "fin": false,
        "fir": false,
        "foc": false,
        "hvy": false,
        "lgt": false,
        "lod": false,
        "rch": false,
        "rel": false,
        "ret": false,
        "spc": false,
        "thr": false,
        "two": false,
        "ver": false,
        "mgc": false,
      },
      range: {
        value: null,
        long: null,
        units: "",
        reach: null,
      },
      activation: {
        type: undefined,
        value: null,
        condition: "",
      },
      save: {
        ability: [],
        dc: {
          calculation: "",
          formula: "",
        },
      },
      uses: {
        spent: null,
        max: null,
        recovery: [
          // { period: "", type: 'recoverAll', formula: undefined },
        ],
      },
      consumptionValue: null,
      consumptionTargets: [],
    };
  }

  constructor(name: string, { ddbMonster, html, type, titleHTML, fullName, actionCopy, updateExisting, hideDescription, sort, stripName, stripFlagData }: IDDBMonsterFeature) {

    // a missing monster previously blew up further down with a TypeError; fail loudly instead
    if (!ddbMonster) {
      throw new Error(`DDBMonsterFeature "${name}" constructed without a ddbMonster`);
    }

    const enricher = new DDBMonsterFeatureEnricher({ activityGenerator: DDBMonsterFeatureActivity });
    super({
      enricher,
      activityGenerator: DDBMonsterFeatureActivity,
      useMidiAutomations: ddbMonster.addMonsterEffects,
    });

    this.name = utils.nameString(name);
    this.ddbMonster = ddbMonster;
    this.rawCharacter = ddbMonster.npc;
    this.is2014 = ddbMonster.is2014;
    this.is2024 = !this.is2014;
    this.legacy = ddbMonster.legacy;
    this.useCastActivity = ddbMonster.useCastActivity ?? false;
    this.use2024Spells = ddbMonster.use2024Spells ?? false;

    this.type = type ?? "action";
    this.html = html ?? "";
    this.titleHTML = titleHTML ?? undefined;
    this.fullName = fullName ?? this.name;
    this.actionCopy = actionCopy ?? false;
    this.sort = sort ?? null;

    this.hideDescription = hideDescription ?? utils.getSetting<boolean>("munching-policy-hide-description");
    this.updateExisting = updateExisting ?? utils.getSetting<boolean>("munching-policy-update-existing");
    this.stripName = stripName ?? utils.getSetting<boolean>("munching-policy-monster-strip-name");
    this.stripFlagData = stripFlagData ?? utils.getSetting<boolean>("munching-policy-monster-strip-flag-data");

    this.prepare();

    // copy source details from parent
    const oldSource = foundry.utils.getProperty(this, "ddbMonster.npc.system.details.source");
    if (oldSource) {
      foundry.utils.setProperty(this, "data.system.source", oldSource);
    }

    const source = foundry.utils.getProperty(this, "data.system.source");
    if (source) foundry.utils.setProperty(this.data, "system.source", source);

    this.actionData = {} as any;
    this.resetActionData();

  }

  damageModReplace(text: string) {
    let result;
    const diceParse = utils.parseDiceString(text);
    if (this.actionData.baseAbility) {
      const baseAbility = this.ddbMonster.abilities[this.actionData.baseAbility];
      const baseAbilityMod = utils.calculateModifier(baseAbility.value ?? 10);
      const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : 0;
      const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? " + @mod " : "";
      const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, useMod);
      result = reParse.diceString;
    } else {
      result = diceParse.diceString;
    }

    return result;
  }

  /** A bare "escape DC N" names no ability, so the shared outline offers Acrobatics or Athletics. */
  _generateEscapeCheck(hit: string) {
    const escape = hit.match(/escape DC ([0-9]+)/);
    if (escape) this.additionalActivities.push(DDBActivityFactoryMixin.escapeCheckOutline(escape[1]));
  }

  generateDamageInfo() {
    const hitIndex = this.strippedHtml.indexOf("Hit:");
    let hit = (hitIndex > 0)
      ? `${this.strippedHtml.slice(hitIndex)}`.trim()
      : `${this.strippedHtml}`.replace(this.fullName, "").trim();
    hit = hit.replace(/[–-–−]/g, "-");

    this.ddbMonsterDamage = new DDBMonsterDamage(hit, { ddbMonsterFeature: this });

    this.ddbMonsterDamage.generateDamage();
    this.ddbMonsterDamage.generateRegain();

    this.actionData.damageParts = this.ddbMonsterDamage.damageParts;
    this.actionData.versatileParts = this.ddbMonsterDamage.versatileParts;
    this.actionData.saveParts = this.ddbMonsterDamage.saveParts;
    this.actionData.healingParts = this.ddbMonsterDamage.healingParts;
    if (this.ddbMonsterDamage.levelBonus) this.levelBonus = true;
    if (this.ddbMonsterDamage.profBonus) this.profBonus = true;

    this._generateEscapeCheck(hit);

    if (this.ddbMonsterDamage.damageModeWarnings.length) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.monsterDamageWarnings", this.ddbMonsterDamage.damageModeWarnings);
    }

    // A renamed feat alternative occupies its original slot so later save/check IDs survive.
    if (this.#keepsDamageModeActivities && this.ddbMonsterDamage.replacesVersatile) this.#queueDamageModes();

    if (this.actionData.damageParts.length > 0 && this.templateType === "weapon") {
      this.actionData.damage.base = DDBMonsterFeature.weaponDamagePart(this.actionData.damageParts[0]);
    }
    if (this.#keepsDamageModeActivities && this.actionData.versatileParts.length > 0 && !this.enricher.noVersatile) {
      this.additionalActivities.push(this.#versatileOutline());
    }
  }

  /** "Versatile" unless the alternative names a condition a damage mode would ("Bloodied Attack"). */
  get #versatileName(): string {
    const condition = this.ddbMonsterDamage?.versatileCondition;
    return (condition ? monsterDamageModeName(condition) : null) ?? "Versatile";
  }

  /**
   * The alternative damage of an "or ... damage" hit as its own attack. A named alternative keeps
   * the id a Versatile activity would have, so links to it keep resolving.
   */
  #versatileOutline(): IAdditionalActivityOutline {
    const name = this.#versatileName;
    const condition = this.ddbMonsterDamage.versatileCondition;
    return {
      name,
      type: "attack",
      options: {
        generateDamage: true,
        damageParts: this.actionData.versatileParts,
        includeBaseDamage: false,
        ...(condition ? { activationCondition: condition } : {}),
        ...(name !== "Versatile"
          ? { data: { _id: utils.namedIDStub("Versatile", { prefix: "attack", postfix: this.additionalActivities.length }) } }
          : {}),
      },
    };
  }

  /**
   * Damage a hit deals on later turns ("takes 21 (6d6) acid damage at the start of each of its
   * turns") is its own activity at that turn boundary, not part of the hit. Queued last so the
   * ids of the activities before it do not move. A feature with an enricher that shapes its
   * activities is left to it: OngoingDamage, the swallow and attach enrichers build their own
   * later-turn damage, and an activity override would rename this one into a copy of the attack.
   */
  #queueRecurringDamage() {
    const damage = this.ddbMonsterDamage;
    if (!damage || damage.recurringParts.length === 0 || !this.enricher.addAutoAdditionalActivities) return;
    const override = this.enricher.activity;
    // a primaryOnly override (a placed zone's area) never reaches the extra activities
    const overridesExtras = !!override && override.primaryOnly !== true && Object.keys(override).length > 0;
    if ((this.enricher.additionalActivities ?? []).length > 0 || overridesExtras || this.enricher.type) return;
    this.additionalActivities.push({
      name: "Ongoing Damage",
      type: "damage",
      options: {
        generateDamage: true,
        damageParts: damage.recurringParts.map((part) => part.part),
        includeBaseDamage: false,
        generateConsumption: false,
        activationOverride: { type: damage.recurringTiming, value: null, condition: damage.recurringCondition },
      },
    });
  }

  /**
   * Later-turn damage is taken out of the hit parts, so when neither the Ongoing Damage activity
   * nor the feature's enricher rolls it (an enricher that sets a type or its own activities
   * declines the queue), the damage is on no activity at all. Recorded as a damage warning so the
   * monster audit reports it.
   */
  #warnUnbuiltRecurringDamage() {
    const damage = this.ddbMonsterDamage;
    if (!damage || damage.recurringParts.length === 0 || !("activities" in this.data.system)) return;
    const signature = (part: Partial<I5eDamagePart>) => JSON.stringify([
      part.number ?? null, part.denomination ?? null, part.bonus ?? "", part.custom?.formula ?? "",
      [...(part.types ?? [])].sort(),
    ]);
    const built = new Set(Object.values(this.data.system.activities ?? {})
      .flatMap((activity) => ("damage" in activity ? activity.damage?.parts : undefined) ?? [])
      .map((part) => signature(part)));
    const missing = damage.recurringParts.filter((part) => !built.has(signature(part.part)));
    if (missing.length === 0) return;
    damage.damageModeWarnings.push(
      `Later-turn damage not built (${missing.map((part) => part.damageString).join(", ")}): the enricher shapes this feature's activities`,
    );
    foundry.utils.setProperty(this.data, "flags.ddbimporter.monsterDamageWarnings", damage.damageModeWarnings);
  }

  /**
   * Dictionary natural weapons (Bite, Claw) drop the feature path's Versatile activity, so an
   * alternative such as "or 3 (1d6) piercing damage if the swarm has half of its hit points or
   * fewer" would be lost. It is queued last so the ids of the activities before it do not move.
   */
  #queueNaturalWeaponAlternative() {
    if (this.#keepsDamageModeActivities || this.weaponLookup?.weaponType !== "natural") return;
    if (!this.enricher.addAutoAdditionalActivities || this.enricher.noVersatile) return;
    if (this.actionData.versatileParts.length === 0) return;
    this.additionalActivities.push(this.#versatileOutline());
  }

  /** New modes append after existing outlines; replacements are queued in the old versatile slot. */
  #queueDamageModes() {
    if (this.#damageModeQueued || !this.enricher.addAutoAdditionalActivities || this.enricher.noVersatile) return;
    this.#damageModeQueued = true;
    for (const mode of this.ddbMonsterDamage.damageModes) {
      this.additionalActivities.push({
        name: mode.name,
        type: "attack",
        options: {
          generateDamage: true,
          includeBaseDamage: false,
          activationCondition: mode.condition,
          // Take the id and slot a versatile activity would have, so links to it keep resolving.
          ...(this.#keepsDamageModeActivities && this.ddbMonsterDamage.replacesVersatile ? {
            data: { _id: utils.namedIDStub("Versatile", { prefix: "attack", postfix: this.additionalActivities.length }) },
          } : {}),
          damageParts: mode.damageParts.map((part) => SystemHelpers.buildDamagePart({
            damageString: part.damageString, types: part.damageTypes,
          })),
        },
      });
    }
  }

  getActionType(): TActivationCost {
    let action: TActivationCost;
    // villain is not a real activation cost; the villain case is rewritten below
    action = `${this.type}` as TActivationCost;
    const actionAction = this.strippedHtml.toLowerCase().match(/as (a|an) action/);
    const bonusAction = this.strippedHtml.toLowerCase().match(/as a bonus action/);
    const reAction = this.strippedHtml.toLowerCase().match(/as a reaction/);
    // e.g. mephit death
    const deathDie = this.strippedHtml.toLowerCase().match(/(creature|target|it) dies/);
    if (bonusAction) {
      action = "bonus";
    } else if (reAction) {
      action = "reaction";
    } else if (deathDie) {
      action = "special";
    } else if (actionAction) {
      action = "action";
    }
    const startOfTurn = this.strippedHtml.toLowerCase().match(/at the start of each of its turn|at the start of its turn/i);
    if (this.type === "special" && startOfTurn) {
      action = "turnStart";
    }
    if (this.type === "lair") action = "lair";
    else if (this.type === "mythic") action = "mythic";
    else if (this.type === "villain") action = "special";
    else if (this.type === "legendary") action = "legendary";
    return action;
  }


  #matchRecharge(): RegExpMatchArray | null {
    const matches = this.fullName.toLowerCase().match(/(?:\(|; )recharge ([0-9––−-]+)\)/);
    return matches;
  }

  #getRechargeRecovery(): I5eSystemLimitedUsesRecovery | undefined {
    const matches = this.isRecharge;
    if (!matches) return undefined;
    const value = matches[1].replace(/[––−-]/, "-").split("-").shift();
    return {
      period: "recharge",
      formula: value,
      type: "recoverAll",
    };
  }


  getUses(name = false) {
    const uses: I5eSystemLimitedUses & { recovery: I5eSystemLimitedUsesRecovery[] } = {
      spent: null,
      max: null,
      recovery: [],
    };

    const recovery: I5eSystemLimitedUsesRecovery = {
      period: "",
      type: "recoverAll",
      formula: undefined,
    };

    const usesSearch = name ? /(\d+)\/(\w+)\)/ : /\((\d+)\/(\w+)\)/;
    const matchString = name
      ? this.titleHTML
        ? this.titleHTML
        : this.name
      : this.strippedHtml;
    const usesMatch = matchString.match(usesSearch);
    if (usesMatch && usesMatch[2].toLowerCase() !== "turn") {
      uses.spent = 0;
      uses.max = `${usesMatch[1]}`;
      recovery.period = "day";
      const perMatch = DICTIONARY.monsters.resets.find((reset) => reset.id === usesMatch[2]);
      if (perMatch && perMatch.value) recovery.period = perMatch.value;
    } else {
      const shortLongRegex = (/Recharges after a (Short or Long|Long) Rest/i);
      const rechargeMatch = matchString.match(shortLongRegex);
      if (rechargeMatch) {
        recovery.period = rechargeMatch[1] === "Long" ? "lr" : "sr";
        uses.max = "1";
      }
    }

    if (recovery.period) {
      uses.recovery.push(recovery);
    }

    const recharge = this.#getRechargeRecovery();
    if (recharge) {
      uses.recovery.push(recharge);
      if (uses.max === null) uses.max = "1";
      uses.spent = 0;
      this.actionData.consumptionValue = "1";
    }

    // if (!name && uses.max === null && uses.recovery.length === 0) {
    //   return this.getUses(true);
    // }

    return uses;
  }

  getActivationValue() {
    const matches = this.strippedHtml.match(/\(costs ([0-9]+) actions\)/i);
    if (matches) return parseInt(matches[1]);
    const nameMatch = this.name.match(/\(costs ([0-9]+) actions\)/i);
    if (nameMatch) return parseInt(nameMatch[1]);
    return null;
  }

  getActivation(): I5eActivityActivation {
    const activation: I5eActivityActivation = foundry.utils.deepClone(this.actionData.activation);
    activation.value = this.getActivationValue() ?? undefined;
    activation.type = this.getActionType();
    return activation;
  }

  getFeatSave() {
    this.actionData.save = this.descriptionSave;
    return this.actionData.save;
  }

  getReach(): number | null {
    const reachSearch = /reach\s*(\s*\d+\s*)\s*ft/;
    const match = this.strippedHtml.match(reachSearch);
    if (!match) return null;
    const value = parseInt(match[1].trim());
    if (value === 5) return null;
    return value;
  }

  getRange(): I5eWeaponRange {
    const range: I5eWeaponRange = {
      value: null,
      long: null,
      units: "",
      reach: this.getReach(),
    };

    const rangeSearch1 = /range\s*(\d+)\s*\/\s*(\d+)\s*ft/;
    const rangeSearch2 = /range\s*(\d+)\s*ft[.]*\s*\/\s*(\d+)\s*ft/;
    const rangeSearch3 = /range\s*(\d+)\s*(:?ft|feet)/;
    const reachSearch = /reach\s*(\d+)\s*(:?ft|feet)/;
    const withinSearch = /within\s*(\d+)\s*(:?ft|feet)/;

    const matches1 = this.strippedHtml.match(rangeSearch1);
    const matches2 = this.strippedHtml.match(rangeSearch2);
    const matches3 = this.strippedHtml.match(rangeSearch3);
    const reachMatch = this.strippedHtml.match(reachSearch);
    const withinMatch = this.strippedHtml.match(withinSearch);

    if (matches1) {
      range.value = parseInt(matches1[1]);
      range.long = parseInt(matches1[2]);
      range.units = "ft";
    } else if (matches2) {
      range.value = parseInt(matches2[1]);
      range.long = parseInt(matches2[2]);
      range.units = "ft";
    } else if (matches3) {
      range.value = parseInt(matches3[1]);
      range.units = "ft";
    } else if (reachMatch) {
      const value = parseInt(reachMatch[1]);
      if (this.templateType === "weapon") {
        if (value > 5) this.actionData.properties.rch = true;
        range.reach = value;
      } else {
        range.value = value;
      }
      range.units = "ft";
    } else if (withinMatch) {
      range.value = parseInt(withinMatch[1]);
      range.units = "ft";
    } else {
      if (this.meleeAttack) {
        range.value = 5;
        range.units = "ft";
      }
    }

    return range;
  }

  checkAbility(abilitiesToCheck: T5eAbility[]) {
    const result: { success: boolean; ability: T5eAbility | null; proficient: boolean | null } = {
      success: false,
      ability: null,
      proficient: null,
    };

    for (const ability of abilitiesToCheck) {
      const monsterAbility = this.ddbMonster.abilities[ability];
      const abilityMod = utils.calculateModifier(monsterAbility.value ?? 10);
      if (this.toHit == (this.ddbMonster.proficiencyBonus ?? 0) + abilityMod) {
        result.success = true;
        result.ability = ability;
        result.proficient = true;
        break;
      } else if (this.toHit == abilityMod) {
        result.success = true;
        result.ability = ability;
        result.proficient = false;
        break;
      }
    }

    return result;
  }

  /** Sort comparator putting proficient ability readings before non-proficient ones. */
  static #byProficiency(a: { proficient: boolean | null }, b: { proficient: boolean | null }): number {
    return Number(b.proficient === true) - Number(a.proficient === true);
  }

  checkAbilities(abilitiesToCheck: T5eAbility[], negatives = false) {
    const results = abilitiesToCheck.map((ability) => {
      const result: {
        success: boolean;
        ability: T5eAbility;
        proficient: boolean | null;
        bonus: number;
      } = {
        success: false,
        ability,
        proficient: null,
        bonus: 0,
      };
      const monsterAbility = this.ddbMonster.abilities[ability];
      const abilityMod = utils.calculateModifier(monsterAbility.value ?? 10);
      if (this.toHit > (this.ddbMonster.proficiencyBonus ?? 0) + abilityMod) {
        result.success = true;
        result.proficient = true;
        result.bonus = this.toHit - (this.ddbMonster.proficiencyBonus ?? 0) - abilityMod;
      } else if (this.toHit > abilityMod) {
        result.success = true;
        result.proficient = false;
        result.bonus = this.toHit - abilityMod;
      } else if (negatives) {
        result.success = true;
        result.proficient = false;
        result.bonus = this.toHit - abilityMod;
      }
      return result;
    });

    return results;
  }


  generateWeaponAttackInfo() {
    const abilities: T5eAbility[] = ["str", "dex", "int", "wis", "cha", "con"];
    let initialAbilities: T5eAbility[];
    let weaponAbilities: T5eAbility[] = ["str", "dex"];
    const spellAbilities: T5eAbility[] = ["cha", "wis", "int"];

    // we have a weapon name match so we can infer a bit more
    const weaponLookup = this.weaponLookup;
    if (weaponLookup) {
      for (const [key, value] of Object.entries(weaponLookup.properties)) {
        // logger.info(`${key}: ${value}`);
        (this.actionData.properties as Record<string, any>)[key] = value;
      }
      const strMod = utils.calculateModifier(this.ddbMonster.abilities["str"].value ?? 10);
      const dexMod = utils.calculateModifier(this.ddbMonster.abilities["dex"].value ?? 10);
      const versatileWeapon = this.actionData.properties.ver && dexMod > strMod;
      // weapons read from the attack's text keep a feature's choice of both abilities, so the
      // printed to-hit decides (a finesse "+1 Rapier", a thrown rock, a sprite's tiny sword)
      if (this.#derivedWeapon) {
        weaponAbilities = ["str", "dex"];
      } else if (versatileWeapon || weaponLookup.actionType == "rwak") {
        weaponAbilities = ["dex"];
      } else if (weaponLookup.actionType == "mwak") {
        weaponAbilities = ["str"];
      }
      this.actionData.weaponType = weaponLookup.weaponType;

      const characterWeapon = DICTIONARY.actor.proficiencies.find((w) => w.name === weaponLookup.name);
      if (characterWeapon) {
        if (characterWeapon?.ammunitionType) {
          foundry.utils.setProperty(this.data, "system.ammunition.type", characterWeapon.ammunitionType);
        }
        if (characterWeapon?.mastery) {
          foundry.utils.setProperty(this.data, "system.mastery", characterWeapon.mastery);
        }
        if (characterWeapon?.foundryValue) {
          this.actionData.baseWeapon = characterWeapon.foundryValue;
          foundry.utils.setProperty(this.data, "system.type.baseItem", characterWeapon.foundryValue);
        }
      }

    } else if (this.meleeAttack) {
      this.actionData.weaponType = "simpleM";
    } else if (this.rangedAttack) {
      this.actionData.weaponType = "simpleR";
    }

    // the attack activity leaves a "Melee or Ranged" weapon at the Default attack type, and dnd5e
    // only offers the ranged (Thrown) attack mode on a typed weapon with the thrown property
    if (this.templateType === "weapon" && this.weaponAttack && this.meleeAttack && this.rangedAttack) {
      this.actionData.properties.thr = true;
    }

    if (this.strippedHtml.includes("is a magic weapon attack")) {
      this.actionData.properties["mgc"] = true;
      foundry.utils.setProperty(this.data, "flags.midiProperties.magicdam", true);
    }

    if (this.spellAttack) {
      initialAbilities = spellAbilities;
    } else if (this.weaponAttack) {
      initialAbilities = weaponAbilities;
    } else {
      initialAbilities = abilities;
    }

    // force companions to null and proficient
    if (this.yourSpellAttackModToHit) {
      this.actionData.baseAbility = null;
      this.actionData.proficient = true;
    } else if (this.weaponAttack || this.spellAttack) {
      // check most likely initial attacks - str and dex based weapon, mental for spell
      const checkInitialAbilities = this.checkAbility(initialAbilities);
      if (checkInitialAbilities.success) {
        this.actionData.baseAbility = checkInitialAbilities.ability;
        this.actionData.proficient = checkInitialAbilities.proficient ?? false;
      }

      // okay lets see if its one of the others then! A "+1 Handaxe" names its bonus, so its
      // to-hit only matches another ability by accident; the magic bonus check below finds it.
      if (!this.actionData.baseAbility && !this.#bonusWeapon) {
        const checkAllAbilities = this.checkAbility(abilities);
        if (checkAllAbilities.success) {
          this.actionData.baseAbility = checkAllAbilities.ability;
          this.actionData.proficient = checkAllAbilities.proficient ?? false;
        }
      }

      // okay, some oddity, maybe magic bonus, lets calculate one!
      // we are going to assume it's dex or str based.
      if (!this.actionData.baseAbility) {
        const magicAbilities = this.checkAbilities(initialAbilities);

        // proficient readings first, then the smallest unexplained bonus
        const filteredAbilities = magicAbilities.filter((ab) => ab.success == true)
          .sort((a, b) => DDBMonsterFeature.#byProficiency(a, b) || a.bonus - b.bonus);

        // fine lets use the first hit
        if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
          this.actionData.baseAbility = filteredAbilities[0].ability;
          this.actionData.proficient = filteredAbilities[0].proficient ?? false;
          this.actionData.extraAttackBonus = filteredAbilities[0].bonus;
        }
      }

      // negative mods!
      if (!this.actionData.baseAbility) {
        logger.info(`Negative ability parse for ${this.ddbMonster.npc.name}, to hit ${this.toHit} with ${this.name}`);

        const magicAbilities = this.checkAbilities(initialAbilities, true);

        // proficient readings first, then the penalty closest to zero
        const filteredAbilities = magicAbilities.filter((ab) => ab.success == true)
          .sort((a, b) => DDBMonsterFeature.#byProficiency(a, b) || b.bonus - a.bonus);
        logger.debug("Filtered abilities", { filteredAbilities, html: this.strippedHtml });
        // fine lets use the first hit
        if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
          this.actionData.baseAbility = filteredAbilities[0].ability;
          this.actionData.proficient = filteredAbilities[0].proficient ?? false;
          this.actionData.extraAttackBonus = filteredAbilities[0].bonus;
        } else {
          logger.error("Unable to calculate attack!", { filteredAbilities, html: this.strippedHtml, ddbFeature: this });
        }
      }
    }
  }

  _targetsCreature() {
    const matchText = this.strippedHtml.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
    const creature = /You touch (?:a|one) (?:willing |living )?creature|target(?:\w+) (\w*) creature within|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range|each creature within/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /attack against the target|at a target in range/gi;
    return matchText.match(creature)
      || matchText.match(creaturesRange)
      || matchText.match(targets);
  }


  /**
   * Derive an activity target from rules text, by default the whole feature.
   *
   * A multi-mode feature passes one section at a time: an eye ray table's Disintegration Ray
   * mentions a "10-foot cube" of an object, and read over the whole feature that cube would land
   * on every ray. `mutateRange` is off for a section so a "within N feet of you" match cannot
   * rewrite the feature's own range.
   */
  getTarget({ text = this.strippedHtml, mutateRange = true }: { text?: string; mutateRange?: boolean } = {}): I5eActivityTarget {
    // fully populated template/affects so the narrowing survives the regex branches below
    const target: I5eActivityTarget & {
      template: NonNullable<I5eActivityTarget["template"]>;
      affects: NonNullable<I5eActivityTarget["affects"]>;
    } = {
      template: {
        count: "",
        contiguous: false,
        type: "", // line
        size: "", // 60
        width: "",
        height: "",
        units: "ft", // ft
      },
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      prompt: true,
      override: false,
    };

    // 90-foot line that is 10 feet wide
    // in a 90-foot cone
    const matchText = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
    // console.warn(matchText);
    // 2024 stat blocks: "each creature in a 90-foot-long, 5-foot-wide Line" (DDB sometimes breaks
    // the hyphenation as "5-foot- wide")
    const lineSearch = /(\d+)-foot-long,? (\d+)-foot-? ?wide line|(\d+)-foot line|line that is (\d+) feet/i;
    const coneSearch = /(\d+)-foot cone/i;
    // "disintegrates a 10-foot cube of it" is how much of an object is destroyed, not an area
    const cubeSearch = /(\d+)-foot cube(?! of it\b)/i;
    const sphereSearch = /(\d+)-foot-radius sphere/i;
    // "each creature within 10 feet of that point" before any "within 500 feet of it" placement range
    const pointSearch = new RegExp(`\\b(?:each|all|every|any)\\b[^.]{0,60}?${DDBDescriptions.POINT_AREA_EXPRESSION.source}`, "i");
    // "a 5-foot-radius geyser" names no shape; it is shaped by where it is placed
    const unnamedRadiusSearch = /(\d+)-foot-radius (?!sphere|cylinder|emanation|circle|hemispher)[a-z]/i;

    const coneMatch = matchText.match(coneSearch);
    const lineMatch = matchText.match(lineSearch);
    const cubeMatch = matchText.match(cubeSearch);
    const sphereMatch = matchText.match(sphereSearch);
    const pointMatch = matchText.match(pointSearch);
    const unnamedRadiusMatch = matchText.match(unnamedRadiusSearch);

    const creatureTargetCount = (/(each|one|a|the) creature(?: or object)?/ig).exec(matchText);
    const creatureCountWord = creatureTargetCount?.[1]?.toLowerCase() ?? "";
    const singleCreatureWord = ["one", "a", "the"].includes(creatureCountWord);

    if (coneMatch) {
      target.template.size = coneMatch[1];
      target.template.units = "ft";
      target.template.type = "cone";
    } else if (lineMatch) {
      target.template.size = lineMatch[1] ?? lineMatch[3] ?? lineMatch[4];
      if (lineMatch[2]) target.template.width = lineMatch[2];
      target.template.units = "ft";
      target.template.type = "line";
    } else if (cubeMatch) {
      target.template.size = cubeMatch[1];
      target.template.units = "ft";
      target.template.type = "cube";
    } else if (sphereMatch) {
      target.template.size = sphereMatch[1];
      target.template.units = "ft";
      target.template.type = "sphere";
    } else if (pointMatch) {
      target.template.size = pointMatch[1];
      target.template.units = "ft";
      target.template.type = "sphere";
    } else if (unnamedRadiusMatch && DDBDescriptions.unnamedRadiusShape(matchText) !== "radius") {
      target.template.size = unnamedRadiusMatch[1];
      target.template.units = "ft";
      target.template.type = DDBDescriptions.unnamedRadiusShape(matchText);
    } else {
      const aoeSizeRegex = /(?<!creatures? (?:it|you) can see |targets? (?:it|you) can see |objects? (?:it|you) can see |one creature |a creature |the creature |that creature )(?:within|in a|fills a) (\d+)(?: |-)(?:feet|foot|ft|ft\.)(?: |-)(cone|radius|emanation|sphere|line|cube|of it|of an|of the|of you|of yourself)(\w+[. ])?/ig;

      // each creature that isn’t an Undead in a 20-foot Emanation originating from the lich.
      const aoeSizeMatch = aoeSizeRegex.exec(matchText);

      // console.warn(`Target generation for ${this.name}`, {
      //   aoeSizeMatch,
      // });

      // A single-target ability (e.g. "one creature ... within 30 feet") must not
      // gain an area template from a loose positional match like "control while
      // within 60 feet of it". Emanations ("each creature within X feet of it")
      // and real named shapes are unaffected.
      const singleCreatureTarget = singleCreatureWord && !(/each creature/i).test(matchText);

      if (aoeSizeMatch) {
        const type = aoeSizeMatch[3]?.trim() ?? aoeSizeMatch[2]?.trim() ?? "radius";
        const realShape = ["cone", "radius", "sphere", "line", "cube"].includes(type);
        if (mutateRange && aoeSizeMatch[2] && aoeSizeMatch[2].trim() === "of you") {
          this.actionData.range.units = "self";
        }
        if (realShape || !singleCreatureTarget) {
          target.template.type = realShape ? type as TTemplate : "radius";
          target.template.size = aoeSizeMatch[1] ?? "";
          target.template.units = "ft";
        }
      }
    }

    if (target.template.type === "" && this.healingAction) {
      target.affects.type = "self";
    }

    const targetsCreature = this._targetsCreature();
    if (targetsCreature || creatureTargetCount) {
      target.affects.count = singleCreatureWord ? "1" : "";
      target.affects.type = creatureTargetCount && creatureTargetCount[2] ? "creatureOrObject" : "creature";
    }

    if (target.affects.type === "" && this.meleeAttack) {
      target.affects.type = "creature";
      target.affects.count = "1";
    }

    return target;
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


  #processMultiAttack(description: string) {
    if (this.is2014) return description;

    const actionNames = new Set<string>();
    const extractActions = ((str: string) => {
      return str
        .replace("many Bite", "Bite")
        .replace("if available", "")
        .replace("attacks. It can replace one attack with a ", ",")
        .replace(". It can replace one attack with a use of", ",")
        .replaceAll("and one with its", "")
        .replaceAll("one with its", "")
        .replace("attack and one ", ",")
        .replace("attack, one ", ",")
        .replace("attack, two ", ",")
        .replace("attack, and one ", ",")
        .replace("attacks, and one ", ",")
        .replace("attacks and one ", ",")
        .replace("attack and two ", ",")
        .replace("attacks or two ", ",")
        .replace("attack and three other ", ",")
        .replace("attack and three ", ",")
        .replace("attacks or four ", ",")
        .replace("attacks or five ", ",")
        .replaceAll(", or ", ",")
        .replaceAll(" or ", ",")
        .split(",")
        .map((s) => s.trim());
    });

    const handleReplaceNames = ((str: string) => {
      const replaceNames = extractActions(str);
      // console.warn("Replace names", replaceNames);
      for (const name of replaceNames) {
        const listNameRegex = /\(\w\) (.*)/i;
        const listNameMatch = listNameRegex.exec(name);

        if (listNameMatch) {
          const listName = listNameMatch[1];

          if (listName.includes("Spellcasting")) actionNames.add("Spellcasting");
          else actionNames.add(listName.split("(")[0].trim());
        } else if (name.includes("Spellcasting")) {
          actionNames.add("Spellcasting");
        } else {
          actionNames.add(name.trim());
        }
      }
    });

    const orMakesRegex = /The (?:.*) makes (\w+) (?<attackNames>.*) attack, or it makes (\w+) (?<replaceName>.*?) attacks/i;
    const orMakesMatch = orMakesRegex.exec(this.strippedHtml);

    const multRegex = /The (?:.*) makes (\w+) attacks, using (?<attackNames>.*:?)( in any combination(?:, and( it)? uses (?<attackNames2>.*)\.)?)/i;
    const multiMatch = multRegex.exec(this.strippedHtml);
    const basicMARegex = /The (?:.*) makes (\w+) (?<attackNames>.*:?) attacks?(?:(?: and uses|, and it can use) (?<attackNames2>.*))\./i;
    const basicMAMatch = basicMARegex.exec(this.strippedHtml);

    const simpleMARegex = /The (?:.*) makes (\w+) attacks: (?<attackNames>.*:?)\./i;
    const simpleMAMatch = simpleMARegex.exec(this.strippedHtml);

    const makesAttRegex = /The (?:.*) makes (\w+) (?<attackNames>.*?) attacks(, or it makes three (?<attackNames2>.*) attacks| and| as| or uses (?<attackNames3>.*?)(?:\.| (twice|three))|, using (?<attackNames4>.*?) in any combination|\.)/i;
    const makesAttMatch = makesAttRegex.exec(this.strippedHtml);

    const fallbackMakesOrRegex = /The (?:.*) makes (\w+) (?<attackNames>.*?) attack, and it uses (?<attackNames2>.*?)\./i;
    const fallbackMakesOrMatch = fallbackMakesOrRegex.exec(this.strippedHtml);

    const superFallbackRegex = /The (?:.*) makes (\w+) (?<attackNames>.*:?) attacks?/i;
    const superFallbackMatch = superFallbackRegex.exec(this.strippedHtml);

    const match = orMakesMatch
      ?? multiMatch
      ?? basicMAMatch
      ?? simpleMAMatch
      ?? makesAttMatch
      ?? fallbackMakesOrMatch
      ?? superFallbackMatch;

    const matchedGroups = match?.groups;
    if (matchedGroups) {
      const attackNames: string[] = [];
      if (matchedGroups.attackNames) attackNames.push(matchedGroups.attackNames);
      if (matchedGroups.attackNames2) attackNames.push(matchedGroups.attackNames2);
      if (matchedGroups.attackNames3) attackNames.push(matchedGroups.attackNames3);
      if (matchedGroups.attackNames4) attackNames.push(matchedGroups.attackNames4);
      if (matchedGroups.replaceName) attackNames.push(matchedGroups.replaceName);
      for (const attackNameString of attackNames) {
        handleReplaceNames(attackNameString);
      }
    }

    const replaceRegex = /It can replace (?:\w+|the (?:\w+)) attacks? with a use of (?<replaceName>.*?)\./i;
    const replaceRegex2 = /It can replace (?:\w+|the (?:\w+)) attacks? with a (?<replaceName>.*?) attack\./i;
    const replaceMatch = replaceRegex.exec(this.strippedHtml) ?? replaceRegex2.exec(this.strippedHtml);
    if (replaceMatch?.groups) {
      handleReplaceNames(replaceMatch.groups.replaceName);
    }

    const andRegex = /The (?:.*) can use its (?<attackNames>.*) and makes/i;
    const andMatch = andRegex.exec(this.strippedHtml);
    if (andMatch?.groups) {
      handleReplaceNames(andMatch.groups.attackNames);
    }

    const andCanRegex = /(?:and can use|It also uses|and it uses|and it can use) (?<attackNames>.*)\./i;
    const andCanMatch = andCanRegex.exec(this.strippedHtml);
    if (andCanMatch?.groups) {
      handleReplaceNames(andCanMatch.groups.attackNames);
    }

    const ifItUsedRegex = /if it used (?<attackNames>.*) this turn/i;
    const ifItUsedMatch = ifItUsedRegex.exec(this.strippedHtml);
    if (ifItUsedMatch?.groups) {
      handleReplaceNames(ifItUsedMatch.groups.attackNames);
    }

    const usesRegex = /The (?:.*) uses (?<attackNames>.*?)(?:\.| twice| three| four| five)/i;
    const usesMatch = usesRegex.exec(this.strippedHtml);
    if (usesMatch?.groups) {
      handleReplaceNames(usesMatch.groups.attackNames);
    }

    if (CONFIG.DDBI.DEV.multiattackNotes) {
      if (actionNames.size === 0) {
        const noMultiattack = CONFIG.DDBI.NO_MULTIATTACK ?? [];
        const noMultiattackDetails = CONFIG.DDBI.NO_MULTIATTACK_DETAILS ?? [];
        CONFIG.DDBI.NO_MULTIATTACK = noMultiattack;
        CONFIG.DDBI.NO_MULTIATTACK_DETAILS = noMultiattackDetails;
        noMultiattack.push(this.strippedHtml);
        noMultiattackDetails.push({ actionNames, name: this.ddbMonster.name, html: this.strippedHtml, match, is2014: this.is2014 });
      } else {
        const multiattackMatches = CONFIG.DDBI.MULTIATTACK_MATCHES ?? [];
        const multiattackMatchesDetails = CONFIG.DDBI.MULTIATTACK_MATCHES_DETAILS ?? [];
        CONFIG.DDBI.MULTIATTACK_MATCHES = multiattackMatches;
        CONFIG.DDBI.MULTIATTACK_MATCHES_DETAILS = multiattackMatchesDetails;
        multiattackMatches.push(actionNames);
        multiattackMatchesDetails.push({ actionNames, name: this.ddbMonster.name, html: this.strippedHtml, match, is2014: this.is2014 });

      }
    }


    // console.warn(`${this.ddbMonster.name}`,{
    //   orMakesMatch,
    //   basicMAMatch,
    //   multiMatch,
    //   simpleMAMatch,
    //   makesAttMatch,
    //   fallbackMakesOrMatch,
    //   match,
    //   strippedHtml: this.strippedHtml,
    //   is2014: this.is2014,
    //   this: this,
    //   actionNames,
    // });

    for (const actionName of actionNames) {
      description = description.replaceAll(actionName, `[[/item ${actionName}]]`);
    }
    return description;
  }

  async #generateDescription() {
    this.html = this.html.replace(/<strong> \.<\/strong>/, "").trim().replaceAll("<strong></strong>", "").replaceAll("<em></em>", "");
    let description = this.hideDescription ? this.#getHiddenDescription() : `${this.html}`;
    description = description.replaceAll("<em><strong></strong></em>", "");
    if (this.originalName === "Multiattack") {
      description = this.#processMultiAttack(description);
    }
    description = await DDBReferenceLinker.parseMonsterDescription({
      text: description,
      document: this.data,
      actor: this.ddbMonster.npc,
    });

    this.data.system.description.value = await DDBTable.generateTable({
      parentName: this.ddbMonster.npc.name,
      html: description,
      updateExisting: this.updateExisting,
      sourceBook: this.data.system?.source?.book ?? this.ddbMonster.npc.system?.source?.book,
      notifier: this.notifier,
    });
    await this._linkActivityDescriptions();
    this.data.system.description.value = `<div class="ddb">
${this.data.system.description.value}
</div>`;


  }

  /**
   * Enrichers that split a feature into per-activity chunks (e.g. Eye Rays, and anything else
   * that carves the description up) set those chunks as raw DDB html. Give them the same
   * reference linking the feature description gets - DDB anchors, damage and attack rolls,
   * tags - so a ray's card reads like the feature does.
   * Tables are deliberately not generated per activity: the journal they create belongs to the feature.
   */
  async _linkActivityDescriptions(): Promise<void> {
    for (const activity of Object.values(this.data.system.activities ?? {})) {
      const text = activity.description?.value;
      if (!text?.trim()) continue;
      activity.description!.value = await DDBReferenceLinker.parseMonsterDescription({
        text,
        document: this.data,
        actor: this.ddbMonster.npc,
      });
    }
  }

  #buildAction() {
    if (Number.isInteger(parseInt(String(this.actionData.activation.value)))) {
      this.actionData.consumptionValue = this.actionData.activation.value ?? null;
    } else {
      this.actionData.activation.value = 1;
    }

    if (this.templateType === "weapon") {
      this.weaponData.system.damage = this.actionData.damage;
    }

    if ("proficient" in this.data.system) {
      this.data.system.proficient = this.actionData.proficient;
    }

    if (this.templateType === "weapon" && (this.weaponAttack || this.spellAttack)) {
      this.weaponData.system.equipped = true;
    }

    if (this.weaponAttack && this.templateType === "weapon") {
      if (this.actionData.weaponType) {
        this.data.system.type.value = this.actionData.weaponType;
      }
    } else if (this.spellAttack) {
      // if (!this.meleeAttack && !this.rangedAttack) {
      //   this.activityType = "save";
      // }
      // if (this.templateType === "feat") {
      //   this.data.system.equipped = true;
      // }
      foundry.utils.setProperty(this.data, "flags.midiProperties.magicdam", true);
      foundry.utils.setProperty(this.data, "flags.midiProperties.magiceffect", true);
      this.actionData.properties.mgc = true;
    }

    if (this.templateType === "weapon") {
      this.weaponData.system.damage = this.actionData.damage;
      this.weaponData.system.range = this.actionData.range;
    }
    this.data.system.uses = this.actionData.uses;

    for (const [key, value] of Object.entries(this.actionData.properties) as [(TWeaponProperties | TFeatProperties), boolean][]) {
      if (value) (this.data.system.properties as (TWeaponProperties | TFeatProperties)[]).push(key);
    }

    if (this.name.includes("/Day") || this.name.includes("Recharges")) {
      this.data.system.uses = this.getUses(true);
    }

    return this.data;
  }

  #buildLair() {
    this.actionData.activation.type = "lair";
    if (this.data.name.trim() === "Lair Actions") {
      this.actionData.activation.value = 1;
    } else if (this.data.name.trim() === "Regional Effects") {
      this.actionData.activation.type = "none";
    }
    return this.data;
  }

  #buildLegendary() {
    if (this.isBlockSummary) {
      this.activityType = "none";
      this.actionData.activation.type = "none";
      return;
    }

    this.actionData.activation.type = "legendary";

    this.actionData.consumptionTargets.push({
      type: "attribute",
      target: "resources.legact.value",
      value: this.actionData.activation.value ?? 1,
      scaling: {
        mode: "",
        formula: "",
      },
    });

    if (Number.isInteger(parseInt(String(this.actionData.activation.value)))) {
      this.actionData.consumptionValue = this.actionData.activation.value ?? null;
    } else {
      // this.data.system.activation.cost = 1;
      this.actionData.activation.value = 1;
    }

    // only attempt to update these if we don't parse an action
    // most legendary actions are just do x thing, where thing is an existing action
    // these have been copied from the existing actions so we don't change
    if (!this.actionCopy) {
      this.data.system.uses = this.actionData.uses;
      if (this.templateType === "weapon") {
        this.weaponData.system.damage = this.actionData.damage;
        this.weaponData.system.range = this.actionData.range;
      }
    } else {
      for (const id of Object.keys(this.data.system.activities)) {
        const activity = this.data.system.activities[id];
        // damage on the target's later turns is not the legendary action, and spends nothing
        if (["turnStart", "turnEnd"].includes(activity.activation?.type ?? "")) continue;
        // A copied attack keeps its eligibility condition when it becomes legendary.
        activity.activation = {
          ...foundry.utils.deepClone(this.actionData.activation),
          condition: activity.activation?.condition || this.actionData.activation.condition,
        };
        const consumption = activity.consumption;
        if (consumption) consumption.targets = this.actionData.consumptionTargets;
      }
    }

  }

  #buildSpecial() {
    if (Number.isInteger(parseInt(String(this.actionData.activation.value)))) {
      this.actionData.consumptionValue = this.actionData.activation.value ?? null;
    } else {
      this.actionData.activation.value = 1;
    }

    this.data.system.uses = this.actionData.uses;

    if (this.templateType === "weapon") {
      this.weaponData.system.damage = this.actionData.damage;
      this.weaponData.system.range = this.actionData.range;
    }

    // legendary resistance check
    if (this.isLegendaryResistance) {
      this.actionData.activation.type = "special";
      this.actionData.activation.value = null;
      this.actionData.activation.condition = "Fails a saving throw";
      this.actionData.consumptionTargets.push({
        type: "attribute",
        target: "resources.legres.value",
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
      this.data.system.uses = {
        max: null,
        spent: null,
      };
    }

    // if this special action has nothing to do, then we remove the activation type
    // if (this.activityType === null
    //   && (this.data.system.uses.max === null || this.data.system.uses.max === 0)
    //   // TODO: ensure this is now correct
    //   && this.data.system.uses.recovery.length === 0
    // ) {
    //   this.actionData.activation = {
    //     value: null,
    //     type: "",
    //     condition: "",
    //   };
    // }
  }

  /**
   * The "Villain Actions" or "Legendary Actions" item that carries the whole block's text. Each
   * option ("Action 1: ...", "Terrorize") is also its own item with its own activities, so this one
   * is a description only: activities and effects built from the combined text repeated the
   * per-option ones, and where an option asks for two saves kept only the first.
   */
  get isBlockSummary(): boolean {
    return (this.type === "villain" && this.name === "Villain Actions")
      || (this.type === "legendary" && this.name === "Legendary Actions");
  }

  /**
   * "She can take each action once during an encounter after an enemy's turn": the rule sits in
   * the block's preamble, which only the summary item carries.
   */
  get #villainActionOncePerEncounter(): boolean {
    const block = utils.stripHtml(this.ddbMonster.featureFactory.html.villain);
    return (/\beach action once during an encounter\b/i).test(block);
  }

  #buildVillain() {
    if (this.isBlockSummary) {
      this.activityType = "none";
      this.actionData.activation.type = "none";
      return;
    }
    // dnd5e recovers "initiative" uses when initiative is rolled, so each action is ready again
    // at the start of the next encounter
    this.data.system.uses = this.#villainActionOncePerEncounter
      ? { spent: 0, max: "1", recovery: [{ period: "initiative", type: "recoverAll", formula: undefined }] }
      : {
        spent: 0,
        max: this.actionData.uses.max ? `${this.actionData.uses.max}` : null,
        recovery: [
          { period: "sr", type: "recoverAll", formula: undefined },
        ],
      };

    if (this.templateType === "weapon") {
      this.weaponData.system.damage = this.actionData.damage;
      this.weaponData.system.range = this.actionData.range;
    }

  }

  #generateActionData() {
    if (this.weaponAttack || this.spellAttack) {
      this.generateWeaponAttackInfo();
    }
    this.generateDamageInfo();

    this.actionData.range = this.getRange();
    this.actionData.activation = this.getActivation();
    this.actionData.save = this.getFeatSave();
    this.actionData.target = this.getTarget();
    this.actionData.uses = this.getUses();
  }

  /**
   * The damage the feature's own save names: its first section's on a multi-mode feature (or a
   * lair's one save option's, as River's Fury's cold is no part of Phantasmal Mist), or, for
   * text that describes several different saves with no labelled sections and gave the save no
   * damage parts of its own, the damage its own sentences name. Null when neither applies. Without
   * it the save falls back to every damage figure in the feature, which then belongs to the other
   * saves: Zaratan's concentration save would deal the rubble's 5d6.
   */
  get #ownSaveDamage(): I5eDamagePart[] | null {
    // the primary of a multi-mode feature IS its first section, as its siblings are theirs; the
    // feature's save parts run on through every later section's damage
    const first = this.multiSaveSections[0]?.slice ?? this.#lairLoneSave;
    if (first && this.isSave && !this.isAttack) return DDBDescriptions.parseDamageParts(first.section).parts;
    if (this.actionData.saveParts.length > 0 || !this.descriptionSave) return null;
    if (this.multiSaveSections.length > 0) return null;
    const html = this.html;
    const saves = DDBDescriptions.parseSaves(DDBDescriptions.stripTables(html));
    if (new Set(saves.map((save) => DDBDescriptions.saveKey(save))).size < 2) return null;
    const text = DDBDescriptions.saveDamageTexts(html).get(DDBDescriptions.saveKey(this.descriptionSave));
    return text === undefined ? null : DDBDescriptions.saveOwnDamageParts(text);
  }

  override _getSaveActivity({ name = null, nameIdPostfix = null }: {
    name?: string | null;
    nameIdPostfix?: string | null;
  }, options = {}) {
    const ownDamage = this.#ownSaveDamage;
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: false,
      damageParts: ownDamage ?? this.actionData.saveParts,
      // an empty list would fall back to the whole feature's damage
      ...(ownDamage?.length === 0 ? { generateDamage: false } : {}),
      onSave: this.halfDamage ? "half" : "none",
    }, options);

    return super._getSaveActivity({ name, nameIdPostfix }, itemOptions);
  }

  override _getAttackActivity({ name = null, nameIdPostfix = null }: {
    name?: string | null;
    nameIdPostfix?: string | null;
  }, options = {}) {
    const isFlatWeaponDamage = this.templateType === "weapon" && this.actionData.damageParts.length > 0
      ? !this.actionData.damageParts[0].includesDice
      : false;

    const noDamageMods = this.actionData.damageParts.every((p) => !p.damageHasMod);
    const noModWeapon = this.templateType === "weapon" && noDamageMods;

    let parts: I5eDamagePart[] = [];

    if (isFlatWeaponDamage || noModWeapon) {
      // includes no dice, i.e. is flat, we want to ignore the base damage
      parts = this.actionData.damageParts.map((s) => s.part);
    } else if (this.actionData.damageParts.length > 1 && this.templateType === "weapon") {
      parts = this.actionData.damageParts.slice(1).map((s) => DDBMonsterFeature.weaponDamagePart(s));
    } else if (this.templateType === "feat") {
      // e.g. Armanite Hooves
      parts = this.actionData.damageParts.map((s) => s.part);
    }

    // console.warn("activity build", {
    //   isFlatWeaponDamage,
    //   this: this,
    //   noDamageMods,
    //   noModWeapon,
    //   parts,
    //   options,
    //   includeBaseDamage: (this.templateType === "weapon" && !isFlatWeaponDamage) && !noModWeapon,
    // });

    const itemOptions = foundry.utils.mergeObject({
      generateAttack: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: parts.length > 0 || !this.isSave,
      includeBaseDamage: (this.templateType === "weapon" && !isFlatWeaponDamage) && !noModWeapon,
      damageParts: parts,
    }, options);

    return super._getAttackActivity({ name, nameIdPostfix }, itemOptions);
  }

  override _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
    }, options);

    return super._getUtilityActivity({ name, nameIdPostfix }, itemOptions);
  }

  override _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
    }, options);

    return super._getDamageActivity({ name, nameIdPostfix }, itemOptions);
  }

  /**
   * The labelled sections of this feature's text that each name a save, memoised.
   *
   * A monster feature is normally one roll, but a few describe several: an eye ray table
   * (Mindwitness numbers its rays in italics), a swallow (the save to be swallowed and the save
   * to regurgitate), a monk-style strike offering a choice of rider, and the lair/regional
   * blocks, which DDB ships as one blob covering every lair action.
   */
  get multiSaveSections(): { slice: ISectionSlice; save: IParsedSave }[] {
    this.#multiSaveSectionCache ??= this._saveBearingSections(this.html);
    return this.#multiSaveSectionCache;
  }

  /**
   * The healing option of a feature that offers a choice of options, with the save option beside
   * it when it is the only one.
   *
   * Nymph's Gaze offers Concerned Look (a heal), Glare of Nature's Fury and Stunning Stare; the
   * heal read from the whole text was named "Heal", described every option and took the other
   * options' conditions. An option is a labelled section with no save of its own that names a
   * regain. The bold labels under a lair block's headings are tried first, as they are the finer
   * split. Only one such option is read: two would be a list of rules, not a choice.
   */
  get #healOption(): IMonsterHealOption | null {
    if (this.#healOptionCache !== undefined) return this.#healOptionCache;
    this.#healOptionCache = null;
    const source = DDBDescriptions.stripTables(this.html);
    for (const slices of [DDBDescriptions.sections(source, { belowHeadings: true }), DDBDescriptions.sections(source)]) {
      if (slices.length < 2) continue;
      const saving = slices.filter((slice) => DDBDescriptions.parseSaves(slice.section).length > 0);
      const heals = slices.filter((slice) => !saving.includes(slice)
        && DDBMonsterDamage.REGAIN_EXPRESSION.test(utils.stripHtml(slice.section)));
      if (heals.length !== 1) continue;
      this.#healOptionCache = {
        heal: heals[0],
        loneSave: saving.length === 1 ? saving[0] : null,
        intro: utils.stripHtml(source.slice(0, slices[0].start)),
      };
      break;
    }
    return this.#healOptionCache;
  }

  #healOptionCache: IMonsterHealOption | null | undefined = undefined;

  /**
   * Who a healing option heals. "The marsh hydra ... regains" and "Qazyldrath regains" are the
   * monster itself; "The target regains" is whoever the feature targets, read from the text
   * before the options ("directs her gaze at one creature she can see within 30 feet"), as is
   * any other subject; where that text names no target, "the target" is one creature and
   * anything else ("The vessel regains") is named in the target's special field.
   */
  #healOptionTarget(option: IMonsterHealOption): I5eActivityTarget {
    const text = utils.stripHtml(option.heal.section);
    const sentence = text.split(/(?<=[.!?])\s+/).find((part) => DDBMonsterDamage.REGAIN_EXPRESSION.test(part)) ?? text;
    const subject = sentence.split(/\bregains?\b/i)[0].trim();
    const leading = subject.toLowerCase().replace(/^the\s+/, "");
    const target: I5eActivityTarget = {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    };
    if (leading.startsWith(this.ddbMonster.name.toLowerCase()) || (/^(?:it|she|he|they)\b/).test(leading)) {
      target.affects!.type = "self";
      return target;
    }
    const introTarget = this.getTarget({ text: option.intro, mutateRange: false });
    if (introTarget.affects?.type && introTarget.affects.type !== "self") return introTarget;
    if ((/\b(?:target|creature)\b/i).test(subject)) {
      target.affects!.type = "creature";
      target.affects!.count = "1";
    } else {
      target.affects!.special = subject;
    }
    return target;
  }

  /** The one save option the primary describes: beside a healing option, else among a lair's options. */
  get #loneSaveOption(): ISectionSlice | null {
    return this.#healOption?.loneSave ?? this.#lairLoneSave;
  }

  /**
   * The labelled options of a "Lair Actions" block, up to its regional effects, with the names
   * their activities would take. The 2024 "<Monster> Lairs" features and "Regional Effects" list
   * passive effects, and some lair-type features are locations or stat lines, so only a "Lair
   * Actions" block has options. A bold "Regional Effects" opens the passive effects, and a label
   * naming the lair itself is a title rather than an option.
   */
  get #lairOptions(): { slice: ISectionSlice; name: string }[] {
    if (this.#lairOptionsCache) return this.#lairOptionsCache;
    this.#lairOptionsCache = [];
    if (this.type !== "lair" || this.name !== "Lair Actions") return this.#lairOptionsCache;
    const source = DDBDescriptions.stripTables(this.html);
    // a heading or a bold label; Githzerai Anarch's bold "Regional Effects. " reads as no label
    // at all, so its text would otherwise run on into the option before it
    const regional = source.search(/<h[1-6][^>]*>\s*Regional Effects|<(?:strong|b)>\s*Regional Effects/i);
    const labelled = DDBDescriptions.sections(source, { belowHeadings: true });
    const slices = (labelled.length > 0 ? labelled : DDBDescriptions.sections(source))
      .filter((slice) => regional < 0 || slice.start < regional);
    for (const slice of slices) {
      const name = DDBActivityFactoryMixin.multiSaveActivityName(slice.rawLabel);
      if (!name || (/\blair(?:s| actions)?$/i).test(name)) continue;
      this.#lairOptionsCache.push({ slice, name });
    }
    return this.#lairOptionsCache;
  }

  #lairOptionsCache: { slice: ISectionSlice; name: string }[] | undefined;

  /**
   * A lair's only option that names a save, which the primary save describes.
   *
   * With one save among its options a lair block is not multi-mode, so the primary was left
   * unnamed with the whole block for its card and its target: Beguiling Whisper beside Imprisoning
   * Force and Spatial Projection. Only taken when that save is the one the primary rolls; a
   * healing option takes precedence, as it reads the same split.
   */
  get #lairLoneSave(): ISectionSlice | null {
    if (!this.descriptionSave || this.multiSaveSections.length > 0 || this.#healOption) return null;
    const options = this.#lairOptions;
    if (options.length < 2) return null;
    const saving = options.filter(({ slice }) => DDBDescriptions.parseSaves(slice.section).length > 0);
    if (saving.length !== 1) return null;
    const [save] = DDBDescriptions.parseSaves(saving[0].slice.section);
    return DDBDescriptions.saveKey(save) === DDBDescriptions.saveKey(this.descriptionSave) ? saving[0].slice : null;
  }

  /**
   * The name the primary activity takes on a multi-mode feature, or null to leave it unnamed.
   * Only set where the primary IS the first section - an attack describes something else - or
   * the one save option beside a healing option or among a lair's options.
   */
  get #primaryActivityName(): string | null {
    if (this.isLegendaryResistance) return "Expend Use";
    if (!(this.isSave && !this.isAttack)) return null;
    const first = this.multiSaveSections[0]?.slice ?? this.#loneSaveOption;
    if (!first) return null;
    const name = DDBActivityFactoryMixin.multiSaveActivityName(first.rawLabel);
    // a lair block labels its first section with the feature's own name; restating it says nothing
    if (!name || DDBDescriptions.normalizeSectionLabel(name) === DDBDescriptions.normalizeSectionLabel(this.name)) {
      return null;
    }
    return name;
  }

  /**
   * On a multi-mode feature the primary describes the first section (or the one save option
   * beside a healing option or among a lair's options), so it needs that section's text for the
   * same reason its siblings do - otherwise its card shows every mode.
   */
  get #primaryActivityOptions(): IDDBActivityBuild {
    if (!(this.isSave && !this.isAttack)) return {};
    const first = this.multiSaveSections[0]?.slice ?? this.#loneSaveOption;
    if (!first) {
      const flatTarget = this.#flatPrimaryTarget;
      return flatTarget ? { targetOverride: flatTarget } : {};
    }
    return {
      data: { description: { value: first.section } },
      targetOverride: this.#sectionSaveTarget(first.section),
    };
  }

  /**
   * The primary save's own target when the text describes several different saves without
   * labelled sections, read like its siblings' (`flatSaveTarget`). Null keeps the target read
   * from the whole feature: a single save, a save that refers back to that area, or one the
   * scopes cannot place.
   */
  get #flatPrimaryTarget(): I5eActivityTarget | null {
    if (!this.descriptionSave) return null;
    const html = DDBDescriptions.stripTables(this.html);
    const saves = DDBDescriptions.parseSaves(html);
    if (new Set(saves.map((save) => DDBDescriptions.saveKey(save))).size < 2) return null;
    const scope = DDBDescriptions.saveScopes(html).get(DDBDescriptions.saveKey(this.descriptionSave));
    return DDBActivityFactoryMixin.flatSaveTarget(scope, (text) => this.#sectionTarget(text));
  }

  /**
   * The target of one mode of a multi-mode feature, read from its own section.
   *
   * Always returns a target: for a monster, "inherit" would mean the target regexed from the
   * whole feature.
   * A section names a save by construction, so a section that names no target defaults to a
   * creature.
   * That also overrides the "self" a healing feature's templateless target defaults to a save mode
   * of a feature that elsewhere heals (Nymph's Gaze, Serpent Surprise) is still rolled by someone else.
   */
  #sectionTarget(section: string): I5eActivityTarget {
    const target = this.getTarget({ text: utils.stripHtml(section).trim(), mutateRange: false });
    if (target.affects && (!target.affects.type || target.affects.type === "self")) target.affects.type = "creature";
    return target;
  }

  /**
   * The target of one mode of a multi-mode feature, read like a flat-text save's
   * (`flatSaveTarget`): the area the save's own sentence names, else the nearest one before it in
   * the section. A section that only says where the effect is placed ("a point within 120 feet")
   * or which creatures it reaches ("each creature within 15 feet of that point") would otherwise
   * read that range as a radius around the monster. A save that refers back to an area its
   * section never sized keeps the target read from the whole section.
   */
  #sectionSaveTarget(section: string): I5eActivityTarget {
    const [save] = DDBDescriptions.parseSaves(section);
    const scope = save ? DDBDescriptions.saveScopes(section).get(DDBDescriptions.saveKey(save)) : undefined;
    return DDBActivityFactoryMixin.flatSaveTarget(scope, (text) => this.#sectionTarget(text))
      ?? this.#sectionTarget(section);
  }

  /**
   * Build one save activity per mode of a feature whose text describes several.
   *
   * `featureBasics` reads only the first save, so on a swallow or an eye ray table everything
   * past it existed only in the description. The first section is skipped only when the primary
   * activity IS that save; where the primary is an attack, every section becomes an extra and
   * the generic "Save" activity is suppressed in favour of the named ones.
   */
  #generateMultiSaveActivities(): void {
    this._multiSaveActivityGeneration({
      text: this.html,
      primarySave: this.descriptionSave,
      skipFirstSection: this.isSave && !this.isAttack,
      targetOverrideForSection: (section) => this.#sectionSaveTarget(section),
      flatTargetFor: (text) => this.#sectionTarget(text),
    });
  }

  #addSaveAdditionalActivity() {
    // "Hit: 12 (2d6 + 5) slashing damage ... saving throw or take 5 (2d4) slashing damage at the start
    // of each of its turns": the save's damage follows the hit's, so the damage parser kept it off the
    // hit as a "Save vs" entry, which is this save's damage when its own text yielded none
    const divertedSaveParts = (this.ddbMonsterDamage?.additionalActivities ?? [])
      .filter((activity) => activity.type === "save")
      .flatMap((activity) => activity.options?.damageParts ?? []);
    const saveParts = this.actionData.saveParts.length > 0 ? this.actionData.saveParts : divertedSaveParts;

    this.additionalActivities.push({
      name: "Save",
      type: "save",
      options: {
        generateDamage: saveParts.length > 0,
        damageParts: saveParts,
        includeBaseDamage: false,
        // the save follows a hit with the attack, which has already spent the use
        generateConsumption: false,
      },
    });
  }

  #addHealAdditionalActivities() {
    // Healing that rides on a save or attack is part of that use, which the primary activity has
    // already spent. Where the feature only heals there is no primary, and the heal spends it.
    const ridesOnPrimary = Object.keys(this.data.system.activities ?? {}).length > 0;
    const option = this.actionData.healingParts.length > 0 ? this.#healOption : null;
    const optionPart = option ? DDBMonsterDamage.regainPart(utils.stripHtml(option.heal.section)) : null;
    if (option && optionPart) {
      // a healing option is its own choice, so it spends the feature's use like any other option
      this.additionalActivities.push({
        name: DDBActivityFactoryMixin.multiSaveActivityName(option.heal.rawLabel) || "Heal",
        type: "heal",
        options: {
          data: { description: { value: option.heal.section } },
          generateDamage: false,
          includeBaseDamage: false,
          generateHealing: true,
          healingPart: optionPart,
          targetOverride: this.#healOptionTarget(option),
        },
      } as IAdditionalActivityOutline);
      return;
    }
    const followUp = ridesOnPrimary ? this.#followUpHealActivation : null;
    const selfTarget = this.#healsItself ? this.#selfTarget : null;
    for (const part of this.actionData.healingParts) {
      const data = {
        name: "Heal",
        type: "heal",
        options: {
          generateDamage: false,
          includeBaseDamage: false,
          generateHealing: true,
          healingPart: part.part,
          ...(ridesOnPrimary ? { generateConsumption: false } : {}),
          ...(followUp ? { activationOverride: followUp } : {}),
          ...(selfTarget ? { targetOverride: selfTarget } : {}),
        },
      } as IAdditionalActivityOutline;
      this.additionalActivities.push(data);
    }
  }

  /** A target block for the monster itself. */
  get #selfTarget(): I5eActivityTarget {
    return {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "", type: "self", choice: false, special: "" },
      prompt: false,
      override: false,
    };
  }

  /**
   * Whether the feature's "regains ... hit points" heals the monster itself: "and the titan regains
   * 15 hit points", "the corpselight regains 7 (2d6) Hit Points", or a pronoun the sentence has
   * already tied to the monster ("If the archon is reduced to 0 hit points, it regains 30"). A
   * subject that offers a choice ("Asteria or another creature") or names others ("the godcaller
   * and up to three allies") is not.
   */
  get #healsItself(): boolean {
    const sentence = this.strippedHtml.split(/(?<=[.!?])\s+/)
      .find((part) => DDBMonsterDamage.REGAIN_EXPRESSION.test(part));
    if (!sentence) return false;
    const before = sentence.split(/\bregains?\b/i)[0];
    const subject = before.split(/,|;|\band\b/i).pop()?.trim().toLowerCase() ?? "";
    if (!subject || (/\bor\b/).test(subject)) return false;
    const stop = new Set(["the", "of", "and", "young", "adult", "ancient", "elder", "greater", "lesser", "giant", "swarm"]);
    const words = (this.ddbMonster.name ?? "").toLowerCase().split(/[\s,()'’-]+/)
      .filter((word) => word.length > 3 && !stop.has(word));
    const namesMonster = (text: string) => words.some((word) => new RegExp(`\\b${word}\\b`).test(text));
    const bare = subject.replace(/^(?:then\s+)?(?:the\s+)?/, "");
    if (namesMonster(bare) && bare.split(/\s+/).length <= 3) return true;
    return (/^(?:it|he|she|they)$/).test(bare) && namesMonster(before.toLowerCase().slice(0, before.toLowerCase().lastIndexOf(bare)));
  }

  /**
   * dnd5e spends legendary (and mythic) actions by an activity's activation alone, so a heal that
   * follows the option's save ("and the titan regains 15 hit points") would charge the option's
   * cost again. It takes a special activation instead, conditioned on the sentence that grants it.
   */
  get #followUpHealActivation(): I5eActivityActivation | null {
    if (!["legendary", "mythic"].includes(this.actionData.activation.type ?? "")) return null;
    const sentence = this.strippedHtml.split(/(?<=[.!?])\s+/)
      .find((part) => DDBMonsterDamage.REGAIN_EXPRESSION.test(part)) ?? "";
    return { type: "special", value: null, condition: sentence.trim() } as I5eActivityActivation;
  }

  #determineLegendaryActionTypeFallback() {
    // legendary actions are a special case and need an action to be marked as a legendary feature
    if (this.type === "legendary") return "utility";
    // a villain action with nothing to roll still needs an activity to spend its use
    if (this.type === "villain" && !this.isBlockSummary) return "utility";
    return null;
  }

  /**
   * Every printing of the trait, with or without a "(3/Day, or 4/Day in Lair)" style suffix
   * (one third-party block pluralises it). The per-day count itself is read by the factory into
   * the legres resource.
   */
  get isLegendaryResistance(): boolean {
    return (/^Legendary Resistances?\b/i).test(this.name);
  }

  override _getActivitiesType() {
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (this.isBlockSummary) return null;
    // The trait has no uses of its own (the count lives on the actor resource), which would
    // otherwise drop it through the special-with-no-uses gate below with no activity to spend one.
    if (this.isLegendaryResistance) return "utility";
    if (this.healingAction) {
      if (!this.isAttack && !this.isSave && this.actionData.damageParts.length === 0) {
        // we generate heal activities as additionals;
        return this.#determineLegendaryActionTypeFallback();
      }
    }
    if (this.isAttack) {
      // some attacks will have a save and attack
      // console.warn("isAttack", this.isAttack, this.isSave);
      if (this.isSave) {
        // a multi-mode feature already has one named save activity per section
        if (this.multiSaveSections.length === 0) this.#addSaveAdditionalActivity();
      }
      return "attack";
    }
    if (this.isSave) return "save";
    if (this.actionData.damageParts.length > 0) return "damage";
    // we generate heal activities as additionals;
    if (!this.healingAction && this.actionData.healingParts.length > 0) return null;
    if (this.actionData.activation.type === "special" && !this.actionData.uses.max) {
      return this.#determineLegendaryActionTypeFallback();
    }
    if (this.actionData.activation.type && !this.healingAction) return "utility";
    // legendary actions are a special case and need an action to be marked as a legendary feature
    if (this.type === "legendary") return "utility";
    return this.#determineLegendaryActionTypeFallback();
  }

  get #autoEffectFlags(): IItemFlagConfig & { ddbimporter: NonNullable<IItemFlagConfig["ddbimporter"]> } {
    const flags: IItemFlagConfig & { ddbimporter: NonNullable<IItemFlagConfig["ddbimporter"]> } = {
      ddbimporter: {},
    };

    // An attack's condition comes from its save. A multi-mode attack has no "Save" activity, only
    // one named save per mode (Orthon's crossbow bolts), so it matches saves by type and the
    // section scoping keeps each condition on the modes that name it.
    if (this.isAttack && this.isSave && this.multiSaveSections.length > 0) {
      flags.ddbimporter.activityTypesMatch = ["save"];
    } else if (this.isAttack && this.isSave) {
      flags.ddbimporter.activityMatch = "Save";
    }
    return flags;
  }

  _generateAutoEffects({ html, addToMonster = true }: { html: string; addToMonster?: boolean }) {
    const overtimeGenerator = new Effects.MidiOverTimeEffect({
      document: this.data,
      actor: this.ddbMonster.npc,
      otherDescription: html,
      flags: this.#autoEffectFlags,
      addToMonster,
    });

    const deps = Effects.AutoEffects.effectModules();
    if (!deps.hasCore || !this.ddbMonster.addMonsterEffects) {
      logger.debug(`Adding Condition Effects to ${this.name}`);
      overtimeGenerator.generateConditionOnlyEffect();
    } else if (this.ddbMonster.addMonsterEffects) {
      logger.debug(`Adding Over Time Effects to ${this.name}`);
      overtimeGenerator.generateOverTimeEffect();
    }
    return overtimeGenerator;
  }

  /**
   * The statuses an effect imposes itself, without those another of its statuses implies: Stunned
   * brings Incapacitated, which is not the condition a mode naming "incapacitated" imposes.
   */
  static ownStatuses(statuses: Iterable<string>): string[] {
    const list = Array.from(statuses);
    const implied = (status: string) => list.some((other) => other !== status
      && (CONFIG.DND5E.conditionTypes[other]?.statuses ?? []).includes(status));
    return list.filter((status) => !implied(status));
  }

  /** The condition effects built from one mode's own text, keyed by effect id, with that mode's section. */
  #sectionConditionEffects = new Map<string, string>();

  /**
   * One condition effect per mode of a multi-mode feature whose own text imposes a condition the
   * feature's effect does not carry.
   *
   * The feature's condition is read from its first save-and-condition clause only, so Sphinx of
   * Valor's Roar got the Second Roar's Paralyzed and nothing for the First Roar's Frightened or
   * the Third Roar's Prone. Each mode is read on its own, named after its label, and kept on its
   * own mode's activity by `#scopeSectionStatusEffects`.
   */
  #generateSectionConditionEffects() {
    const sections = this.multiSaveSections.map(({ slice }) => slice);
    if (sections.length < 2) return;
    this.data.effects ??= [];
    const carried = new Set(this.data.effects.flatMap((effect) => DDBMonsterFeature.ownStatuses(effect.statuses ?? [])));
    for (const slice of sections) {
      const generator = new Effects.MidiOverTimeEffect({
        document: this.data,
        actor: this.ddbMonster.npc,
        otherDescription: utils.stripHtml(slice.section),
        flags: this.#autoEffectFlags,
        addToMonster: false,
      });
      generator.generateConditionOnlyEffect();
      const effect = generator.effect;
      const statuses = DDBMonsterFeature.ownStatuses(effect.statuses ?? []);
      // the mode's own condition comes first; a rider beside it ("While poisoned in this way, it is
      // incapacitated") is not a reason for a second effect when the condition is already carried
      if (statuses.length === 0 || carried.has(statuses[0])) continue;
      statuses.forEach((status) => carried.add(status));
      const label = DDBActivityFactoryMixin.multiSaveActivityName(slice.rawLabel);
      if (label) effect.name = `${label}: ${(effect.name ?? "").replace(/^Status:\s*/, "")}`;
      effect._id ??= foundry.utils.randomID();
      this.data.effects.push(effect);
      this.#sectionConditionEffects.set(effect._id, slice.section);
    }
  }

  /**
   * A condition the save adds only for some targets or at a later stage ("fails by 5 or more",
   * "instead of the Restrained condition") gets an effect of its own beside the feature's, named
   * for when it applies, so the GM applies it then. Statuses the feature already carries are left
   * out, and the effect links like the feature's own condition.
   */
  #generateExtraConditionEffects() {
    this.data.effects ??= [];
    const carried = new Set(this.data.effects.flatMap((effect) => Array.from(effect.statuses ?? [])));
    for (const { status, qualifier } of DDBDescriptions.extraConditionClauses(this.strippedHtml)) {
      const generator = new Effects.MidiOverTimeEffect({
        document: this.data,
        actor: this.ddbMonster.npc,
        otherDescription: this.strippedHtml,
        flags: this.#autoEffectFlags,
        addToMonster: false,
        conditionStatus: status,
      });
      generator.generateConditionOnlyEffect();
      const effect = generator.effect;
      const statuses = Array.from(effect.statuses ?? []).filter((entry) => !carried.has(entry));
      if (statuses.length === 0) continue;
      effect.statuses = statuses;
      statuses.forEach((entry) => carried.add(entry));
      effect.name = `${status.conditionName} (${qualifier})`;
      effect._id ??= foundry.utils.randomID();
      this.data.effects.push(effect);
    }
  }

  async _generateEffects() {
    this._generateAutoEffects({ html: this.strippedHtml });

    if (this.enricher.clearAutoEffects) this._clearAutoEffects();
    const effects = await this.enricher.createEffects();
    this.data.effects ??= [];
    this.data.effects.push(...effects);
    // after the enricher's own effects, so a condition it already builds (a lair zone's) is not doubled
    if (!this.enricher.clearAutoEffects) {
      this.#generateSectionConditionEffects();
      this.#generateExtraConditionEffects();
    }
    this.enricher.createDefaultEffects();

    // Effect hints matched to the "Versatile" activity follow the damage mode that replaces it,
    // or the name the alternative took from its condition.
    const versatileRename = this.ddbMonsterDamage.replacesVersatile && this.ddbMonsterDamage.damageModes.length
      ? this.ddbMonsterDamage.damageModes[0].name
      : this.#versatileName;
    if (versatileRename !== "Versatile") {
      const name = versatileRename;
      for (const effect of this.data.effects) {
        if (foundry.utils.getProperty(effect, "flags.ddbimporter.activityMatch") === "Versatile") {
          foundry.utils.setProperty(effect, "flags.ddbimporter.activityMatch", name);
        }
        const matches = foundry.utils.getProperty(effect, "flags.ddbimporter.activitiesMatch") as string[] | undefined;
        if (matches?.includes("Versatile")) {
          foundry.utils.setProperty(effect, "flags.ddbimporter.activitiesMatch", matches.map((match) => match === "Versatile" ? name : match));
        }
      }
    }
    this._activityEffectLinking();
    this.#scopeDamageModeEffects();
    this.#scopeSectionStatusEffects();
    this.#scopeFlatSaveStatusEffects();
    this.#scopeLairOptionStatusEffects();
    this._activityBehaviorNaming();
    this._activityDisplayDefaults();

    Effects.AutoEffects.forceDocumentEffect(this.data);
  }

  /** Filter only attack links; saves and independent follow-up activities keep their own riders. */
  #scopeDamageModeEffects() {
    const damage = this.ddbMonsterDamage;
    if (!damage.damageModes.length) return;
    const normalStatuses = monsterDamageAppliedStatuses(damage.normalHit);
    const primary = Object.values(this.data.system.activities).find((activity) => activity.type === "attack");
    const removeStatuses = (activity: I5eActivity, statuses: Set<string>) => {
      activity.effects = activity.effects?.filter((link) => {
        const effect = this.data.effects?.find((candidate) => candidate._id === link._id);
        return !Array.from(effect?.statuses ?? []).some((status) => statuses.has(status.toLowerCase()));
      });
    };
    for (const mode of damage.damageModes) {
      const conditionalStatuses = monsterDamageAppliedStatuses(mode.text);
      const onlyConditional = new Set([...conditionalStatuses].filter((status) => !normalStatuses.has(status)));
      if (primary) removeStatuses(primary, onlyConditional);
      const variant = Object.values(this.data.system.activities).find((activity) => activity.type === "attack" && activity.name === mode.name);
      if (!variant) continue;
      // Already-affected targets receive the extra damage instead of reapplying the condition.
      if ((/\balready\b/i).test(mode.condition)) {
        const existing = new Set([...normalStatuses].filter((status) => new RegExp(`\\b${status}\\b`, "i").test(mode.condition)));
        removeStatuses(variant, existing);
      }
    }
  }

  /**
   * On a multi-mode feature, keep a condition effect only on the modes whose own section names it.
   *
   * The auto condition effects are read from the whole feature and carry no activity match, so
   * linking puts every one on every section activity: a lair block's Prone lands on each option.
   * Only effects with no name filter are touched, so enricher hints keep their links, and a
   * condition no section names (stated in a preamble, say) keeps them all. A condition read from
   * one mode's own text (`#generateSectionConditionEffects`) stays on that mode alone.
   */
  #scopeSectionStatusEffects() {
    const option = this.#healOption;
    const sections = new Set([
      ...this.multiSaveSections.map(({ slice }) => slice.section),
      ...(option ? [option.heal.section, option.loneSave?.section ?? ""] : []),
    ].filter((section) => section !== ""));
    if (sections.size < 2) return;
    const sectionActivities = Object.values(this.data.system.activities)
      .filter((activity) => sections.has(activity.description?.value ?? ""))
      .map((activity) => ({ activity, text: utils.stripHtml(activity.description!.value!) }));
    if (sectionActivities.length < 2) return;

    for (const effect of this.data.effects ?? []) {
      const statuses = DDBMonsterFeature.ownStatuses(effect.statuses ?? []).map((status) => status.toLowerCase());
      if (!effect._id || statuses.length === 0) continue;
      const ownSection = this.#sectionConditionEffects.get(effect._id);
      if (ownSection !== undefined) {
        for (const activity of Object.values(this.data.system.activities)) {
          if (activity.description?.value === ownSection) continue;
          activity.effects = activity.effects?.filter((link) => link._id !== effect._id);
        }
        continue;
      }
      if (foundry.utils.hasProperty(effect, "flags.ddbimporter.activityMatch")
        || foundry.utils.hasProperty(effect, "flags.ddbimporter.activitiesMatch")) continue;
      const names = (text: string) => statuses.some((status) => new RegExp(`\\b${status}\\b`, "i").test(text));
      if (!sectionActivities.some(({ text }) => names(text))) continue;
      for (const { activity, text } of sectionActivities) {
        if (names(text)) continue;
        activity.effects = activity.effects?.filter((link) => link._id !== effect._id);
      }
    }
  }

  /**
   * On a feature with several saves and no labelled modes, keep a condition only on the saves
   * whose own stretch of text names it: Iymrith's lair put Blinded on its Dexterity save and its
   * Constitution save alike. Each save's stretch runs from its save to the next one, so the
   * "On a failed save, ... knocked prone" that follows a save stays with it. Effects with a name
   * filter are left alone, and a condition no stretch names keeps every link.
   */
  #scopeFlatSaveStatusEffects() {
    if (this.multiSaveSections.length >= 2) return;
    const text = DDBDescriptions.plainText(DDBDescriptions.stripTables(this.html));
    const saves = DDBDescriptions.parseSaves(DDBDescriptions.stripTables(this.html)).sort((a, b) => a.index - b.index);
    if (new Set(saves.map((save) => DDBDescriptions.saveKey(save))).size < 2) return;
    const spans = new Map<string, string>();
    saves.forEach((save, i) => {
      const key = DDBDescriptions.saveKey(save);
      const span = text.slice(save.index, saves[i + 1]?.index ?? text.length);
      spans.set(key, `${spans.get(key) ?? ""} ${span}`);
    });
    const saveActivities = Object.values(this.data.system.activities)
      .filter((activity): activity is I5eSaveActivity => activity.type === "save" && "save" in activity && !!activity.save)
      .map((activity) => ({
        activity,
        text: spans.get(DDBDescriptions.saveKey({
          ability: Array.from(activity.save.ability ?? []),
          dc: { calculation: activity.save.dc?.calculation ?? "", formula: activity.save.dc?.formula ?? "" },
        })),
      }))
      .filter((entry): entry is { activity: I5eSaveActivity; text: string } => entry.text !== undefined);
    if (saveActivities.length < 2) return;

    for (const effect of this.data.effects ?? []) {
      const statuses = DDBMonsterFeature.ownStatuses(effect.statuses ?? []).map((status) => status.toLowerCase());
      if (!effect._id || statuses.length === 0) continue;
      if (foundry.utils.hasProperty(effect, "flags.ddbimporter.activityMatch")
        || foundry.utils.hasProperty(effect, "flags.ddbimporter.activitiesMatch")) continue;
      const names = (span: string) => statuses.some((status) => new RegExp(`\\b${status}\\b`, "i").test(span));
      if (!saveActivities.some(({ text }) => names(text))) continue;
      for (const { activity, text } of saveActivities) {
        if (names(text)) continue;
        activity.effects = activity.effects?.filter((link) => link._id !== effect._id);
      }
    }
  }

  /**
   * A lair option with nothing to roll ("Vanish. The dragon becomes invisible until initiative
   * count 20 on the next round.") had no activity, so it had no card to use. Each labelled option
   * of a "Lair Actions" block (not its Regional Effects) that rolls nothing and has no activity of
   * its name gets a utility one, described by its own text. Options with a save, dice, a heal or an
   * attack are the parser's, and casting or summoning options are the enrichers'.
   */
  /**
   * The checks a creature makes to get out of something, read from their sentences as items read
   * them ("An engulfed creature can try to escape by taking an action to make a DC 16 Strength
   * check", "A creature can be freed if it or another creature takes an action to make a DC 15
   * Strength check"). Monsters only read a bare "escape DC N" before, so worded checks had no
   * activity. A worded check with the escape DC replaces the bare one: it names the roll.
   */
  #queueReleaseChecks() {
    // An enricher's own extras (an engulf's ongoing damage, a web's zone) used to hide the parsed
    // check; it is only left out when one of those extras is a check already (Whelm's Pull Free).
    const enricherCheck = (this.enricher.additionalActivities ?? []).some((extra) => extra.init?.type === "check"
      || extra.build?.generateCheck === true || !!extra.build?.checkOverride);
    if (enricherCheck) return;
    const before = this.additionalActivities.length;
    this._checkActivityGeneration({ text: this.html, bareEscape: false, besideEnricherExtras: true });
    const worded = this.additionalActivities.slice(before);
    if (worded.length === 0) return;
    const dcOf = (outline: IAdditionalActivityOutline) => String(foundry.utils.getProperty(outline, "options.checkOverride.dc.formula") ?? "");
    for (let i = before - 1; i >= 0; i--) {
      const outline = this.additionalActivities[i];
      if (outline.type !== "check" || outline.name !== "Escape Check") continue;
      const replacement = worded.find((check) => dcOf(check) === dcOf(outline));
      if (!replacement) continue;
      // the escape the stat block names, whatever skill its sentence asks for
      replacement.name = "Escape Check";
      this.additionalActivities.splice(i, 1);
    }
  }

  /** The option texts given an activity of their own by `#queueLairOptionUtilities`. */
  #lairOptionSections: string[] = [];

  /**
   * A lair option keeps a condition read from the lair only when its own text names it (Mossy
   * Sludge's Poisoned); otherwise linking would give Vanish the lair's Charmed. The lone save
   * option the primary describes is held to the same rule, as the other options are not saves
   * that could claim their conditions.
   */
  #scopeLairOptionStatusEffects() {
    const loneSave = this.#healOption ? null : this.#lairLoneSave;
    const sections = new Set([...this.#lairOptionSections, ...(loneSave ? [loneSave.section] : [])]);
    if (sections.size === 0) return;
    for (const activity of Object.values(this.data.system.activities)) {
      const section = activity.description?.value ?? "";
      if (!sections.has(section)) continue;
      const text = utils.stripHtml(section);
      activity.effects = activity.effects?.filter((link) => {
        const effect = this.data.effects?.find((candidate) => candidate._id === link._id);
        if (!effect || foundry.utils.hasProperty(effect, "flags.ddbimporter.activityMatch")
          || foundry.utils.hasProperty(effect, "flags.ddbimporter.activitiesMatch")) return true;
        const statuses = DDBMonsterFeature.ownStatuses(effect.statuses ?? []);
        return statuses.length === 0 || statuses.some((status) => new RegExp(`\\b${status}\\b`, "i").test(text));
      });
    }
  }

  /** The lair options that cast a spell, built by `#buildLairCastOptions`. */
  #lairCastOptions: { name: string; section: string; text: string; spells: IMonsterSpellcastingSpell[] }[] = [];

  /**
   * The spells a lair option casts: "The dragon casts the forcecage spell, using its spell save DC
   * and requiring no spell components", "The morkoth casts darkness, dispel magic, or misty step",
   * "The baernaloth uses Spellcasting to cast detect thoughts", "casts the creation spell (as a
   * 9th-level spell)". A repeat count ("four times") has no home on a cast activity.
   */
  static lairOptionSpells(text: string): IMonsterSpellcastingSpell[] {
    const match = (/\b(?:casts|to cast)(?: the)? (?<spells>.+?)(?= spells?\b|[.(;:]|,? (?:using|requiring|affecting|targeting|without|but|on|in|at|as|four times|three times|twice)\b)/i).exec(text);
    if (!match?.groups) return [];
    const names = DDBDescriptions.splitStringByComma(match.groups.spells.replace(/,? or /g, ", "))
      .map((name) => name.trim())
      // "each creature that casts a spell" casts nothing of the monster's
      .filter((name) => name !== "" && !(/^(?:an?|any|one|that|this|its)\b/i).test(name));
    const level = (/\b(?:as an?|at) (\d)(?:st|nd|rd|th)[- ]level\b/i).exec(text)?.[1];
    const noConcentration = (/\b(?:doesn't|does not|without) requir(?:e|es|ing) concentration\b/i).test(text);
    return names.map((name) => ({
      name,
      ...(level ? { level } : {}),
      ...(noConcentration ? { noConcentration: true } : {}),
    }));
  }

  /**
   * Build each lair cast option as cast activities named for the option, with the ability, save DC
   * and waived components its own text gives (Deep Torpor's "using Charisma as the spellcasting
   * ability (spell save DC 16)"). The lair action spends no slot. Built whether or not the monster's
   * Spellcasting uses cast activities: a 2014 monster's spell items come from its own spell list,
   * which a lair spell is not on. An option whose spell is not in the spell compendium keeps its
   * text in a utility.
   */
  async #buildLairCastOptions() {
    for (const option of this.#lairCastOptions) {
      this.#lairOptionSections.push(option.section);
      const built = await this.#buildSpellcastingActivities(option.spells, {
        castingData: this.#getSpellcastingData(option.text),
        name: option.name,
        description: option.section,
        quietMissing: true,
        keepSpellTarget: true,
        noSpellSlot: true,
      });
      if (built > 0) continue;
      this.additionalActivities.push({
        name: option.name,
        type: "utility",
        options: {
          data: { description: { value: option.section } },
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
        },
      } as IAdditionalActivityOutline);
    }
  }

  #queueLairOptionUtilities() {
    const options = this.#lairOptions;
    if (options.length < 2) return;

    const normal = (name: string | null | undefined) => (name ?? "").replace(/[’]/g, "'").trim().toLowerCase();
    const taken = [
      ...Object.values(this.data.system.activities).map((activity) => activity.name),
      ...this.additionalActivities.map((outline) => outline.name),
      ...(this.enricher.additionalActivities ?? []).map((extra) => extra.init?.name ?? extra.action?.name ?? extra.overrides?.name),
    ].map(normal).filter(Boolean);
    const described = new Set(Object.values(this.data.system.activities).map((activity) => activity.description?.value ?? ""));
    // read elsewhere: a save (the primary or a multi-save sibling), a stat block attack, a summon,
    // and a "regains 22 (4d10) hit points" healing option; "A character can use an action to pray
    // ..." is something the monster's foes do, not a lair action
    const readElsewhere = (text: string) => DDBDescriptions.parseSaves(text).length > 0
      || (/^(?:an?|any) (?:character|creature|player)\b[^.]*?\bcan\b[^.]*?\baction\b/i).test(text.trim())
      || (/\b(?:Melee|Ranged)(?: Weapon| Spell)? Attack/i).test(text)
      || (/\bsummons?\b/i).test(text)
      || DDBMonsterDamage.REGAIN_EXPRESSION.test(text);

    for (const { slice, name } of options) {
      if (described.has(slice.section)) continue;
      const label = normal(name);
      if (taken.some((entry) => entry === label || entry.startsWith(`${label} `) || entry.endsWith(`: ${label}`))) continue;
      const text = utils.stripHtml(slice.section);
      if (readElsewhere(text)) continue;
      const spells = DDBMonsterFeature.lairOptionSpells(text);
      if (spells.length > 0) {
        taken.push(label);
        this.#lairCastOptions.push({ name, section: slice.section, text, spells });
        continue;
      }
      // "each creature ... that casts a spell" names no spell of the monster's
      if ((/\bcasts?\b/i).test(text)) continue;
      taken.push(label);
      this.#lairOptionSections.push(slice.section);
      this.additionalActivities.push(this.#lairDiceOption(name, slice.section, text) ?? {
        name,
        type: "utility",
        options: {
          data: { description: { value: slice.section } },
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
        },
      } as IAdditionalActivityOutline);
    }
  }

  /**
   * Who a rolling lair option affects, read from its own text. The area is the shape it names
   * (Blood Rain's "10-foot-radius cylinder"); a range is an area only for "each" or "all" ("Each
   * tosculi within 60 feet"), as "one severed zmey head ... within 120 feet" and "up to two
   * creatures within 30 feet" say where the targets are, not what the option covers.
   */
  #lairOptionTarget(section: string, text: string): I5eActivityTarget {
    const target = this.#sectionTarget(section);
    const area = DDBActivityFactoryMixin.areaFromText(text);
    const blank = { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" } as I5eActivityTarget["template"];
    if (area) {
      target.template = { ...blank, count: "1", type: area.type, size: area.size, width: area.width } as I5eActivityTarget["template"];
    } else if (!(/\b(?:each|all|every)\b[^.]*?\bwithin \d+/i).test(text)) {
      target.template = blank;
    }
    return target;
  }

  /**
   * A lair option that rolls dice but asks for no save: an attack with its own bonus ("The fist has
   * a +11 bonus to hit"), damage ("Each target takes 9 (2d8) psychic damage"), or healing the
   * regain reader does not take ("gains 19 (3d12) temporary hit points", "regains 10 3d6 hp").
   * Damage wins over a heal that only repeats it ("regains hit points equal to the total damage").
   * Null for an option with nothing to roll, which keeps its utility.
   */
  #lairDiceOption(name: string, section: string, text: string): IAdditionalActivityOutline | null {
    const common = {
      data: { description: { value: section } },
      generateConsumption: false,
      generateRange: false,
      includeBaseDamage: false,
      targetOverride: this.#lairOptionTarget(section, text),
    };
    const damageParts = DDBDescriptions.parseDamageParts(section).parts;
    const bonus = (/([+-]\d+) (?:bonus )?to hit\b|\battack bonus of ([+-]\d+)/i).exec(text);
    if (bonus && damageParts.length > 0) {
      const attack: I5eActivityAttack = {
        ability: "",
        bonus: `${Number.parseInt(bonus[1] ?? bonus[2])}`,
        critical: { threshold: undefined },
        flat: true,
        type: { value: (/\branged\b/i).test(text) ? "ranged" : "melee", classification: "weapon" },
      };
      return {
        name,
        type: "attack",
        options: { ...common, generateAttack: true, attackOverride: attack, generateDamage: true, damageParts },
      } as IAdditionalActivityOutline;
    }
    if (damageParts.length > 0) {
      return {
        name,
        type: "damage",
        options: { ...common, generateDamage: true, damageParts },
      } as IAdditionalActivityOutline;
    }
    const heal = (/\b(?:re)?gains?\s+(?:(\d+)\s*)?\(?(\d*d\d+(?:\s*[-+]\s*\d+)?)?\)?\s+(temporary hit points|hit points|hp)\b/i).exec(text);
    const amount = heal ? heal[2] ?? heal[1] : undefined;
    if (!heal || !amount) return null;
    const temporary = heal[3].toLowerCase() === "temporary hit points";
    const healingPart = SystemHelpers.buildDamagePart({
      damageString: utils.parseDiceString(amount).diceString,
      type: temporary ? "temphp" : "healing",
    });
    return {
      name,
      type: "heal",
      options: { ...common, generateDamage: false, generateHealing: true, healingPart },
    } as IAdditionalActivityOutline;
  }

  #getSpellcastingData(text = this.strippedHtml): IMonsterSpellcastingData {
    const result: IMonsterSpellcastingData = {
      dc: null,
      ability: null, // ability associated
      ignoredComponents: [],
      innateMatch: false,
      concentration: true,
      innate: false,
    };

    const abilitySearch = /((?:spellcasting ability) (?:is|uses|using) (\w+)| (\w+)(?: as \w+ spellcasting ability))/;
    const abilityMatch = text.match(abilitySearch);
    if (abilityMatch) {
      const ability = abilityMatch[2] ?? abilityMatch[3];
      result.ability = ability.toLowerCase().substring(0, 3);
    }

    const dcSearch = /spell\s+save\s+DC\s*(\d+)(?:,|\)|\s)/i;
    const dcMatch = text.match(dcSearch);
    if (dcMatch) {
      result.dc = parseInt(dcMatch[1]);
    }

    result.ignoredComponents = DDBDescriptions.monsterIgnoredComponents(text);

    const noConcentrationSearch = new RegExp(/no concentration|no material components or concentration|no spell components or concentration/);
    const noConcentrationMatch = noConcentrationSearch.test(text);
    if (noConcentrationMatch) {
      result.concentration = false;
    }

    if (this.originalName.startsWith("Innate Spellcasting")) {
      result.innate = true;
    }

    return result;
  }

  #generateSpellcastingData() {
    this.spellCastingData = this.#getSpellcastingData();
  }

  async #getCastSpellActivitySpellData(spellData: IMonsterSpellcastingSpell, compendiumSpell: any, {
    castingData = this.spellCastingData, name, description, keepSpellTarget = false, noSpellSlot = false,
  }: {
    castingData?: IMonsterSpellcastingData; name?: string; description?: string; keepSpellTarget?: boolean;
    noSpellSlot?: boolean;
  } = {}) {
    const spellOverride: I5eActivitySpell & {
      properties: NonNullable<I5eActivitySpell["properties"]>;
      challenge: NonNullable<I5eActivitySpell["challenge"]>;
    } = {
      uuid: compendiumSpell.uuid,
      properties: [],
      level: null,
      challenge: {
        attack: undefined,
        save: undefined,
        override: false,
      },
      spellbook: true,
    };

    const consumptionOverride: I5eActivityConsumption & { targets: I5eConsumptionTarget[] } = {
      spellSlot: false,
      targets: [],
      scaling: {
        allowed: false,
        max: "",
      },
    };

    const usesOverride: I5eSystemLimitedUses & { recovery: I5eSystemLimitedUsesRecovery[] } = {
      spent: null,
      recovery: [],
      max: "",
    };

    let generateActivityUses = false;
    // the override carries spellSlot false, which a cast activity otherwise defaults to true
    let generateConsumption = noSpellSlot;

    if (!castingData.concentration || spellData.noConcentration) {
      spellOverride.properties.push("concentration");
    }
    // cast activity properties are the spell properties the cast ignores
    const ignoredComponents = new Set([...castingData.ignoredComponents, ...(spellData.ignoredComponents ?? [])]);
    spellOverride.properties.push(...ignoredComponents);
    if (spellData.level) spellOverride.level = parseInt(spellData.level);

    if (spellData.consumeType || spellData.period) {
      generateConsumption = true;
      consumptionOverride.targets.push({
        type: spellData.consumeType ?? "activityUses",
        value: "1",
        scaling: {},
      });
    }

    if (this.type === "legendary") {
      generateConsumption = true;
      consumptionOverride.targets.push({
        type: "attribute",
        value: "1",
        target: "resources.legact.value",
        scaling: {},
      });
    }

    if (spellData.period) {
      generateActivityUses = true;
      usesOverride.spent = 0;
      usesOverride.max = spellData.quantity ? `${spellData.quantity}` : "1";
      const resetType = DICTIONARY.resets.find((reset) =>
        reset.id == spellData.period,
      )?.value ?? "lr";
      usesOverride.recovery.push({
        period: resetType,
        type: "recoverAll",
      });
    }

    if (castingData.ability
      && castingData.ability !== this.ddbMonster.npc.system.attributes?.spellcasting
    ) {
      spellOverride.ability = castingData.ability;
    }

    if (castingData.dc
      && parseInt(String(castingData.dc)) !== parseInt(String(this.ddbMonster.spellcasting.spelldc))
    ) {
      spellOverride.challenge.override = true;
      spellOverride.challenge.save = String(castingData.dc);
    }

    const options = {
      spellOverride,
      generateConsumption: generateConsumption,
      generateUses: generateActivityUses,
      usesOverride,
      consumptionOverride,
      // a lair option's text describes the lair action, not who the spell targets
      generateTarget: keepSpellTarget ? false : spellData.targetSelf ?? undefined,
    };

    const activity = this._getCastActivity({
      name: name ?? (spellData.extra ? `${spellData.name} (${spellData.extra})` : spellData.name),
    }, options);
    if (description) activity.data.description = { ...(activity.data.description ?? {}), value: description };

    if (spellData.targetSelf) {
      activity.data.target.override = true;
      activity.data.target.affects.type = "self";
    }

    if (spellData.duration) {
      activity.data.duration = foundry.utils.mergeObject((activity.data.duration ?? {}), spellData.duration);
      activity.data.duration.override = true;
    }

    await this.enricher.customFunction({
      name: spellData.name,
      activity: activity,
    });

    if (!("activation" in this.data.system)) {
      activity.data.activation.override = true;
    }

    activity.img = compendiumSpell.img;

    // console.warn("spell activite", {
    //   activity,
    //   spellData,
    //   compendiumSpell,
    //   options,
    // });


    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

  }

  #getSpellcastingSpells() {
    const html = this.html
      .replace("Illusionbr/&gt; ", "Illusion</p><p> ") // faerie dragon parsing issue
      .replaceAll(/<br>/g, "</p><p>")
      .replaceAll(/<br \/>/g, "</p><p>");

    const dom = utils.htmlToDocumentFragment(html);

    dom.childNodes.forEach((node) => {
      if (node.textContent == "\n") {
        dom.removeChild(node);
      }
    });

    const spells: IDDBParsedMonsterSpell[] = [];

    dom.childNodes.forEach((node) => {
      const spellText = utils.nameString(node.textContent ?? "");
      const trimmedText = spellText.trim();
      const spellData = DDBDescriptions.parseOutMonsterSpells(trimmedText);
      spells.push(...spellData);
    });

    logger.debug(`${this.ddbMonster.name}: ${this.name}: Parsed spellcasting spells`, {
      spells,
    });

    return spells;
  }

  async #retrieveCompendiumSpells(spellNames: string[]) {
    return CompendiumHelper.retrieveCompendiumSpellReferences(spellNames, {
      use2024Spells: this.use2024Spells,
    });
  }


  // spell = {
  //   name: "Fireball", //required
  //   level: "5", // optional
  //   extra: null, // extra to append to name string
  //   period: "Day", // reset timeframe
  //   quantity: "2"  // quantity available per period
  //   consumeType: "itemUses",// defaults to activity uses
  //   targetSelf: true,
  //   ignoredComponents: ["material"],
  //   duration: {},
  // }
  async #buildSpellcastingActivities(spells: IMonsterSpellcastingSpell[], { quietMissing = false, ...castOptions }: {
    castingData?: IMonsterSpellcastingData; name?: string; description?: string; quietMissing?: boolean;
    keepSpellTarget?: boolean; noSpellSlot?: boolean;
  } = {}): Promise<number> {

    const compendiumSpellsIndex: ICompendiumLookup[] = await this.#retrieveCompendiumSpells(spells.map((spell) => spell.name));
    let built = 0;

    for (const spell of spells) {
      const entry = compendiumSpellsIndex.find((i) => i.name.toLowerCase() === spell.name.toLowerCase()
        || i.requestedName?.toLowerCase() === spell.name.toLowerCase()
        || i.flags?.ddbimporter?.originalName.toLowerCase() === spell.name.toLowerCase()
        || i.name.toLowerCase() === spell.name.split(";")[0].trim().toLowerCase(),
      );
      if (!entry) {
        (quietMissing ? logger.warn : logger.error)(`Unable to find spell ${spell.name} for monster: "${this.ddbMonster.name}" (feature: "${this.originalName}"), have you munched spells?`, {
          spell,
          this: this,
          spells,
        });
        continue;
      }
      await this.#getCastSpellActivitySpellData(spell, entry, {
        ...castOptions,
        // an option offering several spells names each cast after its spell
        name: castOptions.name && spells.length > 1 ? `${castOptions.name}: ${entry.name}` : castOptions.name,
      });
      built++;
    }
    return built;
  }

  /**
   * Extract the spells a non-Spellcasting feature casts, e.g. "The archmage casts Fireball, Ice Storm, or
   * Lightning Bolt twice in any combination, using the same spellcasting ability as Spellcasting." The
   * optional `count` group ("twice", "three times", "... in any combination") sits between the spell list
   * and the ability clause so it is not swallowed into the last spell name. A cast count has no home on a
   * dnd5e cast activity; the parent feature's recharge/uses already gate the action.
   */
  getOtherCastSpells(): IMonsterSpellcastingSpell[] {
    const basicRegex = /The (?:.*) casts(?: the)? (?<spells>.*?)(?<count> (?:twice|thrice|(?:two|three|four|five|\d+) times)(?: in any combination)?)?(?: spell| on that creature)?(?<self>on itself)?(?: in response to (?:the|that) spell’s trigger)?, (?<components>requiring no (?:(?:verbal|somatic|material|spell|spellcasting),? (?:(?:or|and) )?)*components and )?using (?:the same spellcasting ability as (?:its )?[^.,(]+|(?<ability>\w+) as the spellcasting ability)/i;
    const basicMatch = this.strippedHtml.match(basicRegex);

    // "uses Spellcasting to cast either Irresistible Dance or Vicious Mockery"
    const useRegex = /The (?:.*) uses Spellcasting to cast (?:either )?(?<spells>.*?)(?<self> on itself)?(?:, and it can|\.)/i;
    const useMatch = this.strippedHtml.match(useRegex);
    const canCastRegex = /the (?:.*) can cast one of the following spells, (?:.*): (?<spells>.*?)\./i;
    const canCastMatch = this.strippedHtml.match(canCastRegex);

    const lairRegex = /While in its lair, the (?:.*) can cast (?<spells>.*?), (?<components>requiring no (?:(?:verbal|somatic|material|spell|spellcasting),? (?:(?:or|and) )?)*components and )?using the same spellcasting ability as its Spellcasting action./i;
    const lairMatch = this.strippedHtml.match(lairRegex);

    const matches = basicMatch ?? useMatch ?? canCastMatch ?? lairMatch;
    const spells: IMonsterSpellcastingSpell[] = [];
    const matchGroups = matches?.groups;
    if (!matchGroups) return spells;

    const perUseRegex = /The (?:.*) must finish a (\w+) Rest before using this trait to cast that spell again/i;
    const perUseMatch = this.strippedHtml.match(perUseRegex);

    const names = DDBDescriptions
      .splitStringByComma(matchGroups.spells.replace(", or ", ", ").replace(" or ", ", "))
      .filter((n) => n.trim() !== "");
    for (const name of names) {
      // parenthetical qualifiers such as "(level 5 version)" or "(self only)" are parsed the same way
      // as the Spellcasting block path so the compendium lookup sees the bare spell name
      const entry = DDBDescriptions.parseMonsterSpellEntry(name);
      const spell: IMonsterSpellcastingSpell = {
        name: entry.name,
      };

      if (entry.level) spell.level = entry.level;
      if (entry.extra) spell.extra = entry.extra;
      if (entry.targetSelf) spell.targetSelf = true;
      if (entry.duration) spell.duration = entry.duration;

      if (matchGroups.self) {
        spell.extra = "on itself";
        spell.targetSelf = true;
      }
      if (matchGroups.components) {
        spell.ignoredComponents = DDBDescriptions.monsterIgnoredComponents(matchGroups.components);
      }

      if (matchGroups.ability) {
        spell.ability = matchGroups.ability;
      }

      if (perUseMatch) {
        spell.period = perUseMatch[1].trim();
        spell.quantity = "1";
        spell.consumeType = "activityUses";
      } else if (this.data.system.uses.max) {
        spell.consumeType = "itemUses";
        spell.quantity = "1";
      }
      spells.push(spell);
    }

    spells.push(...this.getReplacementCastSpells(spells));

    logger.verbose(`${this.ddbMonster.name}: ${this.name}: Parsed cast spells`, {
      spells,
      count: matchGroups.count?.trim() ?? null,
    });

    return spells;
  }

  /**
   * Spells a cast feature offers in place of one it already casts, e.g. "It can replace one Fireball
   * with Hold Monster (level 7 version) or Wall of Fire." Each substitute is cast the same way as the
   * spell it replaces: same ability, waived components and uses. Only a replaced name this feature
   * already casts counts, so Multiattack's "replace one attack with a use of Spellcasting to cast X"
   * (whose spell the Spellcasting feature already builds) is left alone.
   */
  getReplacementCastSpells(spells: IMonsterSpellcastingSpell[]): IMonsterSpellcastingSpell[] {
    const replaceRegex = /\b(?:It|He|She|They|The [^.]+?) can replace (?:one|any) (?<replaced>[^.]+?) with (?<spells>[^.]+?)(?:,? if available)?\./gi;
    const known = new Set(spells.map((spell) => spell.name.toLowerCase()));
    const replacements: IMonsterSpellcastingSpell[] = [];

    for (const match of this.strippedHtml.matchAll(replaceRegex)) {
      const groups = match.groups;
      if (!groups) continue;
      const replacedName = groups.replaced.replace(/ spell$/i, "").trim().toLowerCase();
      const replaced = spells.find((spell) => spell.name.toLowerCase() === replacedName);
      if (!replaced) continue;

      const names = DDBDescriptions
        .splitStringByComma(groups.spells.replace(", or ", ", ").replace(" or ", ", "))
        .filter((n) => n.trim() !== "");
      for (const name of names) {
        const entry = DDBDescriptions.parseMonsterSpellEntry(name);
        if (known.has(entry.name.toLowerCase())) continue;
        known.add(entry.name.toLowerCase());

        const spell: IMonsterSpellcastingSpell = { name: entry.name };
        if (entry.level) spell.level = entry.level;
        if (entry.extra) spell.extra = entry.extra;
        if (entry.targetSelf) spell.targetSelf = true;
        if (entry.duration) spell.duration = entry.duration;
        if (replaced.ignoredComponents) spell.ignoredComponents = [...replaced.ignoredComponents];
        if (replaced.ability) spell.ability = replaced.ability;
        if (replaced.consumeType) spell.consumeType = replaced.consumeType;
        if (replaced.quantity) spell.quantity = replaced.quantity;
        if (replaced.period) spell.period = replaced.period;
        replacements.push(spell);
      }
    }

    return replacements;
  }

  async #buildOtherSpellActivities() {
    const spells = this.getOtherCastSpells();
    if (spells.length > 0) {
      await this.#buildSpellcastingActivities(spells);
    }
  }

  async #handleSpellCasting() {
    if (!this.useCastActivity) return;
    if (this.isBlockSummary) return;
    this.#generateSpellcastingData();

    const spellcastingMatch = this.originalName.startsWith("Spellcasting")
      || this.originalName.startsWith("Innate Spellcasting");

    if (spellcastingMatch) {
      // parsed spells use null for a missing duration; the spellcasting shape wants it absent
      const spells = this.#getSpellcastingSpells()
        .map((spell): IMonsterSpellcastingSpell => ({ ...spell, duration: spell.duration ?? undefined }));
      await this.#buildSpellcastingActivities(spells);
    } else {
      await this.#buildOtherSpellActivities();
    }

    if (Object.keys(this.data.system.activities).length > 0) {
      this.ignoreActivityGeneration = true;
      if (spellcastingMatch) {
        this.data.system.uses = {
          spent: null,
          recovery: [],
          max: "",
        };
      }
    }

  }

  flagCleanup() {
    delete this.data.flags.ddbimporter?.defaultAdditionalActivities;
    delete this.data.flags.monsterMunch?.description;
    if (this.stripFlagData) {
      delete this.data.flags.monsterMunch?.actionData;
    }
  }

  async parse() {

    await this.enricher.init();

    this.#generateActionData();
    switch (this.type) {
      case "action":
      case "mythic":
      case "reaction":
      case "bonus":
        this.#buildAction();
        break;
      case "lair":
        this.#buildLair();
        break;
      case "legendary":
        this.#buildLegendary();
        break;
      case "villain":
        this.#buildVillain();
        break;
      case "special":
        this.#buildSpecial();
        break;
      default:
        logger.error(`Unknown action parsing type ${this.type}`, { DDBFeature: this });
        throw new Error(`Unknown action parsing type ${this.type}`);
    }

    // A feature with limited uses of its own spends one when used. Recharge sets this where its
    // uses are read; "(1/Day)" and "Recharges after a Short or Long Rest" give the item uses but
    // no consumption of their own, so it is added here. Every activity of the feature spends from the
    // same pool, which is also what a conditional weapon attack wants in either mode. An at-will
    // feature has no uses and must not acquire a target; Legendary Resistance and a legendary
    // action's cost already carry their own.
    if (this.data.system.uses?.max && !this.actionData.consumptionValue
      && this.actionData.consumptionTargets.length === 0) {
      this.actionData.consumptionValue = "1";
    }

    if (!this.actionCopy && !this.isBlockSummary) {
      await this.#handleSpellCasting();
      this.#generateMultiSaveActivities();
      await this._generateActivity({ name: this.#primaryActivityName }, this.#primaryActivityOptions);
      this.#addHealAdditionalActivities();
      this.#queueDamageModes();
      this.#queueNaturalWeaponAlternative();
      this.#queueRecurringDamage();
      this.#queueReleaseChecks();
      this.#queueLairOptionUtilities();
      await this.#buildLairCastOptions();
      if (this.enricher.addAutoAdditionalActivities) {
        await this._generateAdditionalActivities();
      }
      await this.enricher.addAdditionalActivities(this);
      this.#warnUnbuiltRecurringDamage();
      this._generateEffects();
    }

    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionData.damage", this.actionData.damage);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionData.damageParts", this.actionData.damageParts);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionData.baseAbility", this.actionData.baseAbility);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionData.toHit", this.toHit);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionData.proficient", this.actionData.proficient);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionData.extraAttackBonus", this.actionData.extraAttackBonus);

    if (this.levelBonus) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.levelBonus", true);
    }
    if (this.profBonus) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.profBonus", true);
    }
    await this.#generateDescription();

    await this.enricher.addDocumentAdvancements();
    await this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(this.data.name.toLowerCase());

    this.flagCleanup();

    await this.enricher.cleanup();

    logger.debug(`Parsed Feature ${this.name} for ${this.ddbMonster.name}`, { feature: this });

  }

}
