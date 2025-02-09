import { getAbilityMods } from "./helpers.js";
import { SETTINGS, DICTIONARY } from "../../config/_module.mjs";
import DDBMonster from "../DDBMonster.js";
import { utils, logger, CompendiumHelper } from "../../lib/_module.mjs";


DDBMonster.prototype.getSpellcasting = function(text) {
  let spellcasting = "";
  const abilitySearch = /((?:spellcasting ability) (?:is|uses|using) (\w+)| (\w+)(?: as \w+ spellcasting ability))/;
  const match = text.match(abilitySearch);
  if (match) {
    const abilityMatch = match[2] || match[3];
    spellcasting = abilityMatch.toLowerCase().substr(0, 3);
  }
  return spellcasting;
};

DDBMonster.prototype._generateSpellcasting = function(text) {
  let spellcasting = this.getSpellcasting(text);
  this.spellcasting.spellcasting = spellcasting;
  this.npc.system.attributes.spellcasting = spellcasting;
};

DDBMonster.prototype._generateSpellLevel = function(text) {
  let spellLevel = 0;
  const levelSearch = /is (?:a|an) (\d+)(?:th|nd|rd|st)(?:-| )level spellcaster/i;
  const match = text.match(levelSearch);
  if (match) {
    spellLevel = parseInt(match[1]);
  }
  this.spellcasting.spellLevel = spellLevel;
  this.npc.system.attributes.spellLevel = spellLevel;
  this.npc.system.details.spellLevel = spellLevel;
};

DDBMonster.prototype._generateSpelldc = function(text) {
  let dc = 10;
  const dcSearch = "spell\\s+save\\s+DC\\s*(\\d+)(?:,|\\)|\\s)";
  const match = text.match(dcSearch);
  // console.log("£££££")
  // console.log(match);
  if (match) {
    dc = parseInt(match[1]);
  }
  this.spellcasting.spelldc = dc;
  this.npc.system.attributes.spelldc = dc;
};

DDBMonster.prototype._generateSpellAttackBonus = function(text) {
  let spellAttackBonus = 0;
  const dcSearch = "([+-]\\d+)\\s+to\\s+hit\\s+with\\s+spell\\s+attacks";
  const match = text.match(dcSearch);
  if (match) {
    const toHit = match[1];
    const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
    const abilities = getAbilityMods(this.source);
    const castingAbility = this.getSpellcasting(text);
    spellAttackBonus = toHit - proficiencyBonus - abilities[castingAbility];
  }
  this.spellcasting.spellAttackBonus = spellAttackBonus;
};


DDBMonster.prototype.parseOutInnateSpells = function(text) {
  // handle innate style spells here
  // 3/day each: charm person (as 5th-level spell), color spray, detect thoughts, hold person (as 3rd-level spell)
  // console.log(text);
  const innateSearch = /^(\d+)\/(\w+)(?:\s+each)?:\s+(.*$)/i;
  const innateMatch = text.match(innateSearch);
  // console.log(innateMatch);
  if (innateMatch) {
    const spellArray = innateMatch[3].split(",").map((spell) => spell.trim());
    spellArray.forEach((spell) => {
      this.spellList.innate.push({ name: spell, type: innateMatch[2], value: innateMatch[1], innate: this.spellList.innateMatch });
    });
  }

  // At will: dancing lights
  const atWillSearch = /^At (?:will):\s+(.*$)/i;
  const atWillMatch = text.match(atWillSearch);
  if (atWillMatch) {
    const spellArray = atWillMatch[1].split(",").map((spell) => spell.trim());
    spellArray.forEach((spell) => {
      if (this.spellList.innateMatch) {
        this.spellList.innate.push({ name: spell, type: "atwill", value: null, innate: this.spellList.innateMatch });
      } else {
        this.spellList.atwill.push(spell);
      }

    });
  }

  // last ditch attempt, mephits have some weird formating
  if (!innateMatch && !atWillMatch) {
    const mephitMatch = text.match(/(\d+)\/(\w+)(?:.*)?cast (.*),/i);
    if (mephitMatch) {
      const spell = mephitMatch[3].trim();
      this.spellList.innate.push({ name: spell, type: mephitMatch[2], value: mephitMatch[1], innate: this.spellList.innateMatch });
    }
  }
};


// e.g. The archmage can cast disguise self and invisibility at will and has the following wizard spells prepared:
DDBMonster.prototype.parseAdditionalAtWillSpells = function(text) {
  const atWillSearch = /can cast (.*?) at will/i;
  const atWillMatch = text.match(atWillSearch);
  let atWillSpells = [];
  if (atWillMatch) {
    atWillSpells = atWillMatch[1].replace(" and", ",").split(",").map((spell) => spell.split('(', 1)[0].trim());
  }

  this.spellList.atwill.push(...atWillSpells);
};


/**
 * Parses out spells from the monster description block
 * @param {string} text The spell text to parse
 * @param {object} [options] Options to pass to the function
 * @param {string} [options.pactText] The pact text to parse
 * @returns {void}
 */
// eslint-disable-next-line complexity
DDBMonster.prototype.parseOutSpells = function(text, { pactText = null } = {}) {
  // console.log(text);
  const spellLevelSearch = /^(Cantrip|\d)(?:st|th|nd|rd)?(?:\s*(?:Level|level))?(?:s)?\s+\((at will|at-will|\d)\s*(?:slot|slots)?\):\s+(.*$)/;
  const match = text.match(spellLevelSearch);

  const warlockLevelSearch = /^1st–(\d)(?:st|th|nd|rd)\s+level\s+\((\d)\s+(\d)(?:st|th|nd|rd)?\s*(?:Level|level|-level)\s*(?:slot|slots)?\):\s+(.*$)/;
  const warlockMatch = text.match(warlockLevelSearch);

  const otherWarlockSearch = /^(\d)\s*(?:st|th|nd|rd)?\s*(?:Level|level|-level):\s+(.*$)/i;
  const otherWarlockMatch = text.match(otherWarlockSearch);

  const pactSearchRegex = /has\s(\w*)\s(\d)(?:st|th|nd|rd)\s*(?:level|-level)\s+spell\s+slot/i;
  const pactTextSlotsMatch = (otherWarlockMatch && pactText) ? pactText.match(pactSearchRegex) : null;

  // console.warn("info", {
  //   match,
  //   warlockMatch,
  //   otherWarlockMatch,
  //   pactTextSlotsMatch,
  //   expression: !match && (!warlockMatch || !pactTextSlotsMatch),
  //   expression2: !match && !warlockMatch && !pactTextSlotsMatch,
  //   warlock: !(warlockMatch || pactTextSlotsMatch),
  //   expression3: !match && !(warlockMatch || pactTextSlotsMatch),
  // });

  if (!match && !(warlockMatch || pactTextSlotsMatch)) {
    this.parseOutInnateSpells(text);
    return;
  }

  const spellLevel = (match) ? match[1] : 'pact';
  const slots = (match)
    ? match[2]
    : (warlockMatch)
      ? warlockMatch[2]
      : DICTIONARY.numbers.find((n) => n.natural === pactTextSlotsMatch[1])?.num;
  const spellMatches = (match)
    ? match[3]
    : (warlockMatch)
      ? warlockMatch[4]
      : otherWarlockMatch[2];

  // console.warn("Processing spells", {
  //   spellLevel,
  //   slots,
  //   spellMatches,
  // });
  if (Number.isInteger(parseInt(spellLevel)) && Number.isInteger(parseInt(slots))) {
    logger.debug("Spell level parsing");
    this.npc.system.spells[`spell${spellLevel}`]['value'] = parseInt(slots);
    this.npc.system.spells[`spell${spellLevel}`]['max'] = slots ?? "";
    this.npc.system.spells[`spell${spellLevel}`]['override'] = parseInt(slots) ?? null;
    const spellArray = spellMatches.split(",").map((spell) => spell.trim());
    this.spellList.class.push(...spellArray);
  } else if (spellLevel === 'pact' && Number.isInteger(parseInt(slots))) {
    logger.debug("Spell pact parsing");
    this.npc.system.spells[spellLevel]['value'] = parseInt(slots);
    this.npc.system.spells[spellLevel]['max'] = slots ?? "";
    this.npc.system.spells[spellLevel]['override'] = parseInt(slots) ?? null;
    this.npc.system.spells[spellLevel]['level'] = warlockMatch ? warlockMatch[3] : pactTextSlotsMatch[2];
    const spellArray = spellMatches.split(",").map((spell) => spell.trim());
    this.spellList.pact.push(...spellArray);
  } else if (["at will", "at-will"].includes(slots)) {
    logger.debug("Spell at-will parsing");
    // at will spells
    const spellArray = spellMatches.replace(/\*/g, '').split(",").map((spell) => spell.trim());
    this.spellList.atwill.push(...spellArray);
  }

};


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

DDBMonster.prototype._generateSpellEdgeCases = function() {
  ["pact", "class", "atwill"].forEach((spellType) => {
    this.spellList[spellType].forEach((spellName) => {
      const edgeCheck = splitEdgeCase(`${spellName}`);
      if (edgeCheck.edge) {
        const edgeEntry = {
          name: edgeCheck.name,
          type: spellType,
          edge: edgeCheck.edge,
        };
        this.spellList.edgeCases.push(edgeEntry);
      }
      spellName = edgeCheck.name;
    });
  });

  // innate
  this.spellList.innate.forEach((spellMap) => {
    const edgeCheck = splitEdgeCase(spellMap.name);
    spellMap.name = edgeCheck.name;
    if (edgeCheck.edge) {
      const edgeEntry = {
        name: edgeCheck.name,
        type: "innate",
        edge: edgeCheck.edge,
      };
      this.spellList.edgeCases.push(edgeEntry);
    }
  });
};


// <p><em><strong>Innate Spellcasting.</strong></em> The oblex&rsquo;s innate spellcasting ability is Intelligence (spell save DC 15). It can innately cast the following spells, requiring no components:</p>\r\n<p>3/day each: charm person (as 5th-level spell), color spray, detect thoughts, hold person (as 3rd-level spell)</p>

DDBMonster.prototype._generateSpells = function() {

  this.spellcasting = {
    spelldc: 10,
    spellcasting: "", // ability associated
    spellLevel: 0,
    spellAttackBonus: 0,
  };
  this.spellList = {
    class: [],
    pact: [],
    atwill: [],
    // {name: "", type: "srt/lng/day", value: 0} // check these values
    innate: [],
    edgeCases: [], // map { name: "", type: "", edge: "" }
    material: true,
    innateMatch: false,
    concentration: true,
  };

  // some monsters have poor spell formating, reported and might be able to remove in future
  // https://www.dndbeyond.com/forums/d-d-beyond-general/bugs-support/91228-sir-godfrey-gwilyms-spell-statblock
  const possibleSpellSources = this.source.specialTraitsDescription + this.source.actionsDescription;
  let specialTraits = possibleSpellSources.replace(/<br \/>/g, "</p><p>");

  const dom = utils.htmlToDocumentFragment(specialTraits);

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  const pactText = specialTraits.includes("knows the following warlock spells")
    ? specialTraits
    : null;

  dom.childNodes.forEach((node) => {
    const spellText = utils.nameString(node.textContent);
    const trimmedText = spellText.trim();

    const spellCastingRegEx = new RegExp(/^Spellcasting/);
    const innateSpellCastingRegEx = new RegExp(/^Innate Spellcasting/);
    const spellcastingMatch = spellCastingRegEx.test(trimmedText);
    const innateSpellcastingMatch = innateSpellCastingRegEx.test(trimmedText);

    if (spellcastingMatch || innateSpellcastingMatch) {
      this._generateSpellcasting(spellText);
      this._generateSpelldc(spellText);
      this._generateSpellLevel(spellText);
      this._generateSpellAttackBonus(spellText);
    }

    const noMaterialSearch = new RegExp(/no material component|no component|no spell components/);
    const noMaterialMatch = noMaterialSearch.test(trimmedText);

    if (noMaterialMatch) {
      this.spellList.material = false;
    }

    const noConcentrationSearch = new RegExp(/no concentration|no material components or concentration|no spell components or concentration/);
    const noConcentrationMatch = noConcentrationSearch.test(trimmedText);

    if (noConcentrationMatch) {
      this.spellList.concentration = false;
    }


    // lets see if the spell block is innate
    if (innateSpellcastingMatch) {
      this.spellList.innateMatch = true;
    } else if (spellcastingMatch) {
      this.spellList.innateMatch = false;
    }

    this.parseOutSpells(spellText, { pactText });
    this.parseAdditionalAtWillSpells(spellText);
  });

  this._generateSpellEdgeCases();

  logger.debug("Parsed spell list", this.spellList);

  // this.spellcasting = {
  //   spelldc,
  //   spellcasting,
  //   spellLevel,
  //   spells,
  //   spellList,
  //   spellAttackBonus,
  // };

  this.npc.flags.monsterMunch['spellList'] = this.spellList;

};


/**
 * Retrieves matching spells from a compendium given a list of names.
 * @param {string[]} spells List of spell names to search for.
 * @returns {<Item[]>} A list of spells objects that were found.
 */
DDBMonster.prototype.retrieveCompendiumSpells = async function(spells) {
  const compendiumName = await game.settings.get(SETTINGS.MODULE_ID, "entity-spell-compendium");
  const compendiumSpells = await CompendiumHelper.retrieveMatchingCompendiumItems(spells, compendiumName, {
    "system.source.rules": this.use2024Spells ? "2024" : "2014",
  });
  const itemData = compendiumSpells.map((i) => {
    let spell = i.toObject();
    delete spell._id;
    return spell;
  });

  return itemData;
};

DDBMonster.prototype.getSpellEdgeCase = function(spell, type, spellList) {
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
    spell.name = edgeCase.edge.includes("save DC") ? spell.name : `${spell.name} (${edgeCase.edge})`;
    spell.system.description.value = `<p><b>Special Notes: ${edgeCase.edgeDescription ?? edgeCase.edge}.</b></p>\n\n${spell.system.description.value}`;

    if (spell.system.description.chat !== "") {
      spell.system.description.chat = `<p><b>Special Notes: ${edgeCase.edgeDescription ?? edgeCase.edge}.</b></p>\n\n${spell.system.description.chat}`;
    }

    const diceSearch = /(\d+)d(\d+)/;
    const diceMatch = edgeCase.edge.match(diceSearch);
    if (diceMatch) {
      for (const key of Object.keys(spell.system.activities)) {
        const activity = spell.system.activities[key];
        if (!activity.damage?.parts || activity.damage.parts.length === 0) continue;
        activity.damage.parts[0].number = null;
        activity.damage.parts[0].denomination = null;
        activity.damage.parts[0].custom = {
          enabled: true,
          formula: diceMatch[0],
        };
        spell.system.activities[key] = activity;
      }
    }

    // save DC 12
    const saveSearch = /save DC (\d+)/;
    const saveMatch = edgeCase.edge.match(saveSearch);
    if (saveMatch) {
      for (const key of Object.keys(spell.system.activities)) {
        const activity = spell.system.activities[key];
        if (!activity?.save) continue;
        activity.save.dc = {
          formula: saveMatch[1],
          calculation: "",
        };
        spell.system.activities[key] = activity;
      }
    }
  }

  // remove material components?
  if (!spellList.material) {
    spell.system.materials = {
      value: "",
      consumed: false,
      cost: 0,
      supply: 0,
    };
    spell.system.properties = utils.removeFromProperties(spell.system.properties, "material");
  }

  if (!spellList.concentration) {
    spell.system.properties = utils.removeFromProperties(spell.system.properties, "concentration");
  }

  if (spellList.overrideData) {
    spell = foundry.utils.mergeObject(spell, spellList.overrideData);
  }

};

// temporary spell hints
// these covercurrent gaps in teh parser, or blocks that are impossible to parse
DDBMonster.prototype._addSpellHints = function() {
  switch (this.name) {
    case "Faerie Dragon (Younger)":
    case " Faerie Dragon (Younger)": {
      this.spellList.innate = [
        { name: "Dancing Lights", type: "day", edge: "Red", value: 1, edgeDescription: "Available to Red, Orange, Yellow" },
        { name: "Mage Hand", type: "day", edge: "Red", value: 1, edgeDescription: "Available to Red, Orange, Yellow" },
        { name: "Minor Illusion", type: "day", edge: "Red", value: 1, edgeDescription: "Available to Red, Orange, Yellow" },
        { name: "Color Spray", type: "day", edge: "Orange", value: 1, edgeDescription: "Available to Orange, Yellow" },
        { name: "Mirror Image", type: "day", edge: "Yellow", value: 1, edgeDescription: "Available to Yellow" },
      ];
      this.spellList.edgeCases = foundry.utils.deepClone(this.spellList.innate).map((s) => {
        s.type = "innate";
        return s;
      });
      this.spellList.material = false;
      break;
    }
    case "Faerie Dragon (Older)":
    case " Faerie Dragon (Older)":
    case "Otto": {
      this.spellList.innate = [
        { name: "Dancing Lights", type: "day", edge: "Red", value: 1, edgeDescription: "Available to Red, Orange, Yellow, Green, Blue, Indigo and Violet" },
        { name: "Mage Hand", type: "day", edge: "Red", value: 1, edgeDescription: "Available to Red, Orange, Yellow, Green, Blue, Indigo and Violet" },
        { name: "Minor Illusion", type: "day", edge: "Red", value: 1, edgeDescription: "Available to Red, Orange, Yellow, Green, Blue, Indigo and Violet" },
        { name: "Color Spray", type: "day", edge: "Orange", value: 1, edgeDescription: "Available to Orange, Yellow, Green, Blue, Indigo and Violet" },
        { name: "Mirror Image", type: "day", edge: "Yellow", value: 1, edgeDescription: "Available to Yellow, Green, Blue, Indigo and Violet" },
        { name: "Suggestion", type: "day", edge: "Green", value: 1, edgeDescription: "Available to Green, Blue, Indigo and Violet" },
        { name: "Major Image", type: "day", edge: "Blue", value: 1, edgeDescription: "Available to Blue, Indigo and Violet" },
        { name: "Hallucinatory Terrain", type: "day", edge: "Indigo", value: 1, edgeDescription: "Available to Indigo and Violet" },
        { name: "Polymorph", type: "day", edge: "Violet", value: 1, edgeDescription: "Available to Indigo" },
      ];
      this.spellList.edgeCases = foundry.utils.deepClone(this.spellList.innate).map((s) => {
        s.type = "innate";
        return s;
      });
      this.spellList.material = false;
      break;
    }
    case "Fathomer": {
      //   this.spellList.pact = [
      //     { name: "armor of agathys", type: "" },
      //     { name: "expeditious retreat", type: "" },
      //     { name: "hex", type: "" },
      //     { name: "invisibility", type: "" },
      //     { name: "vampiric touch", type: "" },
      // ];
      this.spellList.atwill.push("Mage Armor");
      break;
    }
    case "Hypnos Magen": {
      this.spellList.atwill = ["Suggestion"];
      this.spellList.material = false;
      this.spellcasting.spellcasting = "int";
      break;
    }
    case "Puppeteer Parasite": {
      this.spellList.innate = [{ name: "Suggestion", type: "day", value: 1 }];
      this.spellList.material = false;
      break;
    }
    case "Sephek Kaltro": {
      this.spellList.innate = [{ name: "Misty Step", type: "day", value: 3 }];
      this.spellList.material = false;
      break;
    }
    case "Black Abishai": {
      this.spellList.atwill = ["Darkness"];
      this.spellList.material = false;
      this.spellList.concentration = false;
      this.spellcasting.spellcasting = "wis";
      this.spellList.overrideData = {
        system: {
          range: {
            value: 120,
          },
        },
      };
      break;
    }
    // case "Priest of Osybus (Deathly)": {
    //   this.spellList.innate = [{ name: "Circle of Death", type: "charge", value: 1, recharge: "5" }];
    //   break;
    // }
    // no default
  }
};

DDBMonster.prototype.addSpells = async function() {
  this._addSpellHints();
  // check to see if we have munched flags to work on
  if (!this.spellList) return;

  logger.debug(`Adding Spell List`, this.spellList);
  const atWill = this.spellList.atwill;
  const klass = this.spellList.class;
  const innate = this.spellList.innate;
  const pact = this.spellList.pact;

  if (atWill.length !== 0) {
    logger.debug("Retrieving at Will spells:", atWill);
    let spells = await this.retrieveCompendiumSpells(atWill);
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
          spent: null,
          max: null,
          recovery: [],
        };
      }
      this.getSpellEdgeCase(spell, "atwill", this.spellList);
      return spell;
    });
    this.items.push(...spells);
  }

  // class spells
  if (klass.length !== 0) {
    logger.debug("Retrieving class spells:", klass);
    let spells = await this.retrieveCompendiumSpells(klass);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.system.preparation = {
        mode: "prepared",
        prepared: true,
      };
      this.getSpellEdgeCase(spell, "class", this.spellList);
      return spell;
    });
    this.items.push(...spells);
  }

  // pact spells
  if (pact.length !== 0) {
    logger.debug("Retrieving pact spells:", pact);
    let spells = await this.retrieveCompendiumSpells(pact);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.system.preparation = {
        mode: "pact",
        prepared: true,
      };
      this.getSpellEdgeCase(spell, "pact", this.spellList);
      return spell;
    });
    this.items.push(...spells);
  }

  // innate spells
  if (innate.length !== 0) {
    // innate:
    // {name: "", type: "srt/lng/day", value: 0}
    logger.debug("Retrieving innate spells:", innate);
    const spells = await this.retrieveCompendiumSpells(innate);
    const innateSpells = spells.filter((spell) => spell !== null)
      .map((spell) => {
        const spellInfo = innate.find((w) => w.name.toLowerCase() == spell.name.toLowerCase());
        if (spellInfo) {
          const isAtWill = foundry.utils.hasProperty(spellInfo, "innate") && !spellInfo.innate;
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
              spent: null,
              max: null,
              recovery: [],
            };
          } else {
            const perLookup = DICTIONARY.resets.find((d) => d.id == spellInfo.type);
            const per = spellInfo.type === "atwill"
              ? null
              : (perLookup && perLookup.type)
                ? perLookup.type
                : "day";
            spell.system.uses = {
              spent: 0,
              max: spellInfo.value ?? "",
              recovery: [
                { period: per, type: "recoverAll", formula: undefined },
              ],
            };
          }
          this.getSpellEdgeCase(spell, "innate", this.spellList);
        }
        return spell;
      });
    this.items.push(...innateSpells);
  }
};
