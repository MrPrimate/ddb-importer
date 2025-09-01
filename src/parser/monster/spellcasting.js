import { getAbilityMods } from "./helpers.js";
import DDBMonster from "../DDBMonster.js";
import { utils } from "../../lib/_module.mjs";

// <p><em><strong>Innate Spellcasting.</strong></em> The oblex&rsquo;s innate spellcasting ability is Intelligence (spell save DC 15). It can innately cast the following spells, requiring no components:</p>\r\n<p>3/day each: charm person (as 5th-level spell), color spray, detect thoughts, hold person (as 3rd-level spell)</p>

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

DDBMonster.prototype._generateSpellcastingAbility = function(text) {
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
  this.npc.system.attributes.spell.level = spellLevel;
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

// this.spellcasting = {
//   spelldc: 10,
//   spellcasting: "", // ability associated
//   spellLevel: 0,
//   spellAttackBonus: 0,
// };
// this.spellList = {
//   class: [],
//   pact: [],
//   atwill: [],
//   // {name: "", type: "srt/lng/day", value: 0} // check these values
//   innate: [],
//   edgeCases: [], // map { name: "", type: "", edge: "" }
//   material: true,
//   innateMatch: false,
//   concentration: true,
// };


DDBMonster.prototype._generateSpellcasting = function() {
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

  dom.childNodes.forEach((node) => {
    const spellText = utils.nameString(node.textContent);
    const trimmedText = spellText.trim();

    const spellCastingRegEx = new RegExp(/^Spellcasting|^(?:(?!Innate).)(\w+)\sSpellcasting/);
    const innateSpellCastingRegEx = new RegExp(/^Innate Spellcasting/);
    const spellcastingMatch = spellCastingRegEx.test(trimmedText);
    const innateSpellcastingMatch = innateSpellCastingRegEx.test(trimmedText);

    if (spellcastingMatch || innateSpellcastingMatch) {
      this._generateSpellcastingAbility(spellText);
      this._generateSpelldc(spellText);
      this._generateSpellLevel(spellText);
      this._generateSpellAttackBonus(spellText);
    }

  });

};
