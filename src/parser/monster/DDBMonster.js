/* eslint-disable require-atomic-updates */

import { getTokenSenses, getSenses } from "./senses.js";
import {
  getDamageImmunities,
  getDamageResistances,
  getDamageVulnerabilities,
  getConditionImmunities,
} from "./conditions.js";
import { getAbilities } from "./abilities.js";
import { getSkills, getSkillsHTML } from "./skills.js";
import { getLanguages } from "./languages.js";
import { getHitPoints } from "./hp.js";
import { getSpeed } from "./movement.js";
import { getSize } from "./size.js";
import { getSource } from "./source.js";
import { getEnvironments } from "./environments.js";
import { getLairActions } from "./features/lair.js";
import { getLegendaryActions } from "./features/legendary.js";
import { getActions } from "./features/actions.js";
import { getSpecialTraits } from "./features/specialtraits.js";
import { getSpells } from "./spells.js";
import { getType } from "./type.js";
import { generateAC } from "./ac.js";
import { newNPC } from "./templates/monster.js";
import { specialCases } from "./special.js";
import { monsterFeatureEffectAdjustment } from "../../effects/specialMonsters.js";

import logger from '../../logger.js';
import DICTIONARY from "../../dictionary.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";

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
async function retrieveSpells(spells) {
  const compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
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
    this.extra = extra;
    this.npc = existingNpc;
    this.useItemAC = useItemAC;
    this.legacyName = legacyName;
    this.addMonsterEffects = addMonsterEffects;
    this.items = [];
    this.img = null;
    this.name = overrides["name"] ? overrides["name"] : existingNpc ? existingNpc.name : null;
    this.overrides = overrides;
    this.removedHitPoints = this.setProperty("removedHitPoints", 0);
    this.temporaryHitPoints = this.setProperty("temporaryHitPoints", 0);
    this.actions = [];
    this.lairActions = [];
    this.legendaryActions = [];
    this.specialTraits = [];
    this.reactions = [];
    this.bonus = [];
    this.mythic = [];
    this.characterDescriptionAction = null;
    this.characterDescriptionReaction = null;
    this.unexpectedDescription = null;
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
      let spells = await retrieveSpells(atWill);
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
      let spells = await retrieveSpells(klass);
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
      let spells = await retrieveSpells(pact);
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
      const spells = await retrieveSpells(innate);
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


  async parse() {
    if (!this.name) this.name = this.source.name;
    this.npc = duplicate(await newNPC(this.name));
    this._calculateImage();

    this.npc.prototypeToken.name = this.name;
    this._generateFlags();

    this.removedHitPoints = this.source.removedHitPoints ? this.source.removedHitPoints : 0;
    this.temporaryHitPoints = this.source.temporaryHitPoints ? this.source.removedHitPoints : 0;

    // abilities
    this.npc.system.abilities = getAbilities(this.npc.system.abilities, this.source);

    // skills
    this.npc.system.skills = (this.extra)
      ? getSkills(this.npc.system.skills, this.source)
      : getSkillsHTML(this.npc.system.skills, this.source);

    // Senses
    this.npc.system.attributes.senses = getSenses(this.source);
    this.npc.prototypeToken = await getTokenSenses(this.npc.prototypeToken, this.source);

    // Conditions
    this.npc.system.traits.di = getDamageImmunities(this.source);
    this.npc.system.traits.dr = getDamageResistances(this.source);
    this.npc.system.traits.dv = getDamageVulnerabilities(this.source);
    this.npc.system.traits.ci = getConditionImmunities(this.source);
    this.size = getSize(this.source);
    this.npc.system.traits.size = this.size.value;
    this.npc.prototypeToken.width = this.size.token.value;
    this.npc.prototypeToken.height = this.size.token.value;
    this.npc.prototypeToken.scale = this.size.token.scale;


    // languages
    this.npc.system.traits.languages = getLanguages(this.source);

    // attributes
    this.npc.system.attributes.hp = getHitPoints(this.source, this.removedHitPoints, this.temporaryHitPoints);
    this.movement = getSpeed(this.source);
    this.npc.system.attributes.movement = this.movement['movement'];

    this.npc.system.attributes.prof = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;

    // ac
    this.ac = await generateAC(this.source, { useItemAC: this.useItemAC });
    this.npc.system.attributes.ac = this.ac.ac;
    this.npc.flags.ddbimporter.flatAC = this.ac.flatAC;
    this.items.push(...this.ac.ddbItems);

    // details
    this.cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
    this.npc.system.details.type = getType(this.source);
    const alignment = CONFIG.DDB.alignments.find((c) => this.source.alignmentId == c.id);
    this.npc.system.details.alignment = alignment ? alignment.name : "";
    this.npc.system.details.cr = this.cr.value;
    this.npc.system.details.source = getSource(this.source);
    this.npc.system.details.xp = {
      value: this.cr.xp
    };
    this.npc.system.details.environment = getEnvironments(this.source);
    this.npc.system.details.biography.value = this.source.characteristicsDescription;

    [this.actions, this.characterDescriptionAction] = getActions(this.source);
    this.items.push(...this.actions);

    if (this.source.hasLair) {
      this.lairActions = getLairActions(this.source);
      this.items.push(...this.lairActions.lairActions);
      this.npc.system.resources["lair"] = this.lairActions.resource;
    }

    if (this.source.legendaryActionsDescription != "") {
      this.legendaryActions = getLegendaryActions(this.source, this.actions);
      this.items.push(...this.legendaryActions.legendaryActions);
      this.npc.system.resources["legact"] = this.legendaryActions.actions;
      this.npc.prototypeToken.bar2 = {
        attribute: "resources.legact"
      };
    }

    if (this.source.specialTraitsDescription != "") {
      this.specialTraits = getSpecialTraits(this.source, this.actions);
      this.items.push(...this.specialTraits.specialActions);
      this.npc.system.resources["legres"] = this.specialTraits.resistance;
    }

    [this.reactions, this.characterDescriptionReaction] = getActions(this.source, "reaction");
    this.items.push(...this.reactions);
    [this.bonus, this.unexpectedDescription] = getActions(this.source, "bonus");
    this.items.push(...this.bonus);
    [this.mythic, this.unexpectedDescription] = getActions(this.source, "mythic");
    this.items.push(...this.mythic);

    if (this.unexpectedDescription) {
      logger.warn(`Unexpected description for ${this.source.name}`);
    }
    if (this.characterDescriptionAction) {
      this.npc.system.details.biography.value += this.characterDescriptionAction;
    }
    if (this.characterDescriptionReaction) {
      this.npc.system.details.biography.value += this.characterDescriptionReaction;
    }
    if (this.specialTraits?.characterDescription) {
      this.npc.system.details.biography.value += this.specialTraits.characterDescription;
    }

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

    // console.warn("Data:", monster);
    // console.warn("Monster:", duplicate(foundryActor));
    // logger.info(foundryActor.system.resources);
    // logger.info(foundryActor.system.traits.languages);

    // logger.info(foundryActor.system.attributes);
    return this.npc;

  }

}
