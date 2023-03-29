

import { newNPC } from "./monster/templates/monster.js";
import { specialCases } from "./monster/special.js";
import { monsterFeatureEffectAdjustment } from "../effects/specialMonsters.js";

import logger from '../logger.js';
import CompendiumHelper from "../lib/CompendiumHelper.js";
import { DDBFeatureFactory } from "./monster/features/DDBFeatureFactory.js";
import SETTINGS from "../settings.js";

import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBProxy from "../lib/DDBProxy.js";
import { applyChrisPremadeEffect } from "../effects/chrisPremades.js";

export default class DDBMonster {

  setProperty(name, value) {
    if (this.overrides["name"]) {
      this[name] = this.overrides["name"];
    } else {
      this[name] = value;
    }
  }

  constructor(ddbObject = null, { existingNpc = null, extra = false, useItemAC = true,
    legacyName = true, addMonsterEffects = false, addChrisPremades = false } = {}, overrides = {}
  ) {
    this.source = ddbObject;

    // processing options
    this.extra = extra;
    this.npc = existingNpc;
    this.useItemAC = useItemAC;
    this.legacyName = legacyName;
    this.addMonsterEffects = addMonsterEffects;
    this.addChrisPremades = addChrisPremades;

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
          if (item.type === "weapon") {
            item.type = "feat";
            delete item.system.weaponType;
            item.system.type = {
              value: "monster",
              subtype: "",
            };
          }
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

    await this._generateFeatures();

    // Spellcasting
    this._generateSpells();
    await this.addSpells();

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
    this.npc = specialCases(this.npc);

    if (this.addMonsterEffects) {
      this.npc = await monsterFeatureEffectAdjustment(this);
    }

    if (this.addChrisPremades) {
      for (let item of this.npc.items) {
        // eslint-disable-next-line no-await-in-loop
        await applyChrisPremadeEffect({ document: item, type: "monsterfeatures", folderName: this.npc.name });
      }
    }

    logger.debug(`Generated ${this.name}`, this);
    return this.npc;

  }

}
