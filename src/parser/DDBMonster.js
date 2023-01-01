/* eslint-disable require-atomic-updates */

import { getSpells } from "./monster/spells.js";
import { newNPC } from "./monster/templates/monster.js";
import { specialCases } from "./monster/special.js";
import { monsterFeatureEffectAdjustment } from "../effects/specialMonsters.js";

import logger from '../logger.js';
import DICTIONARY from "../dictionary.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import { DDBFeatureFactory } from "./monster/features/DDBFeatureFactory.js";
import SETTINGS from "../settings.js";

import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBProxy from "../lib/DDBProxy.js";

/**
 *
 * @param {[string]} items Array of Strings or
 */
async function retrieveCompendiumItems(items, compendiumName) {
  const GET_ENTITY = true;

  const itemNames = items.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "name")) return item.name;
    return "";
  });

  const results = await CompendiumHelper.queryCompendiumEntries(compendiumName, itemNames, GET_ENTITY);
  const cleanResults = results.filter((item) => item !== null);

  return cleanResults;
}

/**
 *
 * @param {[items]} spells Array of Strings or items
 */
async function retrieveCompendiumSpells(spells) {
  const compendiumName = await game.settings.get(SETTINGS.MODULE_ID, "entity-spell-compendium");
  const compendiumItems = await retrieveCompendiumItems(spells, compendiumName);
  const itemData = compendiumItems.map((i) => {
    let spell = i.toObject();
    delete spell._id;
    return spell;
  });

  return itemData;
}

function getSpellEdgeCase(spell, type, spellList) {
  const edgeCases = spellList.edgeCases;
  const edgeCase = edgeCases.find((edge) => edge.name.toLowerCase() === spell.name.toLowerCase() && edge.type === type);

  if (edgeCase) {
    logger.debug(`Spell edge case for ${spell.name}`);
    switch (edgeCase.edge.toLowerCase()) {
      case "self":
      case "self only":
        spell.system.target.type = "self";
        logger.debug("spell target changed to self");
        break;
      // no default
    }
    spell.name = `${spell.name} (${edgeCase.edge})`;
    spell.system.description.chat = `<p><b>Special Notes: ${edgeCase.edge}.</b></p>\n\n${spell.system.description.chat}`;
    spell.system.description.value = `<p><b>Special Notes: ${edgeCase.edge}.</b></p>\n\n${spell.system.description.value}`;

    const diceSearch = /(\d+)d(\d+)/;
    const diceMatch = edgeCase.edge.match(diceSearch);
    if (diceMatch) {
      if (spell.system.damage.parts[0] && spell.system.damage.parts[0][0]) {
        spell.system.damage.parts[0][0] = diceMatch[0];
      } else if (spell.system.damage.parts[0]) {
        spell.system.damage.parts[0] = [diceMatch[0]];
      } else {
        spell.system.damage.parts = [[diceMatch[0]]];
      }
    }

    // save DC 12
    const saveSearch = /save DC (\d+)/;
    const saveMatch = edgeCase.edge.match(saveSearch);
    if (saveMatch) {
      spell.system.save.dc = saveMatch[1];
      spell.system.save.scaling = "flat";
    }

  }

  // remove material components?
  if (!spellList.material) {
    spell.system.materials = {
      value: "",
      consumed: false,
      cost: 0,
      supply: 0
    };
    spell.system.components.material = false;
  }

}

export default class DDBMonster {

  setProperty(name, value) {
    if (this.overrides["name"]) {
      this[name] = this.overrides["name"];
    } else {
      this[name] = value;
    }
  }

  constructor(ddbObject = null, { existingNpc = null, extra = false, useItemAC = true,
    legacyName = true, addMonsterEffects = false } = {}, overrides = {}
  ) {
    this.source = ddbObject;

    // processing options
    this.extra = extra;
    this.npc = existingNpc;
    this.useItemAC = useItemAC;
    this.legacyName = legacyName;
    this.addMonsterEffects = addMonsterEffects;

    // some of this data can be overwritten, useful for mangling new actions
    this.overrides = overrides;

    // used by extra processing
    this.removedHitPoints = this.setProperty("removedHitPoints", (this.source?.removedHitPoints ?? 0));
    this.temporaryHitPoints = this.setProperty("temporaryHitPoints", (this.source?.temporaryHitPoints ?? 0));

    this.characterDescription = "";
    this.unexpectedDescription = null;


    // processing info
    this.name = overrides["name"] ?? (existingNpc ? existingNpc.name : null);
    this.abilities = null;
    this.proficiencyBonus = null;
    this.cr = 0;
    this.items = [];
    this.img = null;
    if (existingNpc) {
      this.proficiencyBonus = this.setProperty("proficiencyBonus", existingNpc.system.attributes.prof);
      this.cr = this.setProperty("cr", existingNpc.system.details.cr);
      this.abilities = this.setProperty("abilities", existingNpc.system.abilities);
      this.items = duplicate(existingNpc.items);
      this.img = existingNpc.img;
    }

    this.featureFactory = new DDBFeatureFactory({ ddbMonster: this });
  }

  async addSpells() {
    // check to see if we have munched flags to work on
    if (!this.npc?.flags?.monsterMunch?.spellList) {
      return;
    }

    const spellList = this.npc.flags.monsterMunch.spellList;
    logger.debug(`Spell List for edgecases`, spellList);
    const atWill = spellList.atwill;
    const klass = spellList.class;
    const innate = spellList.innate;
    const pact = spellList.pact;

    if (atWill.length !== 0) {
      logger.debug("Retrieving at Will spells:", atWill);
      let spells = await retrieveCompendiumSpells(atWill);
      spells = spells.filter((spell) => spell !== null).map((spell) => {
        if (spell.system.level == 0) {
          spell.system.preparation = {
            mode: "prepared",
            prepared: false,
          };
        } else {
          spell.system.preparation = {
            mode: "atwill",
            prepared: false,
          };
          spell.system.uses = {
            value: null,
            max: null,
            per: "",
          };
        }
        getSpellEdgeCase(spell, "atwill", spellList);
        return spell;
      });
      this.npc.items = this.npc.items.concat(spells);
    }

    // class spells
    if (klass.length !== 0) {
      logger.debug("Retrieving class spells:", klass);
      let spells = await retrieveCompendiumSpells(klass);
      spells = spells.filter((spell) => spell !== null).map((spell) => {
        spell.system.preparation = {
          mode: "prepared",
          prepared: true,
        };
        getSpellEdgeCase(spell, "class", spellList);
        return spell;
      });
      this.npc.items = this.npc.items.concat(spells);
    }

    // pact spells
    if (pact.length !== 0) {
      logger.debug("Retrieving pact spells:", pact);
      let spells = await retrieveCompendiumSpells(pact);
      spells = spells.filter((spell) => spell !== null).map((spell) => {
        spell.system.preparation = {
          mode: "pact",
          prepared: true,
        };
        getSpellEdgeCase(spell, "pact", spellList);
        return spell;
      });
      this.npc.items = this.npc.items.concat(spells);
    }

    // innate spells
    if (innate.length !== 0) {
      // innate:
      // {name: "", type: "srt/lng/day", value: 0}
      logger.debug("Retrieving innate spells:", innate);
      const spells = await retrieveCompendiumSpells(innate);
      const innateSpells = spells.filter((spell) => spell !== null)
        .map((spell) => {
          const spellInfo = innate.find((w) => w.name.toLowerCase() == spell.name.toLowerCase());
          if (spellInfo) {
            const isAtWill = hasProperty(spellInfo, "innate") && !spellInfo.innate;
            if (spell.system.level == 0) {
              spell.system.preparation = {
                mode: "prepared",
                prepared: false,
              };
            } else {
              spell.system.preparation = {
                mode: isAtWill ? "atwill" : "innate",
                prepared: !isAtWill,
              };
            }
            if (isAtWill && spellInfo.type === "atwill") {
              spell.system.uses = {
                value: null,
                max: null,
                per: "",
              };
            } else {
              const perLookup = DICTIONARY.resets.find((d) => d.id == spellInfo.type);
              const per = spellInfo.type === "atwill"
                ? null
                : (perLookup && perLookup.type)
                  ? perLookup.type
                  : "day";
              spell.system.uses = {
                value: spellInfo.value,
                max: spellInfo.value,
                per: per,
              };
            }
            getSpellEdgeCase(spell, "innate", spellList);
          }
          return spell;
        });
      this.npc.items = this.npc.items.concat(innateSpells);
    }
  }

  _calculateImage() {
    if (this.source) {
      this.img = (this.source.basicAvatarUrl) ? this.source.basicAvatarUrl : this.source.largeAvatarUrl;
      // foundry doesn't support gifs
      if (this.img && this.img.match(/.gif$/)) {
        this.img = null;
      }
    } else {
      this.img = null;
    }
  }

  _generateFlags() {
    this.npc.flags.monsterMunch = {
      url: this.source.url,
      img: (this.img) ? this.img : this.source.avatarUrl,
      tokenImg: this.source.avatarUrl,
    };
    this.npc.flags.ddbimporter = {
      id: this.source.id,
      entityTypeId: this.source.entityTypeId,
      // creatureGroup: monster.creatureGroup ? monster.creatureGroup : null,
      creatureGroupId: this.source.creatureGroupId ? this.source.creatureGroupId : null,
      creatureFlags: this.source.creatureFlags ? this.source.creatureFlags : [],
      automatedEvcoationAnimation: this.source.automatedEvcoationAnimation ? this.source.automatedEvcoationAnimation : undefined,
      version: CONFIG.DDBI.version,
      isLegacy: this.source.isLegacy,
    };
  }


  async fetchMonsterSourceFromDDB(id) {
    if (!id && Number.isInteger(id) && Number.isInteger(Number.parseInt(id))) {
      throw new Error("Please provide a monster ID (number) to fetch");
    }
    const cobaltCookie = getCobalt();
    const betaKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
    const parsingApi = DDBProxy.getProxy();

    const body = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
      ids: [Number.parseInt(id)],
    };

    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/proxy/monsters/ids`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
            logger.error(`API Failure:`, data.message);
            reject(data.message);
          }
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `monsters-raw.json`, "application/json");
          }
          return data;
        })
        .then((data) => {
          logger.info(`Retrieved monster`, { monster: data.data });
          this.source = data.data[0];
          return data.data[0];
        })
        .catch((error) => reject(error));
    });
  }

  async #linkResourcesConsumption() {
    if (this.items.some((item) => item.system.recharge?.value)) {
      logger.debug(`Resource linking for ${this.name}`);
      this.items.forEach((item) => {
        if (item.system?.recharge?.value) {
          const itemID = randomID(16);
          item._id = itemID;
          if (item.type === "weapon") item.type = "feat";
          item.system.consume = {
            type: "charges",
            target: itemID,
            amount: null,
          };
        }
      });
    }
  }

  async parse() {
    if (!this.name) this.name = this.source.name;
    this.npc = duplicate(await newNPC(this.name));
    this._calculateImage();

    this.npc.prototypeToken.name = this.name;
    this._generateFlags();


    this.proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
    this.npc.system.attributes.prof = this.proficiencyBonus;
    this._generateAbilities();

    // skills are different with extras, because DDB
    if (this.extra) {
      this._generateSkills();
    } else {
      this._generateSkillsHTML();
    }

    // Senses needed for actor and token
    this._generateSenses();
    this._generateTokenSenses();

    this._generateDamageImmunities();
    this._generateDamageResistances();
    this._generateDamageVulnerabilities();
    this._generateConditionImmunities();
    this._generateSize();
    this._generateLanguages();
    this._generateHitPoints();
    this._generateMovement();
    await this._generateAC();

    this.cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
    this._generateType();

    const alignment = CONFIG.DDB.alignments.find((c) => this.source.alignmentId == c.id);
    this.npc.system.details.alignment = alignment ? alignment.name : "";
    this.npc.system.details.cr = this.cr.value;
    this.npc.system.details.xp = { value: this.cr.xp };

    this._generateSource();
    this._generateEnvironments();
    this.npc.system.details.biography.value = this.source.characteristicsDescription;

    this._generateFeatures();

    // Spellcasting
    const spellcastingData = getSpells(this.source);
    this.npc.system.attributes.spellcasting = spellcastingData.spellcasting;
    this.npc.system.attributes.spelldc = spellcastingData.spelldc;
    this.npc.system.attributes.spellLevel = spellcastingData.spellLevel;
    this.npc.system.details.spellLevel = spellcastingData.spellLevel;
    this.npc.system.spells = spellcastingData.spells;
    this.npc.flags.monsterMunch['spellList'] = spellcastingData.spellList;

    const badItems = this.items.filter((i) => i.name === "" || !i.name);
    if (badItems.length > 0) {
      logger.error(`${this.source.name} - ${badItems.length} items have no name.`, badItems);
      this.items = this.items.filter((i) => i.name && i.name !== "");
    }

    await this.#linkResourcesConsumption();
    this.npc.items = this.items;

    if (this.legacyName) {
      if (this.source.isLegacy) {
        this.npc.name += " (Legacy)";
        this.npc.prototypeToken.name += " (Legacy)";
      }
    }

    this.npc = await CompendiumHelper.existingActorCheck("monster", this.npc);

    logger.debug("Importing Spells");
    await this.addSpells();

    this.npc = specialCases(this.npc);
    if (this.addMonsterEffects) {
      this.npc = await monsterFeatureEffectAdjustment(this.npc, this.source);
    }

    console.warn(`Generated ${this.name}`, this);
    return this.npc;

  }

}
