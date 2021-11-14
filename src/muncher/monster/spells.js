import { getAbilityMods } from "./abilities.js";
import logger from '../../logger.js';


function parseSpellcasting(text) {
  let spellcasting = "";
  const abilitySearch = "(?:spellcasting ability is|uses) (\\w+)(?: as \\w+ spellcasting ability| )";
  const match = text.match(abilitySearch);
  if (match) {
    spellcasting = match[1].toLowerCase().substr(0, 3);
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

function parseBonusSpellAttack(text, monster, DDB_CONFIG) {
  let spellAttackBonus = 0;
  const dcSearch = "([+-]\\d+)\\s+to\\s+hit\\s+with\\s+spell\\s+attacks";
  const match = text.match(dcSearch);
  if (match) {
    const toHit = match[1];
    const proficiencyBonus = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
    const abilities = getAbilityMods(monster, DDB_CONFIG);
    const castingAbility = parseSpellcasting(text);
    spellAttackBonus = toHit - proficiencyBonus - abilities[castingAbility];
  }
  return spellAttackBonus;
}

function parseInnateSpells(text, spells, spellList) {
  // handle innate style spells here
  // 3/day each: charm person (as 5th-level spell), color spray, detect thoughts, hold person (as 3rd-level spell)
  // console.log(text);
  const innateSearch = /^(\d+)\/(\w+)(?:\s+each)?:\s+(.*$)/;
  const innateMatch = text.match(innateSearch);
  // console.log(innateMatch);
  if (innateMatch) {
    const spellArray = innateMatch[3].split(",").map((spell) => spell.trim());
    spellArray.forEach((spell) => {
      spellList.innate.push({ name: spell, type: innateMatch[2], value: innateMatch[1] });
    });
  }

  // At will: dancing lights
  const atWillSearch = /^At (?:Will|will):\s+(.*$)/;
  const atWillMatch = text.match(atWillSearch);
  if (atWillMatch) {
    const spellArray = atWillMatch[1].split(",").map((spell) => spell.trim());
    spellArray.forEach((spell) => {
      spellList.atwill.push(spell);
    });
  }

  // last ditch attempt, mephits have some weird formating
  if (!innateMatch && !atWillMatch) {
    const mephitMatch = text.match(/(\d+)\/(\w+)(?:.*)?cast (.*),/);
    if (mephitMatch) {
      const spell = mephitMatch[3].trim();
      spellList.innate.push({ name: spell, type: mephitMatch[2], value: mephitMatch[1] });
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

function parseSpells(text, spells, spellList) {
    // console.log(text);
    const spellLevelSearch = /^(Cantrip|\d)(?:st|th|nd|rd)?(?:\s*(?:Level|level))?(?:s)?\s+\((at will|at-will|\d)\s*(?:slot|slots)?\):\s+(.*$)/;
    const match = text.match(spellLevelSearch);
    // console.log(match);

    const warlockLevelSearch = /^1st–(\d)(?:st|th|nd|rd)\s+level\s+\((\d)\s+(\d)(?:st|th|nd|rd)?\s*(?:Level|level|-level)\s*(?:slot|slots)?\):\s+(.*$)/;
    const warlockMatch = text.match(warlockLevelSearch);

    if (!match && !warlockMatch) return parseInnateSpells(text, spells, spellList);

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


export function getSpells(monster, DDB_CONFIG) {
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
  // let specialTraits = monster.specialTraitsDescription;
  const possibleSpellSources = monster.specialTraitsDescription + monster.actionsDescription;
  let specialTraits = possibleSpellSources.replace(/<br \/>/g, "</p><p>");
//   const specialCases = ["Sir Godfrey Gwilym", "Hlam", "Ygorl, Lord of Entropy",
//     "Whymsee (Kraken Priest Variant)", "Strahd Zombie", "Skr’a S’orsk",
//     "Mongrelfolk", "Laeral Silverhand", "Jarlaxle Baenre", "Gar Shatterkeel (Noncore)", "Forlarren",
//     "Fog Giant", "Fhenimore (Kraken Priest Variant)", "Drow Arachnomancer",
//     "Archon of the Triumvirate", "Amble",
// ];
//   if (specialCases.includes(monster.name)) {
//     specialTraits = specialTraits.replace(/<br \/>/g, "</p><p>");
//     logger.warn(`Fiddling with ${monster.name} spells due to bad formatting`);
//   }
//   if (specialTraits.includes("<br />")) console.error(`"SPECIAL CASE ${monster.name}`);

// console.warn(specialTraits);
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
    const spellcastingMatch = spellText.trim().match(/^Spellcasting|^Innate Spellcasting/);
    if (spellcastingMatch) {
      spellcasting = parseSpellcasting(spellText);
      spelldc = parseSpelldc(spellText);
      spellLevel = parseSpellLevel(spellText);
      spellAttackBonus = parseBonusSpellAttack(spellText, monster, DDB_CONFIG);
    }

    const noMaterialSearch = /no material component|no component/;
    const noMaterialMatch = spellText.match(noMaterialSearch);

    if (noMaterialMatch) {
      spellList.material = false;
    }

    [spells, spellList] = parseSpells(spellText, spells, spellList);
    const additionalAtWill = parseAdditionalAtWill(spellText);
    spellList.atwill.push(...additionalAtWill);
  });

  spellList = getEdgeCases(spellList);

  // console.warn(spellList);
  logger.debug("Parsed spell list", spellList);

  // console.log("*****")

  const result = {
    spelldc: spelldc,
    spellcasting: spellcasting,
    spellLevel: spellLevel,
    spells: spells,
    spellList: spellList,
    spellAttackBonus: spellAttackBonus,
  };

  // console.log(JSON.stringify(result, null, 4));
  return result;

}

