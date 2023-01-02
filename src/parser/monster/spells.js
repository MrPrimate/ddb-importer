import { getAbilityMods } from "./helpers.js";
import logger from '../../logger.js';
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import SETTINGS from "../../settings.js";
import DDBMonster from "../DDBMonster.js";
import DICTIONARY from "../../dictionary.js";

function parseSpellcasting(text) {
  let spellcasting = "";
  const abilitySearch = /((?:spellcasting ability) (?:is|uses|using) (\w+)| (\w+)(?: as \w+ spellcasting ability))/;
  const match = text.match(abilitySearch);
  if (match) {
    const abilityMatch = match[2] || match[3];
    spellcasting = abilityMatch.toLowerCase().substr(0, 3);
  }
  return spellcasting;
}

function parseSpellLevel(text) {
  let spellLevel = 0;
  const levelSearch = /is (?:a|an) (\d+)(?:th|nd|rd|st)(?:-| )level spellcaster/;
  const match = text.match(levelSearch);
  if (match) {
    spellLevel = parseInt(match[1]);
  }
  return spellLevel;
}

function parseSpelldc(text) {
  let dc = 10;
  const dcSearch = "spell\\s+save\\s+DC\\s*(\\d+)(?:,|\\)|\\s)";
  const match = text.match(dcSearch);
  // console.log("£££££")
  // console.log(match);
  if (match) {
    dc = parseInt(match[1]);
  }
  return dc;
}

DDBMonster.prototype.parseSpellAttackBonus = function (text) {
  let spellAttackBonus = 0;
  const dcSearch = "([+-]\\d+)\\s+to\\s+hit\\s+with\\s+spell\\s+attacks";
  const match = text.match(dcSearch);
  if (match) {
    const toHit = match[1];
    const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
    const abilities = getAbilityMods(this.source);
    const castingAbility = parseSpellcasting(text);
    spellAttackBonus = toHit - proficiencyBonus - abilities[castingAbility];
  }
  return spellAttackBonus;
};

function parseInnateSpells({ text, spells, spellList }) {
  // handle innate style spells here
  // 3/day each: charm person (as 5th-level spell), color spray, detect thoughts, hold person (as 3rd-level spell)
  // console.log(text);
  const innateSearch = /^(\d+)\/(\w+)(?:\s+each)?:\s+(.*$)/;
  const innateMatch = text.match(innateSearch);
  // console.log(innateMatch);
  if (innateMatch) {
    const spellArray = innateMatch[3].split(",").map((spell) => spell.trim());
    spellArray.forEach((spell) => {
      spellList.innate.push({ name: spell, type: innateMatch[2], value: innateMatch[1], innate: spellList.innateMatch });
    });
  }

  // At will: dancing lights
  const atWillSearch = /^At (?:Will|will):\s+(.*$)/;
  const atWillMatch = text.match(atWillSearch);
  if (atWillMatch) {
    const spellArray = atWillMatch[1].split(",").map((spell) => spell.trim());
    spellArray.forEach((spell) => {
      if (spellList.innate) {
        spellList.innate.push({ name: spell, type: "atwill", value: null, innate: spellList.innateMatch });
      } else {
        spellList.atwill.push(spell);
      }

    });
  }

  // last ditch attempt, mephits have some weird formating
  if (!innateMatch && !atWillMatch) {
    const mephitMatch = text.match(/(\d+)\/(\w+)(?:.*)?cast (.*),/);
    if (mephitMatch) {
      const spell = mephitMatch[3].trim();
      spellList.innate.push({ name: spell, type: mephitMatch[2], value: mephitMatch[1], innate: spellList.innateMatch });
    }
  }

  return [spells, spellList];

}


// e.g. The archmage can cast disguise self and invisibility at will and has the following wizard spells prepared:
function parseAdditionalAtWill(text) {
  const atWillSearch = /can cast (.*?) at will/;
  const atWillMatch = text.match(atWillSearch);
  let atWillSpells = [];
  if (atWillMatch) {
    atWillSpells = atWillMatch[1].replace(" and", ",").split(",").map((spell) => spell.split('(', 1)[0].trim());
  }
  return atWillSpells;
}

function parseSpells({ text, spells, spellList }) {
  // console.log(text);
  const spellLevelSearch = /^(Cantrip|\d)(?:st|th|nd|rd)?(?:\s*(?:Level|level))?(?:s)?\s+\((at will|at-will|\d)\s*(?:slot|slots)?\):\s+(.*$)/;
  const match = text.match(spellLevelSearch);
  // console.log(match);

  const warlockLevelSearch = /^1st–(\d)(?:st|th|nd|rd)\s+level\s+\((\d)\s+(\d)(?:st|th|nd|rd)?\s*(?:Level|level|-level)\s*(?:slot|slots)?\):\s+(.*$)/;
  const warlockMatch = text.match(warlockLevelSearch);

  if (!match && !warlockMatch) return parseInnateSpells({ text, spells, spellList });

  const spellLevel = (match) ? match[1] : 'pact';
  const slots = (match) ? match[2] : warlockMatch[2];
  const spellMatches = (match) ? match[3] : warlockMatch[4];

  if (Number.isInteger(parseInt(spellLevel)) && Number.isInteger(parseInt(slots))) {
    spells[`spell${spellLevel}`]['value'] = slots;
    spells[`spell${spellLevel}`]['max'] = slots;
    spells[`spell${spellLevel}`]['override'] = slots;
    const spellArray = spellMatches.split(",").map((spell) => spell.trim());
    spellList.class.push(...spellArray);
  } else if (spellLevel === 'pact' && Number.isInteger(parseInt(slots))) {
    spells[spellLevel]['value'] = slots;
    spells[spellLevel]['max'] = slots;
    spells[spellLevel]['override'] = slots;
    spells[spellLevel]['level'] = warlockMatch[3];
    const spellArray = spellMatches.split(",").map((spell) => spell.trim());
    spellList.pact.push(...spellArray);
  } else if (["at will", "at-will"].includes(slots)) {
    // at will spells
    const spellArray = spellMatches.replace(/\*/g, '').split(",").map((spell) => spell.trim());
    spellList.atwill.push(...spellArray);
  }

  // console.log(spellList);

  return [spells, spellList];

}


function splitEdgeCase(spell) {
  let result = {
    name: spell,
    edge: null,
  };

  const splitSpell = spell.split("(");
  if (splitSpell.length > 1) {
    result.name = splitSpell[0].trim();
    result.edge = splitSpell[1].split(")")[0].trim();
  }

  return result;
}

function getEdgeCases(spellList) {
  let results = {
    class: [],
    pact: [],
    atwill: [],
    // {name: "", type: "srt/lng/day", value: 0} // check these values
    innate: [],
    edgeCases: [], // map { name: "", type: "", edge: "" }
    material: spellList.material,
  };

  // class and atwill
  spellList.class.forEach((spell) => {
    const edgeCheck = splitEdgeCase(spell);
    results.class.push(edgeCheck.name);
    if (edgeCheck.edge) {
      const edgeEntry = {
        name: edgeCheck.name,
        type: "class",
        edge: edgeCheck.edge,
      };
      results.edgeCases.push(edgeEntry);
    }
  });
  spellList.atwill.forEach((spell) => {
    const edgeCheck = splitEdgeCase(spell);
    results.atwill.push(edgeCheck.name);
    if (edgeCheck.edge) {
      const edgeEntry = {
        name: edgeCheck.name,
        type: "atwill",
        edge: edgeCheck.edge,
      };
      results.edgeCases.push(edgeEntry);
    }
  });
  spellList.pact.forEach((spell) => {
    const edgeCheck = splitEdgeCase(spell);
    results.pact.push(edgeCheck.name);
    if (edgeCheck.edge) {
      const edgeEntry = {
        name: edgeCheck.name,
        type: "pact",
        edge: edgeCheck.edge,
      };
      results.edgeCases.push(edgeEntry);
    }
  });
  // innate
  spellList.innate.forEach((spellMap) => {
    const edgeCheck = splitEdgeCase(spellMap.name);
    spellMap.name = edgeCheck.name;
    results.innate.push(spellMap);
    if (edgeCheck.edge) {
      const edgeEntry = {
        name: edgeCheck.name,
        type: "innate",
        edge: edgeCheck.edge,
      };
      results.edgeCases.push(edgeEntry);
    }
  });

  return results;
}


// <p><em><strong>Innate Spellcasting.</strong></em> The oblex&rsquo;s innate spellcasting ability is Intelligence (spell save DC 15). It can innately cast the following spells, requiring no components:</p>\r\n<p>3/day each: charm person (as 5th-level spell), color spray, detect thoughts, hold person (as 3rd-level spell)</p>

DDBMonster.prototype._generateSpells = function() {
  let spelldc = 10;
  // data.details.spellLevel (spellcasting level)
  let spellLevel = 0;
  let spellList = {
    class: [],
    pact: [],
    atwill: [],
    // {name: "", type: "srt/lng/day", value: 0} // check these values
    innate: [],
    edgeCases: [], // map { name: "", type: "", edge: "" }
    material: true,
    innateMatch: false,
  };

  // ability associated
  let spellcasting = "";
  let spellAttackBonus = 0;

  let spells = {
    "spell1": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell2": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell3": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell4": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell5": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell6": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell7": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell8": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "spell9": {
      "value": 0,
      "max": 0,
      "override": null
    },
    "pact": {
      "value": 0,
      "max": 0,
      "override": null,
      "level": 0
    }
  };

  let dom = new DocumentFragment();

  // some monsters have poor spell formating, reported and might be able to remove in future
  // https://www.dndbeyond.com/forums/d-d-beyond-general/bugs-support/91228-sir-godfrey-gwilyms-spell-statblock
  const possibleSpellSources = this.source.specialTraitsDescription + this.source.actionsDescription;
  let specialTraits = possibleSpellSources.replace(/<br \/>/g, "</p><p>");

  $.parseHTML(specialTraits).forEach((element) => {
    dom.appendChild(element);
  });

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  dom.childNodes.forEach((node) => {
    const spellText = node.textContent.replace(/’/g, "'");
    const trimmedText = spellText.trim();

    const spellCastingRegEx = new RegExp(/^Spellcasting/);
    const innateSpellCastingRegEx = new RegExp(/^Innate Spellcasting/);
    const spellcastingMatch = spellCastingRegEx.test(trimmedText);
    const innateSpellcastingMatch = innateSpellCastingRegEx.test(trimmedText);

    if (spellcastingMatch || innateSpellcastingMatch) {
      spellcasting = parseSpellcasting(spellText);
      spelldc = parseSpelldc(spellText);
      spellLevel = parseSpellLevel(spellText);
      spellAttackBonus = this.parseSpellAttackBonus(spellText);
    }

    const noMaterialSearch = new RegExp(/no material component|no component/);
    const noMaterialMatch = noMaterialSearch.test(trimmedText);

    if (noMaterialMatch) {
      spellList.material = false;
    }

    // lets see if the spell block is innate
    if (innateSpellcastingMatch) {
      spellList.innateMatch = true;
    } else if (spellcastingMatch) {
      spellList.innateMatch = false;
    }

    const spellOptions = {
      text: spellText,
      spells,
      spellList,
    };
    [spells, spellList] = parseSpells(spellOptions);
    const additionalAtWill = parseAdditionalAtWill(spellText);
    spellList.atwill.push(...additionalAtWill);
  });

  spellList = getEdgeCases(spellList);

  logger.debug("Parsed spell list", spellList);

  this.spellcasting = {
    spelldc,
    spellcasting,
    spellLevel,
    spells,
    spellList,
    spellAttackBonus,
  };

  this.npc.system.attributes.spellcasting = spellcasting;
  this.npc.system.attributes.spelldc = spelldc;
  this.npc.system.attributes.spellLevel = spellLevel;
  this.npc.system.details.spellLevel = spellLevel;
  this.npc.system.spells = spells;
  this.npc.flags.monsterMunch['spellList'] = spellList;

};

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
export async function retrieveCompendiumSpells(spells) {
  const compendiumName = await game.settings.get(SETTINGS.MODULE_ID, "entity-spell-compendium");
  const compendiumItems = await retrieveCompendiumItems(spells, compendiumName);
  const itemData = compendiumItems.map((i) => {
    let spell = i.toObject();
    delete spell._id;
    return spell;
  });

  return itemData;
}

export function getSpellEdgeCase(spell, type, spellList) {
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


DDBMonster.prototype.addSpells = async function() {
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
    this.items.push(...spells);
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
    this.items.push(...spells);
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
    this.items.push(...spells);
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
    this.items.push(...innateSpells);
  }
};
