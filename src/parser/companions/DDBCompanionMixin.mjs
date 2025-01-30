import { DICTIONARY } from "../../config/_module.mjs";
import { logger, DDBProxy, PatreonHelper } from "../../lib/_module.mjs";
import DDBMonster from "../DDBMonster.js";
import DDBMonsterFactory from "../DDBMonsterFactory.js";
import DDBMonsterFeatureFactory from "../monster/features/DDBMonsterFeatureFactory.js";
import { newNPC } from "../monster/templates/monster.js";
import { DDBMonsterFeatureEnricher } from "../enrichers/_module.mjs";

export default class DDBCompanionMixin {

  constructor(block, options = {}, {
    addMonsterEffects = false, removeSplitCreatureActions = true, removeCreatureOnlyNames = true,
    addChrisPremades = true, useItemAC = false, legacyName = false,
  } = {}) {
    // console.warn("DDBCompanion", { block });
    this.options = options;
    this.block = block;
    this.npc = null;
    this.data = {};
    this.parsed = false;
    this.type = this.options.type;

    this.useItemAC = useItemAC; // game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");
    this.legacyName = legacyName; // game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    this.addMonsterEffects = addMonsterEffects; // game.settings.get("ddb-importer", "munching-policy-add-monster-midi-effects");
    this.removeSplitCreatureActions = removeSplitCreatureActions;
    this.removeCreatureOnlyNames = removeCreatureOnlyNames;
    this.addChrisPremades = addChrisPremades;

    this.summons = {
      match: {
        proficiency: false,
        attacks: false,
        saves: false,
      },
      creatureSizes: [],
      creatureTypes: [],
      bonuses: {
        ac: "",
        hp: "",
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

  static async getEnrichedImageData(document) {
    const tiers = await PatreonHelper.checkPatreon();
    if (!tiers.all || DDBProxy.isCustom()) return null;
    const name = document.name;
    // this endpoint is not supported in custom proxies
    if (!CONFIG.DDBI.EXTRA_IMAGES) {
      const path = "/proxy/enriched/actor/images";
      const parsingApi = DDBProxy.getProxy();
      const response = await fetch(`${parsingApi}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const j = await response.json();
      if (!j.success) return null;
      foundry.utils.setProperty(CONFIG, "DDBI.EXTRA_IMAGES", j.data);
    }

    if (!foundry.utils.hasProperty(CONFIG, "DDBI.EXTRA_IMAGES.summons")) return null;
    const data = CONFIG.DDBI.EXTRA_IMAGES.summons[name]
      ?? CONFIG.DDBI.EXTRA_IMAGES.summons[name.split("(")[0].trim()];

    return data;
  }

  static async addEnrichedImageData(document) {
    const data = await DDBCompanionMixin.getEnrichedImageData(document);

    if (!data) return document;

    foundry.utils.setProperty(document, "flags.monsterMunch.enrichedImages", true);

    if (data.monsterIDs && data.monsterIDs.length > 0) {
      const monsterFactory = new DDBMonsterFactory({ type: "summons" });

      await monsterFactory.fetchDDBMonsterSourceData(DDBMonsterFactory.defaultFetchOptions(data.monsterIDs));

      for (const monsterSource of monsterFactory.source) {
        const img = monsterSource.basicAvatarUrl ?? monsterSource.largeAvatarUrl ?? monsterSource.avatarUrl;
        const tokenImg = monsterSource.avatarUrl;
        foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", tokenImg);
        foundry.utils.setProperty(document, "flags.monsterMunch.img", img);
        return document;
      }
    }
    if (data.actor) {
      foundry.utils.setProperty(document, "flags.monsterMunch.img", data.actor);
    }
    if (data.token) {
      foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", data.token);
    }

    // future enhancement loop through the downloaded compendium monsters for image
    return document;
  }

  static getDamageAdjustments(data) {
    const values = [];
    const custom = [];
    const bypasses = [];
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

  filterDamageConditions(data) {
    const onlyFiltered = data.split(/[;,]/).filter((state) => {
      if (state.includes("only")) {
        if (state.toLowerCase().includes(this.options.subType.toLowerCase())) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    const conditions = [];

    onlyFiltered.forEach((state) => {
      const results = state
        .split("and")
        .map((s) => {
          if (s.includes("determined by the")) {
            return this.options.subType.toLowerCase();
          } else {
            return s.split("(")[0].trim().toLowerCase();
          }
        });
      conditions.push(...results);
    });

    return conditions;
  }

  async getFeature(text, type) {
    const enricher = new DDBMonsterFeatureEnricher();
    await enricher.init();
    const options = {
      enricher: enricher,
      extra: true,
      useItemAC: this.useItemAC,
      legacyName: this.legacyName,
      addMonsterEffects: this.addMonsterEffects,
      addChrisPremades: this.addChrisPremades,
    };
    const ddbMonster = new DDBMonster(null, options);
    ddbMonster.name = this.name;
    ddbMonster.npc = foundry.utils.duplicate(this.npc);
    ddbMonster.abilities = ddbMonster.npc.system.abilities;
    ddbMonster.proficiencyBonus = 0;
    const featureFactory = new DDBMonsterFeatureFactory({
      ddbMonster,
      hideDescription: false,
      updateExisting: false,
    });
    await featureFactory.generateActions(text, type);
    logger.debug("Generating companion feature", { text, type, featureFactory });
    const toHitRegex = /(your spell attack modifier to hit)/i;
    if (toHitRegex.test(text)) {
      this.summons.match.attacks = true;
    }
    const spellSaveRegex = /(against your spell save DC)/i;
    if (spellSaveRegex.test(text)) {
      this.summons.match.saves = true;
    }
    return featureFactory.getFeatures(type);
  }


  async _processFeatureElement(element, featType) {
    let next = element.nextElementSibling;

    if (!next) return { next, featType };

    switch (next.innerText.trim().toLowerCase()) {
      case "action":
      case "actions":
        logger.debug("Companion parsing switching to actions");
        return { next, featType: "action" };
      case "reaction":
      case "reactions":
        logger.debug("Companion parsing switching to reactions");
        return { next, featType: "reaction" };
      case "bonus actions":
      case "bonus":
      case "bonus action":
        logger.debug("Companion parsing switching to bonus actions");
        return { next, featType: "bonus" };
      // no default
    }

    const features = await this.getFeature(next.outerHTML, featType);
    features.forEach((feature) => {
      if (this.removeSplitCreatureActions && feature.name.toLowerCase().includes("only")
        && feature.name.toLowerCase().includes(this.options.subType.toLowerCase())
      ) {
        if (this.removeCreatureOnlyNames) feature.name = feature.name.split("only")[0].split("(")[0].trim();
        this.npc.items.push(feature);
      } else if (!this.removeSplitCreatureActions || !feature.name.toLowerCase().includes("only")) {
        this.npc.items.push(feature);
      }
      if (foundry.utils.getProperty(feature, "flags.ddbimporter.levelBonus")) {
        this.summons.bonuses.attackDamage = "@item.level";
        this.summons.bonuses.saveDamage = "@item.level";
      }
    });
    return { next, featType };
  }

  // #extraFeatures() {
  // if (this.name === "Drake Companion") {
  //   this.npc.flags["arbron-summoner"].config.actorChanges.push(
  //     {
  //       "key": "system.traits.size",
  //       "value": `@classes.ranger.levels > 6 ? "med" : "${sizeData.value}"`,
  //     },
  //     {
  //       "key": "prototypeToken.width",
  //       "value": `@classes.ranger.levels > 6 ? 1 : ${this.npc.prototypeToken.width}`,
  //     },
  //     {
  //       "key": "prototypeToken.height",
  //       "value": `@classes.ranger.levels > 6 ? 1 : ${this.npc.prototypeToken.height}`,
  //     },
  //     {
  //       "key": "prototypeToken.scale",
  //       "value": `@classes.ranger.levels > 6 ? 1 : ${this.npc.prototypeToken.scale}`,
  //     },
  //   );
  // }
  // }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
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
    const name = this.options.name ?? this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Title").innerHTML;
    const namePostfix = this.options.subType
      ? `(${this.options.subType})`
      : "";

    if (!name) return;
    this.name = name;
    logger.debug(`Beginning companion parse for ${name}`, { name, block: this.block });

    const actorName = `${name} ${namePostfix}`.trim();
    this.npc = newNPC(actorName);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.companion.modifiers", {});
    this.npc.prototypeToken.name = actorName;

    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.changes", []);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.name", `${name}`);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.id", `companion-${actorName}`);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.entityTypeId", `companion-${this.type}`);

    await this._generate();

    // make friendly
    foundry.utils.setProperty(this.npc, "prototypeToken.disposition", 1);

    const data = await DDBCompanionMixin.addEnrichedImageData(foundry.utils.duplicate(this.npc));

    this.data = data;
    this.parsed = true;

    logger.debug(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
  }

}
