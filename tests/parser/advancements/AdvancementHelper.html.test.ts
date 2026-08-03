// @vitest-environment jsdom
// Characterization tests for AdvancementHelper static HTML-to-advancement-data
// parsers. Descriptions mimic real D&D Beyond class/background/feature markup.
// These pin CURRENT behavior ahead of a refactor; known oddities are noted inline.

// AdvancementHelper imports the activities barrel (for DDBBasicActivity, only used
// by the async spell advancement path we do not test); stub it to avoid pulling in
// the entire enricher tree.
vi.mock("../../../src/parser/activities/_module", () => ({ DDBBasicActivity: class DDBBasicActivity {} }));
// DDBClass/DDBSubClass have static initializers that read AdvancementHelper before
// the circular import (AdvancementHelper -> parser/lib -> DDBDataUtils -> DDBClass)
// resolves; stub them to break the cycle.
vi.mock("../../../src/parser/classes/DDBClass", () => ({ default: class DDBClass {} }));
vi.mock("../../../src/parser/classes/DDBSubClass", () => ({ default: class DDBSubClass {} }));

import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";

// =============================================================================
// getTableValue
// =============================================================================
describe("AdvancementHelper.getTableValue", () => {
  const html = `
    <table>
      <tbody>
        <tr><th> Skill Proficiencies </th><td> Insight and Religion </td></tr>
        <tr><th>Tool Proficiencies</th><td>Calligrapher's Supplies</td></tr>
      </tbody>
    </table>`;

  it("returns the trimmed td for a matching trimmed th", () => {
    expect(AdvancementHelper.getTableValue(html, "Skill Proficiencies")).toBe("Insight and Religion");
  });

  it("matches other rows by key", () => {
    expect(AdvancementHelper.getTableValue(html, "Tool Proficiencies")).toBe("Calligrapher's Supplies");
  });

  it("returns null when the key is absent", () => {
    expect(AdvancementHelper.getTableValue(html, "Languages")).toBeNull();
    expect(AdvancementHelper.getTableValue("<p>no table here</p>", "Skill Proficiencies")).toBeNull();
  });
});

// =============================================================================
// parseHTMLSaves
// =============================================================================
describe("AdvancementHelper.parseHTMLSaves", () => {
  it("parses class saving throws from a proficiencies block", () => {
    const html = "<p><strong>Saving Throws:</strong> Strength, Constitution</p><p><strong>Skills:</strong> Choose two</p>";
    expect(AdvancementHelper.parseHTMLSaves(html)).toEqual(["str", "con"]);
  });

  it("handles 'and'-joined saves", () => {
    const html = "<p>Saving Throws: Wisdom and Charisma</p>";
    expect(AdvancementHelper.parseHTMLSaves(html)).toEqual(["wis", "cha"]);
  });

  it("returns an empty array when no saving throws line exists", () => {
    expect(AdvancementHelper.parseHTMLSaves("<p>You can rage.</p>")).toEqual([]);
  });
});

// =============================================================================
// parseHTMLSkills
// =============================================================================
describe("AdvancementHelper.parseHTMLSkills", () => {
  it("parses a 2024 core trait table with 'Choose N:'", () => {
    const html = "<table><tbody><tr><th>Skill Proficiencies</th><td>Choose 2: History, Insight, Medicine, Persuasion, and Religion</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["his", "ins", "med", "per", "rel"]);
    expect(result.grants).toEqual([]);
  });

  it("parses a table with 'choose any N'", () => {
    const html = "<table><tbody><tr><th>Skill Proficiencies</th><td>Choose any 3 skills</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.number).toBe(3);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses table grants without a choose clause as choices with number 0", () => {
    const html = "<table><tbody><tr><th>Skill Proficiencies</th><td>Insight and Religion</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    // note: the table path always assigns to choices, never grants
    expect(result.number).toBe(0);
    expect(result.choices).toEqual(["ins", "rel"]);
    expect(result.grants).toEqual([]);
  });

  it("parses bard-style 'Skills: Choose any three'", () => {
    const html = "<p><strong>Skills:</strong> Choose any three</p>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.number).toBe(3);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses background 'Skill Proficiencies:' lines as grants", () => {
    const html = "<p><strong>Skill Proficiencies:</strong> Nature, Survival</p>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.grants).toEqual(["nat", "sur"]);
    expect(result.number).toBe(0);
    expect(result.choices).toEqual([]);
  });

  it("parses class 'Skills: Choose two from ...' lists", () => {
    const html = "<p><strong>Skills:</strong> Choose two from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, and Survival</p>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["arc", "ani", "ins", "med", "nat", "prc", "rel", "sur"]);
  });

  it("parses 'you gain proficiency in one of the following skills of your choice'", () => {
    const html = "<p>At 3rd level, you gain proficiency in one of the following skills of your choice: Deception, Performance, or Persuasion.</p>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["dec", "prf", "per"]);
  });

  it("parses 'also become proficient in your choice of two of the following skills'", () => {
    const html = "<p>You also become proficient in your choice of two of the following skills: Arcana, History, Nature, or Religion.</p>";
    const result = AdvancementHelper.parseHTMLSkills(html);
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["arc", "his", "nat", "rel"]);
  });

  it("parses a free skill choice", () => {
    const result = AdvancementHelper.parseHTMLSkills("<p>You gain proficiency in one skill of your choice.</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses explicit skill grants", () => {
    const single = AdvancementHelper.parseHTMLSkills("<p>You gain proficiency in the Intimidation skill.</p>");
    expect(single.grants).toEqual(["itm"]);
    const double = AdvancementHelper.parseHTMLSkills("<p>You gain proficiency in the Insight and Medicine skills, and you gain other benefits.</p>");
    expect(double.grants).toEqual(["ins", "med"]);
  });

  it("returns an empty parse when the text has no proficiency wording", () => {
    const result = AdvancementHelper.parseHTMLSkills("<p>You can cast a spell.</p>");
    expect(result).toEqual({ choices: [], grants: [], number: 0, allowReplacements: true });
  });
});

// =============================================================================
// parseHTMLLanguages
// =============================================================================
describe("AdvancementHelper.parseHTMLLanguages", () => {
  it("parses the 2024 standard languages phrasing", () => {
    const html = "<p>Your character knows at least three languages: Common plus two languages you roll or choose from the Standard Languages table.</p>";
    const result = AdvancementHelper.parseHTMLLanguages(html);
    // note: the grant is pre-prefixed with "languages:" here, unlike every other
    // language grant value in this parser
    expect(result.grants).toEqual(["languages:standard:common"]);
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["standard:*"]);
  });

  it("parses 'Languages: Giant and one other language of your choice'", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p><strong>Languages:</strong> Giant and one other language of your choice</p>");
    expect(result.grants).toEqual(["standard:giant"]);
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses 'Languages: Two of your choice'", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p><strong>Languages:</strong> Two of your choice</p>");
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["*"]);
    expect(result.grants).toEqual([]);
  });

  it("parses a constrained language choice list", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p><strong>Languages:</strong> One of your choice of Elvish, Gnomish, Goblin, or Sylvan</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["standard:elvish", "standard:gnomish", "standard:goblin", "exotic:sylvan"]);
  });

  it("keeps all speak/read/write grants", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p>You can speak, read, and write Common and Dwarvish.</p>");
    expect(result.grants).toEqual(["common", "standard:dwarvish"]);
    expect(result.number).toBe(0);
  });

  it("parses speak/read/write with an extra language of choice", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p>You can speak, read, and write Common and one extra language of your choice.</p>");
    expect(result.grants).toEqual(["common"]);
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses 'you learn one language of your choice'", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p>In addition, you learn one language of your choice.</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses 'You also learn two languages of your choice.'", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p>You also learn two languages of your choice.</p>");
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["*"]);
  });

  it("parses feat-style fluency wording", () => {
    const result = AdvancementHelper.parseHTMLLanguages("<p>You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["*"]);
  });
});

// =============================================================================
// parseHTMLTools
// =============================================================================
describe("AdvancementHelper.parseHTMLTools", () => {
  it("parses a table tool grant", () => {
    const html = "<table><tbody><tr><th>Tool Proficiencies</th><td>Smith’s Tools</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLTools(html);
    expect(result.grants).toEqual(["art:smith"]);
    expect(result.choices).toEqual([]);
  });

  it("parses a table tool group choice", () => {
    const html = "<table><tbody><tr><th>Tool Proficiencies</th><td>Choose one type of Gaming Set or Musical Instrument</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLTools(html);
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["game:*", "music:*"]);
    expect(result.grants).toEqual([]);
  });

  it("parses a table 'choose any N'", () => {
    const html = "<table><tbody><tr><th>Tool Proficiencies</th><td>Choose any 2 tools</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLTools(html);
    expect(result.number).toBe(2);
    expect(result.choices).toEqual(["*"]);
  });

  it("returns empty for 'Tools: None'", () => {
    const result = AdvancementHelper.parseHTMLTools("<p><strong>Tools:</strong> None</p>");
    expect(result).toEqual({ choices: [], grants: [], number: 0 });
  });

  it("parses 'Tools: Choose one type of artisan’s tools or one musical instrument'", () => {
    const result = AdvancementHelper.parseHTMLTools("<p><strong>Tools:</strong> Choose one type of artisan’s tools or one musical instrument</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["art:*", "music:*"]);
  });

  it("parses 'Tools: Three musical instruments of your choice'", () => {
    const result = AdvancementHelper.parseHTMLTools("<p><strong>Tools:</strong> Three musical instruments of your choice</p>");
    expect(result.number).toBe(3);
    expect(result.choices).toEqual(["music:*"]);
  });

  it("parses mixed grants and a group choice on a Tools: line", () => {
    const result = AdvancementHelper.parseHTMLTools("<p><strong>Tools:</strong> Thieves’ tools, tinker’s tools, one type of artisan’s tools of your choice</p>");
    expect(result.grants).toEqual(["thief", "art:tinker"]);
    expect(result.choices).toEqual(["art:*"]);
    expect(result.number).toBe(1);
  });

  it("parses prose 'You gain proficiency with smith’s tools, and ...'", () => {
    const result = AdvancementHelper.parseHTMLTools("<p>You gain proficiency with smith’s tools, and you learn to speak, read, and write Giant.</p>");
    expect(result.grants).toEqual(["art:smith"]);
  });

  it("parses prose kit grants joined with 'and the'", () => {
    const result = AdvancementHelper.parseHTMLTools("<p>Also, you gain proficiency with the disguise kit and the poisoner’s kit.</p>");
    expect(result.grants).toEqual(["disg", "pois"]);
  });

  it("parses feat-style 'one tool proficiency of your choice'", () => {
    const result = AdvancementHelper.parseHTMLTools("<p>You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["*"]);
  });
});

// =============================================================================
// parseHTMLArmorProficiencies
// =============================================================================
describe("AdvancementHelper.parseHTMLArmorProficiencies", () => {
  it("parses an Armor Training table row", () => {
    const html = "<table><tbody><tr><th>Armor Training</th><td>Light armor and Shields</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLArmorProficiencies(html);
    expect(result.grants).toEqual(["lgt", "shl"]);
  });

  it("parses 'Armor: Light armor, medium armor, shields'", () => {
    const result = AdvancementHelper.parseHTMLArmorProficiencies("<p><strong>Armor:</strong> Light armor, medium armor, shields</p>");
    expect(result.grants).toEqual(["lgt", "med", "shl"]);
  });

  it("expands 'All armor' into the three armor groups", () => {
    const result = AdvancementHelper.parseHTMLArmorProficiencies("<p><strong>Armor:</strong> All armor, shields</p>");
    expect(result.grants).toEqual(["lgt", "med", "hvy", "shl"]);
  });

  it("returns empty for 'Armor: None'", () => {
    const result = AdvancementHelper.parseHTMLArmorProficiencies("<p><strong>Armor:</strong> None</p>");
    expect(result).toEqual({ choices: [], grants: [], number: 0 });
  });

  it("prose 'You gain proficiency with heavy armor.' grants heavy armor", () => {
    const result = AdvancementHelper.parseHTMLArmorProficiencies("<p>You gain proficiency with heavy armor.</p>");
    expect(result.grants).toEqual(["hvy"]);
  });
});

// =============================================================================
// parseHTMLWeaponMasteryProficiencies
// =============================================================================
describe("AdvancementHelper.parseHTMLWeaponMasteryProficiencies", () => {
  it("always returns a wildcard choice set", () => {
    const result = AdvancementHelper.parseHTMLWeaponMasteryProficiencies("<p>anything at all</p>");
    expect(result).toEqual({ choices: ["*"], grants: [], number: 0 });
  });
});

// =============================================================================
// parseHTMLWeaponProficiencies
// =============================================================================
describe("AdvancementHelper.parseHTMLWeaponProficiencies", () => {
  it("parses a table with weapon group grants", () => {
    const html = "<table><tbody><tr><th>Weapon Proficiencies</th><td>Simple weapons and Martial weapons</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLWeaponProficiencies(html);
    expect(result.grants).toEqual(["sim", "mar"]);
    expect(result.number).toBe(0);
  });

  it("expands 'Martial weapons that have the Finesse or Light property'", () => {
    const html = "<table><tbody><tr><th>Weapon Proficiencies</th><td>Simple weapons, Martial weapons that have the Finesse or Light property</td></tr></tbody></table>";
    const result = AdvancementHelper.parseHTMLWeaponProficiencies(html);
    expect(result.grants).toContain("sim");
    expect(result.grants).toContain("mar:rapier");
    expect(result.grants).toContain("mar:scimitar");
    expect(result.grants).toContain("mar:shortsword");
    expect(result.grants).toContain("mar:whip");
    expect(result.grants).toContain("mar:handcrossbow");
    expect(result.grants).not.toContain("mar:greatsword");
  });

  it("parses a 'Weapons:' line of groups and specific weapons", () => {
    const result = AdvancementHelper.parseHTMLWeaponProficiencies("<p><strong>Weapons:</strong> Simple weapons, hand crossbows, longswords, rapiers, shortswords</p>");
    expect(result.grants).toEqual(["sim", "mar:handcrossbow", "mar:longsword", "mar:rapier", "mar:shortsword"]);
  });

  it("returns empty for 'Weapons: None'", () => {
    const result = AdvancementHelper.parseHTMLWeaponProficiencies("<p><strong>Weapons:</strong> None</p>");
    expect(result).toEqual({ choices: [], grants: [], number: 0 });
  });

  it("prose 'You gain proficiency with martial weapons.' grants the martial group", () => {
    const result = AdvancementHelper.parseHTMLWeaponProficiencies("<p>You gain proficiency with martial weapons.</p>");
    expect(result.grants).toEqual(["mar"]);
    expect(result.choices).toEqual([]);
  });

  it("expands the Bladesinger one-handed martial melee grant", () => {
    const result = AdvancementHelper.parseHTMLWeaponProficiencies("<p>You gain proficiency with all Melee Martial weapons that don’t have the Two-Handed or Heavy property.</p>");
    expect(result.grants).toContain("mar:longsword");
    expect(result.grants).toContain("mar:rapier");
    expect(result.grants).not.toContain("mar:greatsword");
    expect(result.grants).not.toContain("mar:glaive");
  });

  it("kensei text without the word 'proficiency' bails out early", () => {
    // ODDITY (pinned): the kensei branch sits behind an
    // `includes("proficiency")` guard, and any text that also says "You gain
    // proficiency with" returns from the (broken) prose branch first, so the
    // real 2014 kensei description never reaches the kensei parser.
    const result = AdvancementHelper.parseHTMLWeaponProficiencies("<p>Choose two types of weapons to be your kensei weapons: one melee weapon and one ranged weapon.</p>");
    expect(result).toEqual({ choices: [], grants: [], number: 0 });
  });

  it("parses the kensei weapon choice when the branch is reachable", () => {
    const result = AdvancementHelper.parseHTMLWeaponProficiencies("<p>Choose two types of weapons to be your kensei weapons: one melee weapon and one ranged weapon. Your proficiency extends to these weapons.</p>");
    expect(result.number).toBe(2);
    expect(result.choices).toContain("mar:longbow"); // heavy, but explicitly allowed
    expect(result.choices).not.toContain("mar:greataxe"); // heavy
    expect(result.choices).not.toContain("mar:lance"); // special
  });
});

// =============================================================================
// parseHTMLConditions
// =============================================================================
describe("AdvancementHelper.parseHTMLConditions", () => {
  it("parses a single damage resistance", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>You have resistance to psychic damage.</p>");
    expect(result.grants).toEqual(["dr:psychic"]);
    expect(result.number).toBe(0);
  });

  it("parses multiple damage resistances", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>You have resistance to necrotic damage and radiant damage.</p>");
    expect(result.grants).toEqual(["dr:necrotic", "dr:radiant"]);
  });

  it("parses damage immunity", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>At 18th level, you gain immunity to fire damage.</p>");
    expect(result.grants).toEqual(["di:fire"]);
  });

  it("drops the trailing type in 'bludgeoning, piercing, and slashing ... from nonmagical attacks'", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>While raging, you gain resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.</p>");
    // BUG-ish (pinned): 'slashing' keeps its 'from nonmagical attacks' suffix
    // after splitting, so only the first two damage types are granted.
    expect(result.grants).toEqual(["dr:bludgeoning", "dr:piercing"]);
  });

  it("parses disease immunity as the diseased condition", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>Your hearty constitution makes you immune to disease.</p>");
    expect(result.grants).toEqual(["ci:diseased"]);
  });

  it("parses poisoned condition immunity", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>and you are immune to the poisoned condition.</p>");
    expect(result.grants).toEqual(["ci:poisoned"]);
  });

  it("parses combined poison damage and poisoned condition immunity", () => {
    // the damage branch normalises the 'immune' kind to 'immunity', matches the
    // poison damage type (di:poison), and the nested cross-link adds ci:poisoned.
    const result = AdvancementHelper.parseHTMLConditions("<p>You are immune to poison damage and the poisoned condition.</p>");
    expect(result.grants).toEqual(["di:poison", "ci:poisoned"]);
  });

  it("parses dragonborn ancestry resistance as a choice", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>You have resistance to the damage type associated with your Metallic Ancestry: fire, lightning, acid, or cold.</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(expect.arrayContaining(["dr:fire", "dr:lightning", "dr:acid", "dr:cold"]));
    expect(result.hint).toContain("metallic ancestry");
    expect(result.grants).toEqual([]);
  });

  it("parses an explicit resistance choice list", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>You have Resistance to one of the following damage types of your choice: Cold, Necrotic, or Poison.</p>");
    expect(result.number).toBe(1);
    expect(result.choices).toEqual(["dr:cold", "dr:necrotic", "dr:poison"]);
  });

  it("grants every damage type for resistance to all damage from creatures", () => {
    const result = AdvancementHelper.parseHTMLConditions("<p>You have resistance to all damage dealt by other creatures (their attacks, spells, and other effects).</p>");
    const expected = Object.keys(CONFIG.DND5E.damageTypes).map((key) => `dr:${key}`);
    expect(result.grants.sort()).toEqual(expected.sort());
    expect(result.grants).toHaveLength(13);
  });
});

// =============================================================================
// parseHTMLSpellCastingAbilities
// =============================================================================
describe("AdvancementHelper.parseHTMLSpellCastingAbilities", () => {
  it("parses a single spellcasting ability", () => {
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities("<p>Wisdom is your spellcasting ability for these spells.</p>");
    expect(result.abilities).toEqual(["wis"]);
    expect(result.hint).toBe("");
    expect(result.concentration).toBe(true);
    expect(result.properties).toEqual([]);
  });

  it("parses the mental ability choice", () => {
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities("<p>Intelligence, Wisdom, or Charisma is your spellcasting ability for it.</p>");
    expect(result.abilities).toEqual(["int", "wis", "cha"]);
    expect(result.hint).toBe("You can choose Intelligence, Wisdom, or Charisma as your spellcasting ability for these spells.");
  });

  it("parses Constitution as a spellcasting ability", () => {
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities("<p>Constitution is your spellcasting ability for this spell.</p>");
    expect(result.abilities).toEqual(["con"]);
  });

  it("falls back to the mental abilities for 'same spellcasting ability' traits", () => {
    const text = "When you cast it with this trait, the spell uses the same spellcasting ability.";
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities(`<p>${text}</p>`);
    expect(result.abilities).toEqual(["int", "wis", "cha"]);
    expect(result.hint).toBe(text);
  });

  it("marks all component properties when no components are required", () => {
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities("<p>None of these spells require spell components.</p>");
    expect(result.properties).toEqual(["material", "vocal", "somatic"]);
  });

  it("marks material only for 'no material component'", () => {
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities("<p>You can cast the spell with no material component.</p>");
    expect(result.properties).toEqual(["material"]);
  });

  it("clears concentration for 'no concentration'", () => {
    const result = AdvancementHelper.parseHTMLSpellCastingAbilities("<p>The spell requires no concentration.</p>");
    expect(result.concentration).toBe(false);
    expect(result.properties).toEqual(["concentration"]);
  });
});

// =============================================================================
// parseHTMLSpellAdvancementDataForTraits
// =============================================================================
describe("AdvancementHelper.parseHTMLSpellAdvancementDataForTraits", () => {
  it("parses cantrip choices separated by a colon", () => {
    const html = "<p>You know one of the following cantrips of your choice: dancing lights, light, or sacred flame.</p>";
    const result = AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(html);
    expect(result.cantripChoices).toEqual(["dancing lights", "light", "sacred flame"]);
  });

  it("parses cantrip choices separated by a semicolon (homebrew)", () => {
    // Homebrew racial trait; previously threw "Cannot read properties of undefined (reading 'split')"
    const html = "<p>You know one of the following cantrips of your choice; Minor Illusion, Ray of Frost or Frostbite. "
      + "You also have the ability to cast Faerie Fire once per long rest. "
      + "Intelligence, Wisdom, or Charisma is your spellcasting ability for it (choose when you select this race)</p>";
    const result = AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(html);
    expect(result.cantripChoices).toEqual(["minor illusion", "ray of frost", "frostbite"]);
    expect(result.spellGrants).toEqual([{ level: 1, name: "faerie fire", amount: "1" }]);
  });

  it("parses 'you have the ability to cast' spell grants (homebrew)", () => {
    const html = "<p>You have the ability to cast Faerie Fire once per long rest.</p>";
    const result = AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(html);
    expect(result.spellGrants).toEqual([{ level: 1, name: "faerie fire", amount: "1" }]);
  });

  it("still parses 'you can cast ... once' spell grants", () => {
    const html = "<p>You can cast either the barkskin or spike growth spell once, and you must complete a long rest before you can cast either spell again.</p>";
    const result = AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(html);
    expect(result.spellGrants).toEqual([
      { level: 1, name: "barkskin", amount: "1" },
      { level: 1, name: "spike growth", amount: "1" },
    ]);
  });
});

// =============================================================================
// parseHTMLSpellAdvancementData
// =============================================================================
describe("AdvancementHelper.parseHTMLSpellAdvancementData", () => {
  it("parses cantrip choices separated by a semicolon (homebrew)", () => {
    const html = "<p>You know one of the following cantrips of your choice; minor illusion, ray of frost or frostbite.</p>";
    const result = AdvancementHelper.parseHTMLSpellAdvancementData(html);
    expect(result.cantripChoices).toEqual(["minor illusion", "ray of frost", "frostbite"]);
  });
});
