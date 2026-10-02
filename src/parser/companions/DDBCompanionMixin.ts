import { DICTIONARY } from "../../config/_module";
import { logger, DDBProxy, PatreonHelper, utils, fetchJson, DDBRunContext } from "../../lib/_module";
import DDBMonster from "../DDBMonster";
import DDBMonsterFactory from "../DDBMonsterFactory";
import DDBMonsterFeatureFactory from "../monster/features/DDBMonsterFeatureFactory";
import { newNPC } from "../monster/templates/monster";
import { DDBMonsterFeatureEnricher } from "../enrichers/_module";
import { DDBMonsterFeatureActivity } from "../activities/_module";
import { baseItemEffect } from "../../effects/effects";
import { ChangeHelper } from "../enrichers/effects/_module";


export default class DDBCompanionMixin {

  /**
   * The parsed companion actor's version. A stored compendium companion with a lower version is
   * rewritten on the next import even when the muncher's "update existing" policy is off, so bump
   * this when a change alters the companion actors themselves (stat block parsing, monster feature
   * enrichers such as the Vestige Companion's), not only the summoning feature.
   */
  static VERSION = 3;

  /**
   * A bond trait handing the companion the summoner's proficiency: "Add your Proficiency Bonus to
   * any ability check or saving throw the vestige makes" (Pact Bond), and the same sentence for a
   * beast, a grim or a defender, some with "attack roll" in the list.
   */
  static PROFICIENCY_BOND = /Add your Proficiency Bonus to any ability check(?:, attack roll,)? or saving throw (?:that )?the [\w' -]{1,40}? makes/i;
  // npc, data and name are populated by parse() before consumers read them
  npc!: I5eMonsterData;
  data!: I5eMonsterData;
  parsed: boolean;
  type: string | undefined;
  subType: string | undefined;
  rules: T5eRulesVersion | undefined;
  options: IDDBCompanionMixinOptions;
  block: HTMLElement;
  useItemAC: boolean;
  legacyName: boolean;
  addMonsterEffects: boolean;
  removeSplitCreatureActions: boolean;
  removeCreatureOnlyNames: boolean;
  addChrisPremades: boolean;
  summons: IDDBCompanionSummons;
  statBlockOverride: IDDBStatBlockOverride;
  // the block's numeric challenge rating; null when it prints "None", "—" or no challenge at all
  challengeRating: number | null;
  name!: string;

  constructor(block: HTMLElement | string, options: IDDBCompanionMixinOptions = {}, {
    addMonsterEffects = false, removeSplitCreatureActions = true, removeCreatureOnlyNames = true,
    addChrisPremades = true, useItemAC = false, legacyName = false,
  }: IDDBCompanionMixinParserOptions = {}) {
    // console.warn("DDBCompanion", { block });
    this.options = options;
    this.block = typeof block === "string"
      ? new DOMParser().parseFromString(block, "text/html").body
      : block;
    this.parsed = false;
    this.type = this.options.type;
    this.subType = this.options.subType;
    this.rules = this.options.rules;

    this.useItemAC = useItemAC; // game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");
    this.legacyName = legacyName; // game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    this.addMonsterEffects = addMonsterEffects; // game.settings.get("ddb-importer", "munching-policy-add-monster-midi-effects");
    this.removeSplitCreatureActions = removeSplitCreatureActions;
    // a template keeps its "(Air Only)" trait names, as the book's combined stat block does
    this.removeCreatureOnlyNames = removeCreatureOnlyNames && !this.options.template;
    this.statBlockOverride = {};
    this.challengeRating = null;
    this.addChrisPremades = addChrisPremades;

    this.summons = {
      match: {
        proficiency: false,
        attacks: false,
        saves: false,
        disposition: true,
      },
      creatureSizes: [],
      creatureTypes: [],
      bonuses: {
        ac: "",
        hp: "",
        hd: "",
        attackDamage: "",
        saveDamage: "",
        healing: "",
      },
      profiles: [],
      summon: {
        identifier: "",
        mode: "", // cr for cr based cusooms
        prompt: true,
      },
    };
  }

  /**
   * An enriched image map entry by exact name, then by the name without its "(variant)" suffix.
   * The 2014 and 2024 printings share most summon names, so at each step a ruleset key
   * ("Steel Defender [2024]") is preferred over the plain name, which covers both.
   */
  static findEnrichedEntry<T>(
    entries: Record<string, T> | undefined | null,
    name: string,
    rules?: T5eRulesVersion | null,
  ): T | undefined {
    if (!entries) return undefined;
    const base = name.split("(")[0].trim();
    const keys = rules
      ? [`${name} [${rules}]`, name, `${base} [${rules}]`, base]
      : [name, base];
    for (const key of keys) {
      if (entries[key]) return entries[key];
    }
    return undefined;
  }

  static async getEnrichedImageData(document: I5eMonsterData, rules?: T5eRulesVersion | null): Promise<IDDBEnrichedImageData | null> {
    const tiers = await PatreonHelper.checkPatreon({ cacheBust: false });
    if (!tiers.all || DDBProxy.isCustom(true)) return null;
    const name = document.name;
    // this endpoint is not supported in custom proxies
    if (!CONFIG.DDBI.EXTRA_IMAGES) {
      const path = "/proxy/enriched/actor/images";
      const parsingApi = DDBProxy.getProxy();
      const j = await fetchJson(`${parsingApi}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!j.success) return null;
      foundry.utils.setProperty(CONFIG, "DDBI.EXTRA_IMAGES", j.data);
    }

    const summons = DDBCompanionMixin.findEnrichedEntry(CONFIG.DDBI.EXTRA_IMAGES?.summons, name, rules);
    const snips = DDBCompanionMixin.findEnrichedEntry(CONFIG.DDBI.EXTRA_IMAGES?.snips, name, rules);
    if (!summons && !snips) return null;

    return { ...(summons ?? {}), snips };
  }

  /** Point the munch flags at a snip, so getNPCImage downloads and cuts it. */
  static applyImageSnips(document: I5eMonsterData, snips: IDDBImageSnipEntry | undefined) {
    if (snips?.actor) {
      foundry.utils.setProperty(document, "flags.monsterMunch.img", snips.actor.url);
      foundry.utils.setProperty(document, "flags.monsterMunch.imgSnip", snips.actor);
    }
    if (snips?.token) {
      foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", snips.token.url);
      foundry.utils.setProperty(document, "flags.monsterMunch.tokenImgSnip", snips.token);
    }
  }

  /**
   * Point a summon's munch image flags at the proxy's enriched art. `rules` picks ruleset-specific
   * entries and defaults to the document's `system.source.rules`, so stubs built without a source
   * must pass it.
   */
  static async addEnrichedImageData(document: I5eMonsterData, rules?: T5eRulesVersion | null): Promise<I5eMonsterData> {
    if (!game.user.isGM && !DDBRunContext.keyPostfix) return document;
    if (DDBRunContext.ignoreEnrichedImages) return document;

    const data = await DDBCompanionMixin.getEnrichedImageData(document, rules ?? document.system?.source?.rules);
    if (!data) return document;

    foundry.utils.setProperty(document, "flags.monsterMunch.enrichedImages", true);

    // a snip replaces the image for its target, so a snipped avatar and token need no monster fetch
    const needsMonsterArt = !data.snips?.actor || !data.snips?.token;
    if (needsMonsterArt && data.monsterIDs && data.monsterIDs.length > 0) {
      const monsterFactory = new DDBMonsterFactory({ type: "summons" });

      // the proxy refuses by-id fetches outside its no-auth list for users without a Patreon key,
      // so a failed lookup falls back to the static actor/token urls rather than failing the import
      try {
        await monsterFactory.fetchDDBMonsterSourceData(DDBMonsterFactory.defaultFetchOptions(data.monsterIDs));
      } catch (error) {
        logger.warn(`Unable to fetch enriched summon images for ${document.name}, using fallback images`, error);
      }

      for (const monsterSource of monsterFactory.source) {
        const img = monsterSource.basicAvatarUrl ?? monsterSource.largeAvatarUrl ?? monsterSource.avatarUrl;
        const tokenImg = monsterSource.avatarUrl;
        foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", tokenImg);
        foundry.utils.setProperty(document, "flags.monsterMunch.img", img);
        DDBCompanionMixin.applyImageSnips(document, data.snips);
        return document;
      }
    }
    if (data.actor) {
      foundry.utils.setProperty(document, "flags.monsterMunch.img", data.actor);
    }
    if (data.token) {
      foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", data.token);
    }
    DDBCompanionMixin.applyImageSnips(document, data.snips);

    // future enhancement loop through the downloaded compendium monsters for image
    return document;
  }

  static getDamageAdjustments(data: string[]) {
    const values: string[] = [];
    const custom: string[] = [];
    const bypasses: string[] = [];
    const damageTypes = DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);

    data.forEach((adj) => {
      if (damageTypes.includes(adj.toLowerCase())) {
        values.push(adj.toLowerCase());
      } else if (adj.includes("physical")) {
        values.push("bludgeoning", "piercing", "slashing");
        bypasses.push("mgc");
      } else {
        custom.push(adj);
      }
    });

    const adjustments = {
      value: values,
      bypasses,
      custom: custom.join("; "),
    };

    return adjustments;
  }

  filterDamageConditions(data: string) {
    const subType = this.options.subType?.toLowerCase() ?? "";
    const onlyFiltered = data.split(/[;,]/).filter((state) => {
      if (state.includes("only")) {
        if (state.toLowerCase().includes(subType)) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    const conditions: string[] = [];

    onlyFiltered.forEach((state) => {
      const results = state
        .split("and")
        .map((s) => {
          if (s.includes("determined by the")) {
            return subType;
          } else {
            return s.split("(")[0].trim().toLowerCase();
          }
        });
      conditions.push(...results);
    });

    return conditions;
  }

  async getFeature(text: string, type: TDDBMonsterActionType) {
    const enricher = new DDBMonsterFeatureEnricher({ activityGenerator: DDBMonsterFeatureActivity });
    await enricher.init();
    const options = {
      enricher: enricher,
      extra: true,
      useItemAC: this.useItemAC,
      legacyName: this.legacyName,
      addMonsterEffects: this.addMonsterEffects,
      addChrisPremades: this.addChrisPremades,
      forceRulesVersion: this.options.forceRulesVersion,
    };
    const ddbMonster = new DDBMonster(null, options);
    ddbMonster.name = this.name;
    // the companion npc stub is also built from a full Actor document
    ddbMonster.npc = this.npc as TParsedMonsterData;
    ddbMonster.abilities = ddbMonster.npc.system.abilities as typeof ddbMonster.abilities;
    ddbMonster.proficiencyBonus = 0;
    const featureFactory = new DDBMonsterFeatureFactory({
      ddbMonster,
      hideDescription: false,
      updateExisting: false,
    });
    await featureFactory.generateActions(text, type);
    // console.warn("Generating companion feature", { text, type, featureFactory });
    const toHitRegex = /(your spell attack modifier to hit|equals your spell attack modifier)/i;
    if (toHitRegex.test(text)) {
      this.summons.match.attacks = true;
    }
    const spellSaveRegex = /((against|equals) your spell save DC)/i;
    if (spellSaveRegex.test(text)) {
      this.summons.match.saves = true;
    }
    const features = featureFactory.getFeatures(type);
    if (DDBCompanionMixin.PROFICIENCY_BOND.test(text.replaceAll("’", "'"))) {
      this.summons.match.proficiency = true;
      this._addProficiencyBondEffect(features);
    }
    return features;
  }

  /**
   * "Add your Proficiency Bonus to any ability check or saving throw the vestige makes": the bond
   * trait carries the official Pact Bond effect, proficiency in every check and save. Skills then
   * list in the stat block and initiative, which is not proficient, stays the Dexterity modifier.
   * dnd5e does not store these proficiency fields, so only an effect can set them. The check and
   * save bonuses are emptied because companions stored before this carried "@prof" there.
   */
  _addProficiencyBondEffect(features: I5eMonsterItem[]) {
    const bond = features.find((feature) => DDBCompanionMixin.PROFICIENCY_BOND.test(
      utils.stripHtml(feature.system?.description?.value ?? "").replaceAll("’", "'"),
    ));
    foundry.utils.setProperty(this.npc, "system.rolls.ability.check.bonus", "");
    foundry.utils.setProperty(this.npc, "system.rolls.ability.save.bonus", "");
    if (!bond) {
      logger.warn(`Companion ${this.npc.name} has a proficiency bond but no trait to carry its effect`);
      return;
    }
    const effect = baseItemEffect(bond, bond.name);
    effect.system.changes.push(
      ChangeHelper.change({ value: "1", priority: 20, key: "system.rolls.ability.check.proficiency", type: "override", phase: "initial" }),
      ChangeHelper.change({ value: "1", priority: 20, key: "system.rolls.ability.save.proficiency", type: "override", phase: "initial" }),
    );
    bond.effects ??= [];
    bond.effects.push(effect);
  }

  // async _processFeatureElements(element, featType) {
  //   let next = element.nextElementSibling;

  //   if (!next) return { next, featType };

  //   switch (next.innerText.trim().toLowerCase()) {
  //     case "action":
  //     case "actions":
  //       logger.debug("Companion parsing switching to actions");
  //       return { next, featType: "action" };
  //     case "reaction":
  //     case "reactions":
  //       logger.debug("Companion parsing switching to reactions");
  //       return { next, featType: "reaction" };
  //     case "bonus actions":
  //     case "bonus":
  //     case "bonus action":
  //       logger.debug("Companion parsing switching to bonus actions");
  //       return { next, featType: "bonus" };
  //     // no default
  //   }

  //   const result = await this._processFeatureElement(next, featType);

  //   return result;
  // }


  /** @override */

  async _generate() {
    // this.#generateSize();
    // this.#generateType();
    // this.#generateAbilities();
    // this.#generateSavingThrows();
    // this.#generateArmorClass();
    // this.#generateProficiencyBonus();
    // this.#generateHitPoints();
    // this.#generateHitDie();
    // this.#generateSkills();
    // this.#generateImmunities();
    // this.#generateResistances();
    // this.#generateVulnerabilities();
    // this.#generateConditions();
    // this.#generateAlignment();
    // this.#generateSenses();
    // this.#generateLanguages();
    // this.#generateSpeed();
    // await this.#generateFeatures();
  }

  async parse() {
    // console.warn("PARSE COMPANION", { block: this.block, aThis: this });
    const name = this.options.name ?? this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Title")?.innerHTML;
    const namePostfix = this.options.subType
      ? `(${this.options.subType})`
      : "";

    if (!name) return;
    this.name = name;
    logger.debug(`Beginning companion parse for ${name}`, { name, block: this.block, this: this });

    const actorName = `${name} ${namePostfix}`.trim();
    this.npc = newNPC(actorName);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.companion.modifiers", {});
    foundry.utils.setProperty(this.npc, "prototypeToken.name", actorName);

    const templatePostfix = this.options.template ? "-template" : "";
    const summonsKey = `companion-${utils.normalizeString(actorName)}-${this.rules}${templatePostfix}`;
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.changes", []);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.name", `${name}`);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.id", summonsKey);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.entityTypeId", `companion-${this.type}`);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.summonsKey", summonsKey);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.version", DDBCompanionMixin.VERSION);
    if (this.options.folderHint) foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.folder", this.options.folderHint);
    if (this.options.template) foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.template", true);

    foundry.utils.setProperty(this.npc, "system.source.rules", this.rules);
    await this._generate();
    // the actor data model defaults to CR 1; companions without one are CR 0, as the official ones are
    const details = this.npc.system.details;
    if (details) details.cr = this.challengeRating ?? 0;
    // a block with no challenge line (Vestige Companion) still uses the summoner's bonus
    if (!this.statBlockOverride.pb && this.summons.match.proficiency) {
      this.statBlockOverride.pb = this.rules === "2014" ? "equals your bonus" : "PB equals your Proficiency Bonus";
    }
    if (Object.keys(this.statBlockOverride).length > 0) {
      foundry.utils.setProperty(this.npc, "flags.dnd5e.statBlockOverride", this.statBlockOverride);
    }

    // make friendly
    foundry.utils.setProperty(this.npc, "prototypeToken.disposition", 1);

    const data = await DDBCompanionMixin.addEnrichedImageData(foundry.utils.duplicate(this.npc) as unknown as I5eMonsterData);

    this.data = data;
    this.parsed = true;

    logger.debug(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
  }

  /** A "(Brute only)" style marker, with any qualifier before the form list ("hover; Flyer only"). */
  static FORM_ONLY_MARKER = /\s*\(([^()]*?)\bonly\)/i;

  /** Separators between a stat block value's terms, outside parentheses. */
  static FORM_TERM_SEPARATOR = /^(?:\s*[;,]\s*|\s+or\s+|\s*\+\s*)/i;

  /**
   * The text of a multi-form stat block value as it reads for one form. Terms marked for other
   * forms are dropped along with the separator that follows them, and the form's own marker is
   * removed, so for Brute "30 (Brute only) or 20 (Flyer or Stalker only) + 5 for each spell
   * level above 2" reads "30 + 5 for each spell level above 2", and for Flyer
   * "40 ft., Fly 30 ft. (hover; Flyer only), Swim 30 ft." keeps "Fly 30 ft. (hover)". Without a
   * form the text is returned whole, which is what a combined template shows.
   */
  static formText(text: string, subType?: string): string {
    const clean = text.replaceAll("\u00a0", " ").replace(/\s+/g, " ").trim();
    if (!subType) return clean;
    // "Beast of the Sky" may be marked "(Sky only)"
    const formNames = [subType, subType.split(" ").pop() ?? subType].map((n) => utils.escapeRegExp(n.trim()));
    const form = new RegExp(`\\b(?:${formNames.join("|")})\\b`, "i");

    // alternating terms and the separators between them
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (let i = 0; i < clean.length; i++) {
      const character = clean[i];
      if (character === "(") depth++;
      else if (character === ")") depth = Math.max(0, depth - 1);
      else if (depth === 0) {
        const separator = clean.slice(i).match(DDBCompanionMixin.FORM_TERM_SEPARATOR);
        if (separator) {
          parts.push(current, separator[0]);
          current = "";
          i += separator[0].length - 1;
          continue;
        }
      }
      current += character;
    }
    parts.push(current);

    let result = "";
    let pendingSeparator = "";
    let first = true;
    for (let i = 0; i < parts.length; i += 2) {
      const following = parts[i + 1] ?? "";
      const marker = parts[i].match(DDBCompanionMixin.FORM_ONLY_MARKER);
      if (marker && !form.test(marker[1])) {
        // the separator after a dropped term joins its neighbours: "30 + 5", not "30 or 5"
        if (!first) pendingSeparator = following;
        continue;
      }
      let term = parts[i];
      if (marker) {
        const qualifier = marker[1].split(";").slice(0, -1).join(";").trim();
        term = term.replace(marker[0], qualifier ? ` (${qualifier})` : "");
      }
      result += `${first ? "" : pendingSeparator}${term}`;
      first = false;
      pendingSeparator = following;
    }
    return result.trim();
  }

  /**
   * The stat block text dnd5e shows when this companion is embedded (`@Embed[... statblock]`),
   * where the actor's own values cannot say it: scaling AC and HP ("11 + the spell's level"), the
   * printed speed, a creature tag naming several types or sizes, form-marked damage and condition
   * traits, and the "None" challenge with a Proficiency Bonus that "equals your Proficiency Bonus".
   */
  _addStatBlockOverrides({
    ac, hp, speed, tag, challenge, vulnerabilities, resistances, immunities, conditionImmunities,
  }: IDDBStatBlockOverrideText) {
    const subType = this.options.subType;
    const isPlainNumber = (text: string) => (/^\d+$/).test(text);

    if (ac) {
      const text = DDBCompanionMixin.formText(ac, subType);
      if (text && !isPlainNumber(text)) this.statBlockOverride.ac = text;
    }
    if (hp) {
      const text = DDBCompanionMixin.formText(hp, subType);
      if (text && !isPlainNumber(text)) this.statBlockOverride.hp = text;
    }
    // the book's spacing and punctuation ("40 ft.", not dnd5e's "40 ft"), as the official summons keep
    if (speed) {
      const text = DDBCompanionMixin.formText(speed, subType);
      if (text) this.statBlockOverride.speed = text;
    }
    // the actor's own traits already say what one form has; only the text with form markers needs
    // carrying across
    const formOnly: [keyof IDDBStatBlockOverride, string | null | undefined][] = [
      ["vulnerabilities", vulnerabilities],
      ["resistances", resistances],
      ["immunities", immunities],
      ["conditionImmunities", conditionImmunities],
    ];
    for (const [key, text] of formOnly) {
      if (!text || !(/\bonly\b/i).test(text)) continue;
      const formValue = DDBCompanionMixin.formText(text, subType);
      if (formValue) this.statBlockOverride[key] = formValue;
    }
    if (tag && (/\(|\bor\b|\bchoice\b/i).test(tag)) {
      this.statBlockOverride.tag = DDBCompanionMixin.formText(tag, subType);
    }
    if (challenge) this._addChallengeOverrides(DDBCompanionMixin.formText(challenge));
  }

  /**
   * 2024: "None (XP 0; PB equals your Proficiency Bonus)". 2014: "— Proficiency Bonus equals your
   * bonus", which the embed shows as a challenge with its XP and a separate Proficiency Bonus row.
   */
  _addChallengeOverrides(challenge: string) {
    const fractions: Record<string, number> = { "½": 0.5, "¼": 0.25, "⅛": 0.125, "1/2": 0.5, "1/4": 0.25, "1/8": 0.125 };
    const crValue = (text: string): number | null => {
      if (text in fractions) return fractions[text];
      return (/^\d+$/).test(text) ? Number.parseInt(text) : null;
    };

    const is2024 = (/\(.*\)\s*$/).test(challenge);
    if (is2024) {
      const match = challenge.match(/^(.*?)\s*\((.*)\)\s*$/);
      if (!match) return;
      const cr = match[1].trim();
      this.challengeRating = crValue(cr);
      const [xp, ...pbParts] = match[2].split(";");
      const pb = pbParts.join(";").trim();
      if (!pb || (/^PB\s*[+−-]?\d+$/i).test(pb)) return;
      this.statBlockOverride.pb = pb;
      if (this.challengeRating === null) {
        this.statBlockOverride.cr = cr;
        this.statBlockOverride.xp = xp.trim();
      }
      return;
    }

    const pbIndex = challenge.search(/Proficiency Bonus/i);
    const cr = (pbIndex === -1 ? challenge.split("(")[0] : challenge.slice(0, pbIndex)).trim();
    this.challengeRating = crValue(cr);
    if (pbIndex === -1) return;
    const pb = challenge.slice(pbIndex + "Proficiency Bonus".length).trim();
    if (!pb || (/^[+−-]?\d+$/).test(pb)) return;
    this.statBlockOverride.pb = pb;
    if (cr && this.challengeRating === null) {
      this.statBlockOverride.cr = cr;
      this.statBlockOverride.xp = "0 XP";
    }
  }

  _handleAc(acString: string) {
    const ac = Number.parseInt(acString.split(",")[0].split("plus")[0].trim());
    const attributes = this.npc.system.attributes;
    if (!attributes) {
      logger.warn(`Companion ${this.npc.name} has no system attributes, unable to set AC`);
      return;
    }

    if (Number.isInteger(ac)) {
      attributes.ac = {
        calcs: ["natural"],
        formulas: [],
        flat: ac,
        override: null,
      };

      // Keep form-specific flat bonuses on the actor so all forms can share
      // the summon activity's spell-level scaling (e.g. Celestial Defender).
      for (const match of acString.matchAll(/\+\s*(\d+)\s*\(([^)]+?) only\)/gi)) {
        if (match[2].trim().toLowerCase() === this.subType?.toLowerCase()) {
          attributes.ac.flat = (attributes.ac.flat ?? ac) + Number.parseInt(match[1]);
        }
      }

      const testString = utils.nameString(acString);
      if (testString.includes("plus PB") || acString.includes("+ PB")) {
        this.summons.bonuses.ac = "@prof";
      } else if (testString.includes("+ the level of the spell") || testString.includes("spell's level")) {
        this.summons.bonuses.ac = "@item.level";
      } else if (acString.match(/half your (\w+) level/i)) {
        // AU Semblance of Life spirit forms: "AC 11 + half your Warlock level (round down; maximum 9)"
        const halfMatch = acString.match(/half your (\w+) level(?:.*?maximum (\d+))?/i);
        const klass = halfMatch![1].toLowerCase();
        const half = `floor(@classes.${klass}.levels / 2)`;
        this.summons.bonuses.ac = halfMatch![2] ? `min(${halfMatch![2]}, ${half})` : half;
      } else {
        const modMatch = acString.match(/(?:\+|plus) your (\w+) modifier/i);
        if (modMatch) this.summons.bonuses.ac = `@abilities.${modMatch[1].toLowerCase().substring(0, 3)}.mod`;
      }
    }
  }

  _getBaseHitPoints(hpString: string) {
    const hpPrepared = hpString.toLowerCase().replaceAll(", ", " or ");
    const subType = this.subType?.toLowerCase();
    const baseString = subType && hpString.includes(" or ") && hpPrepared.includes(subType)
      ? hpPrepared.split(" or ").find((s) => s.includes(subType))
      : hpPrepared.trim();

    const hpFind = baseString?.trim().match(/(\d*)/);
    const hpInt = hpFind ? Number.parseInt(hpFind[0]) : NaN;
    return Number.isInteger(hpInt) ? hpInt : 0;
  }

  _handleHitPoints(hpString: string) {
    const hpInt = this._getBaseHitPoints(hpString);
    const hp = this.npc.system.attributes?.hp;
    if (!hp) {
      logger.warn(`Companion ${this.npc.name} has no hp attributes, unable to set hit points`);
      return;
    }
    hp.max = hpInt;
    hp.value = hpInt;

    // conditions
    // 5 + five times your druid level
    // 5 + five times your ranger level (the beast has a number of Hit Dice [d8s] equal to your ranger level)
    // 1 + your Intelligence modifier + your artificer level (the homunculus has a number of Hit Dice [d4s] equal to your artificer level)
    // 40 + 15 for each spell level above 4th
    // 20 (Air only) or 30 (Land and Water only) + 5 for each spell level above 2nd
    // 50 (Demon only) or 40 (Devil only) or 60 (Yugoloth only) + 15 for each spell level above 6th
    // 30 (Ghostly and Putrid only) or 20 (Skeletal only) + 10 for each spell level above 3rd
    // 5 + 5 per spell level

    // additional summon points
    const hpAdjustments: string[] = [];
    const modMatch = hpString.match(/\+ your (\w+) modifier/);

    if (modMatch) hpAdjustments.push(`@abilities.${modMatch[1].toLowerCase().substring(0, 3)}.mod`);

    // class level
    const klassMultiMatch = hpString.match(/(?:\+|plus) (\w+)?( times? )?your (\w+) level/);
    const twiceLevelMatch = hpString.match(/(?:twice|double) your (\w+) level/);
    const halfLevelMatch = hpString.match(/half your (\w+) level/i);
    if (halfLevelMatch) {
      const klass = halfLevelMatch[1].trim().toLowerCase();
      hpAdjustments.push(`floor(@classes.${klass}.levels / 2)`);
    } else if (klassMultiMatch) {
      const klass = klassMultiMatch[3].trim().toLowerCase();
      const multiplier = klassMultiMatch[1]
        ? DICTIONARY.numbers.find((d) => d.natural === klassMultiMatch[1].trim().toLowerCase())?.num ?? null
        : null;
      const multiplierString = multiplier ? ` * ${multiplier}` : "";
      hpAdjustments.push(`@classes.${klass}.levels${multiplierString}`);
    } else if (twiceLevelMatch) {
      const klass = twiceLevelMatch[1].trim().toLowerCase();
      hpAdjustments.push(`2 * @classes.${klass}.levels`);
    }

    // spell level
    const spellLevelMatch = hpString.match(/\+ (\d+) for each spell level above (\d)/);
    const basicSpellLevelMatch = hpString.match(/\+ (\d+) per spell level/);
    if (spellLevelMatch) {
      hpAdjustments.push(`${spellLevelMatch[1]} * (@item.level - ${spellLevelMatch[2]})`);
    } else if (basicSpellLevelMatch) {
      hpAdjustments.push(`${basicSpellLevelMatch[1]} * @item.level`);
    }

    if (hpAdjustments.length > 0) {
      this.summons.bonuses.hp = hpAdjustments.join(" + ");
    }
  }

  /**
   * Companions whose Hit Dice scale with a class or spell level. dnd5e reads an NPC's hit die size
   * and count from its HP formula (falling back to the size's die), and the summon activity's
   * `bonuses.hd` adds the scaling count when the creature is summoned. So the formula names the
   * printed die with no dice of its own, plus the base HP so that rolling it (dnd5e's auto-roll
   * when the actor is placed by hand) gives the printed base rather than 0.
   */
  _handleHitDice(hpString: string) {
    // (the beast has a number of Hit Dice [d8s] equal to your ranger level)
    // (the homunculus has a number of Hit Dice [d4s] equal to your artificer level)
    // (the spirit has a number of Hit Dice [d10s] equal to the spell's level)
    // (the steed has a number of Hit Dice [d10s] equal to the level of the spell)
    if (!hpString || !hpString.includes("number of Hit Dice")) return;

    const text = hpString.replaceAll("’", "'");
    const classHitDice = text.match(/number of Hit Dice \[d(\d+)s\] equal to your ([a-z][a-z ]*?) level/i);
    const spellHitDice = text.match(/number of Hit Dice \[d(\d+)s\] equal to (?:the spell's level|the level of the spell)/i);
    const hitDice = classHitDice ?? spellHitDice;
    if (!hitDice) return;

    const hp = this.npc.system.attributes?.hp;
    if (hp) {
      const base = Number(hp.max) > 0 ? ` + ${hp.max}` : "";
      hp.formula = `0d${hitDice[1]}${base}`;
    } else {
      logger.warn(`Companion ${this.npc.name} has no hp attributes, unable to set hit dice formula`);
    }

    // class identifiers are lowercase slugs, "Blood Hunter" is blood-hunter
    this.summons.bonuses.hd = classHitDice
      ? `@classes.${classHitDice[2].trim().toLowerCase().replace(/\s+/g, "-")}.levels`
      : "@item.level";
  }

  _handleSize(sizeString: string) {
    const subType = this.subType?.toLowerCase();
    const baseString = (subType && sizeString.toLowerCase().includes(subType)
      ? sizeString.toLowerCase().replaceAll(" (", " or ").split(" or ").find((s) => s.includes(subType))
      : sizeString.toLowerCase())
      ?? sizeString.toLowerCase();

    const size = baseString.split(" ")[0];
    const nameSize = subType
      ? DICTIONARY.sizes.find((s) => subType == s.name.toLowerCase())
      : null;
    const sizeData: IDDBActorSizeData = DICTIONARY.sizes.find((s) => size.toLowerCase() == s.name.toLowerCase())
      ?? { name: "Medium", value: "med", size: 1, scale: 1 } as IDDBActorSizeData;

    const finalSize = nameSize ?? sizeData;

    const traits = this.npc.system.traits;
    const token = this.npc.prototypeToken;
    if (!traits || !token?.texture) {
      logger.warn(`Companion ${this.npc.name} is missing traits or token data, unable to set size`);
      return;
    }
    traits.size = finalSize.value;
    token.width = finalSize.size;
    token.height = finalSize.size;
    token.texture.scaleX = finalSize.scale;
    token.texture.scaleY = finalSize.scale;
  }

  _handleType(typeString: string) {
    const type = this.npc.system.details?.type;
    if (!type) {
      logger.warn(`Companion ${this.npc.name} has no details type, unable to set creature type`);
      return;
    }
    if (CONFIG.DND5E.creatureTypes[typeString as keyof typeof CONFIG.DND5E.creatureTypes]) {
      type.value = typeString;
    } else {
      type.value = "Unknown";
    }
  }

  _handleAlignment(alignment: string | undefined) {
    if (alignment && alignment !== "") {
      const details = this.npc.system.details;
      if (!details) {
        logger.warn(`Companion ${this.npc.name} has no details, unable to set alignment`);
        return;
      }
      details.alignment = alignment;
    }
  }

  _handleSpeed(speedString: string) {
    // 30 ft.; fly 40 ft. (hover) (Ghostly only)
    // 40 ft.; climb 40 ft. (Demon only); fly 60 ft. (Devil only)
    // 30 ft., fly 40 ft.

    const subType = this.options.subType?.toLowerCase() ?? "";
    const onlyFiltered = speedString.split(/[;,]/).filter((speed) => {
      if (speed.toLowerCase().includes("only")) {
        if (speed.toLowerCase().includes(subType)) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    const speeds: string[] = [];
    onlyFiltered.forEach((state) => {
      const results = state
        .split("and")
        .map((s) => {
          return s.trim().toLowerCase();
        });
      speeds.push(...results);
    });

    const movement = this.npc.system.attributes?.movement;
    if (!movement) {
      logger.warn(`Companion ${this.npc.name} has no movement attributes, unable to set speed`);
      return;
    }
    speeds.forEach((speed) => {
      const match = speed.match(/(\w+ )*(\d+)/i);
      if (match) {
        const type = (match[1]?.trim() ?? "walk") as I5eMovementType;
        movement.speeds ??= {};
        movement.speeds[type] = `${match[2]}`;
        if (speed.includes("hover")) movement.hover = true;
      }
    });
  }

  _handleLanguages(languagesString: string) {
    // loop back to add small chance they have non-custom language support
    const languages = this.npc.system.traits?.languages;
    if (!languages) {
      logger.warn(`Companion ${this.npc.name} has no languages trait, unable to set languages`);
      return;
    }
    languages.custom = languagesString;
  }

  _handleSenses(sensesString: string) {
    // darkvision 60 ft., passive Perception 10 + (PB &times; 2)
    // darkvision 60 ft., passive Perception 10 + (PB × 2)
    const senses = this.npc.system.attributes?.senses;
    const token = this.npc.prototypeToken;
    if (!senses || !token) {
      logger.warn(`Companion ${this.npc.name} is missing senses or token data, unable to set senses`);
      return;
    }
    sensesString.split(",").forEach((sense) => {
      const match = sense.match(/(darkvision|blindsight|tremorsense|truesight)\s+(\d+)/i);

      if (match) {
        const value = parseInt(match[2]);
        senses.units = "ft";
        senses.ranges ??= {};
        senses.ranges[match[1].toLowerCase() as TSenseType] = value;

        const senseType = DICTIONARY.senseMap()[match[1].toLowerCase()];

        const sight = token.sight;
        if (sight && value > 0 && sight.range !== undefined && value > sight.range && foundry.utils.hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          foundry.utils.setProperty(sight, "visionMode", senseType);
          foundry.utils.setProperty(sight, "range", value);
          token.sight = foundry.utils.mergeObject(sight, foundry.utils.getProperty(CONFIG.Canvas.visionModes, `${senseType}.vision.defaults`) as object);
        }
        if (value > 0 && foundry.utils.hasProperty(DICTIONARY.detectionMap, match[1].toLowerCase())) {
          const detectionModeId = DICTIONARY.detectionMap[match[1].toLowerCase()];
          token.detectionModes ??= {};
          token.detectionModes[detectionModeId] = {
            range: value,
            enabled: true,
          };
        }
      }
    });
  }

  _handleConditions(conditionsString: string) {
    const values: string[] = [];
    const custom: string[] = [];

    conditionsString.split(",").forEach((adj) => {
      const valueAdjustment = DICTIONARY.conditions.find((condition) => condition.label.toLowerCase() == adj.trim().toLowerCase());
      if (valueAdjustment) {
        values.push(valueAdjustment.foundry);
      } else {
        custom.push(adj);
      }
    });

    // Condition Immunities charmed, exhaustion, frightened, incapacitated, paralyzed, petrified, poisoned
    const traits = this.npc.system.traits;
    if (!traits) {
      logger.warn(`Companion ${this.npc.name} has no traits, unable to set condition immunities`);
      return;
    }
    traits.ci = {
      value: values,
      custom: custom.join("; "),
    };
  }

  _handleDamageImmunities(damageImmunitiesString: string) {
    const traits = this.npc.system.traits;
    if (!traits) {
      logger.warn(`Companion ${this.npc.name} has no traits, unable to set damage immunities`);
      return;
    }
    const filtered = this.filterDamageConditions(damageImmunitiesString);
    traits.di = DDBCompanionMixin.getDamageAdjustments(filtered);
  }

  _handleDamageResistances(damageResistancesString: string) {
    const traits = this.npc.system.traits;
    if (!traits) {
      logger.warn(`Companion ${this.npc.name} has no traits, unable to set damage resistances`);
      return;
    }
    const filtered = this.filterDamageConditions(damageResistancesString);
    traits.dr = DDBCompanionMixin.getDamageAdjustments(filtered);
  }

  _handleDamageVulnerabilities(damageVulnerabilitiesString: string) {
    const traits = this.npc.system.traits;
    if (!traits) {
      logger.warn(`Companion ${this.npc.name} has no traits, unable to set damage vulnerabilities`);
      return;
    }
    const filtered = this.filterDamageConditions(damageVulnerabilitiesString);
    traits.dv = DDBCompanionMixin.getDamageAdjustments(filtered);
  }

  _handleSkills(skillsString: string) {

    //  "History + 12, Perception +0 plus PB &times; 2"
    const skillsMaps = skillsString.split(",").filter((str) => str != "").map((str) => {
      const skillMatch = str
        .replaceAll("[skill]", "")
        .replaceAll("[/skill]", "")
        .trim()
        .match(/(\w+ *\w* *\w*)(?: *)([+-])(?: *)(\d+) *(plus PB)? *(&times;x|×|times)? *(\d*)?/);
      let result: { name?: string; value?: string; proficient?: boolean; expertise?: boolean; pbMultiplier?: string } = {};
      if (skillMatch) {
        result = {
          name: skillMatch[1].trim(),
          value: skillMatch[2] + skillMatch[3],
          proficient: skillMatch[4] !== undefined,
          expertise: Number.isInteger(skillMatch[5]?.trim()),
          pbMultiplier: skillMatch[5],
        };
        logger.debug(`Found skill for companion ${this.npc.name}`, result);
      } else {
        logger.error(`Skill Parsing failed for ${this.npc.name}`);
        logger.debug(skillsString);
        logger.debug(str);
        logger.debug(skillMatch);
      }
      return result;
    });

    const skills = this.npc.system.skills;
    const abilities = this.npc.system.abilities;
    if (!skills || !abilities) {
      logger.warn(`Companion ${this.npc.name} is missing skills or abilities data, unable to parse skills`);
      return;
    }

    const keys = Object.keys(skills);
    const validSkills = DICTIONARY.actor.skills.map((skill) => skill.name);
    (keys as T5eSkillKey[])
      .filter((key) => validSkills.includes(key))
      .forEach((key) => {
        const skill = skills[key];
        const lookupSkill = DICTIONARY.actor.skills.find((s) => s.name == key);
        if (!lookupSkill) {
          logger.warn(`Unable to find skill lookup for companion skill ${key}`);
          return;
        }
        const skillData = skillsMaps.find((skl) => skl.name == lookupSkill.label);

        if (skillData && skillData.value !== undefined) {
          skill.value = skillData.expertise ? 2 : skillData.proficient ? 1 : 0;
          const ability = skill.ability ? abilities[skill.ability] : undefined;
          const mod = ability
            ? CONFIG.DDB.statModifiers.find((s) => s.value == ability.value)?.modifier
            : undefined;
          if (mod === undefined) {
            logger.warn(`Unable to determine ability modifier for companion skill ${key}`);
          } else if (parseInt(String(mod)) !== parseInt(skillData.value.trim())) {
            skill.bonuses ??= {};
            skill.bonuses.passive = String(parseInt(skillData.value.trim()) - parseInt(String(mod)));
            skill.roll = { ...(skill.roll ?? {}), bonus: String(parseInt(skillData.value.trim()) - parseInt(String(mod))) };
          }

          skills[key] = skill;
        }

      });
  }

}
