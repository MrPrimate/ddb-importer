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
    expect(result.grants).toEqual(["standard:common"]);
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

// =============================================================================
// Lineage and legacy spell tables
// =============================================================================
describe("AdvancementHelper lineage spell parsing", () => {
  // foundryMocks stubs jQuery parseHTML to return nothing; the table parser needs real nodes
  let originalParseHTML: unknown;
  beforeAll(() => {
    const jquery = (globalThis as any).$;
    originalParseHTML = jquery.parseHTML;
    jquery.parseHTML = (text: string) => {
      const template = document.createElement("template");
      template.innerHTML = text;
      return Array.from(template.content.childNodes);
    };
  });
  afterAll(() => {
    (globalThis as any).$.parseHTML = originalParseHTML;
  });

  // synthetic table in the DDB lineage shape: Lineage | Level 1 | Level 3 | Level 5
  const table = `<p>Choose a legacy from the Test Legacies table. When you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot.</p>
<table><thead><tr><td>Legacy</td><td>Level 1</td><td>Level 3</td><td>Level 5</td></tr></thead><tbody>
<tr><td>Ashen</td><td>You also know the Spark Burst cantrip.</td><td>Ember Bolt</td><td>Smoke Wall</td></tr>
<tr><td>Chthonic</td><td>You also know the Grave Touch cantrip.</td><td>Gloom Ward</td><td>Hollow Ray</td></tr>
</tbody></table>`;

  it("grants only the chosen row, with one free cast of the level 3 and 5 spells", () => {
    const result = AdvancementHelper.getHTMLDataForSpellAdvancements(table, "Tiefling (Ashen)");
    expect(result.cantripGrants).toEqual(["spark burst"]);
    expect(result.spellGrants).toEqual([
      { level: 3, name: "ember bolt", amount: "1" },
      { level: 5, name: "smoke wall", amount: "1" },
    ]);
  });

  it("matches a row DDB spells one letter differently from the option (Cthonic vs Chthonic)", () => {
    const result = AdvancementHelper.getHTMLDataForSpellAdvancements(table, "Tiefling (Cthonic)");
    expect(result.cantripGrants).toEqual(["grave touch"]);
    expect(result.spellGrants.map((grant) => grant.name)).toEqual(["gloom ward", "hollow ray"]);
  });

  it("grants nothing rather than every row when no row matches", () => {
    const result = AdvancementHelper.getHTMLDataForSpellAdvancements(table, "Tiefling (Verdant)");
    expect(result.cantripGrants).toEqual([]);
    expect(result.spellGrants).toEqual([]);
  });

  it("parses an always prepared spell with proficiency bonus casts", () => {
    const result = AdvancementHelper.parseHTMLSpellAdvancementData(
      "<p>You also always have the Beast Chat spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.</p>",
    );
    expect(result.spellGrants).toEqual([{ level: 1, name: "beast chat", amount: "@prof" }]);
  });

  it("reads reference-linked words in processed descriptions", () => {
    const result = AdvancementHelper.parseHTMLSpellAdvancementData("<p>You know the Minor &Reference[ill]{Illusion} cantrip.</p>");
    expect(result.cantripGrants).toEqual(["minor illusion"]);
    const escaped = AdvancementHelper.parseHTMLSpellAdvancementData("<p>You know the Minor &amp;Reference[ill]{Illusion} cantrip.</p>");
    expect(escaped.cantripGrants).toEqual(["minor illusion"]);
  });
});

// =============================================================================
// Spell cast grants (sentence bounded)
// =============================================================================
describe("AdvancementHelper spell cast grant parsing", () => {
  const traits = (text: string) => AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(`<p>${text}</p>`);

  it("keeps level gated grants in separate sentences apart", () => {
    const result = traits("Starting at 3rd level, you can cast the Alpha Bolt spell with this trait. Starting at 5th level, you can also cast the Beta Step spell with it. Once you cast Alpha Bolt or Beta Step with this trait, you can’t cast that spell with it again until you finish a Long Rest.");
    expect(result.spellGrants).toEqual([
      { level: 3, name: "alpha bolt", amount: "1" },
      { level: 5, name: "beta step", amount: "1" },
    ]);
  });

  it("applies 'each of these spells once' to the spells already named", () => {
    const result = traits("You learn the Gamma Ward spell and one level 1 spell of your choice. You can cast each of these spells once without expending a spell slot.");
    expect(result.spellGrants).toEqual([{ level: 1, name: "gamma ward", amount: "1" }]);
  });

  it("ignores DDB spell tags and non-breaking spaces", () => {
    expect(traits("You can cast [spell]Delta Mend[/spell] once without expending a spell slot.").spellGrants)
      .toEqual([{ level: 1, name: "delta mend", amount: "1" }]);
    expect(traits("You can cast the Epsilon&nbsp;Glow spell once with this trait.").spellGrants)
      .toEqual([{ level: 1, name: "epsilon glow", amount: "1" }]);
  });

  it("keeps spell names that contain a list separator whole", () => {
    const result = traits("You can cast purify food and drink and detect poison and disease with this trait. Once you cast either spell, you can’t cast it again until you finish a Long Rest.");
    expect(result.spellGrants.map((grant) => grant.name)).toEqual(["purify food and drink", "detect poison and disease"]);
    expect(traits("You can cast pass without trace once with this trait.").spellGrants.map((grant) => grant.name))
      .toEqual(["pass without trace"]);
  });

  it("reads proficiency bonus and ability modifier uses", () => {
    expect(traits("You can cast Zeta Call without expending a spell slot a number of times equal to your Proficiency Bonus.").spellGrants)
      .toEqual([{ level: 1, name: "zeta call", amount: "@prof" }]);
    expect(traits("You can cast Zeta Call without expending a spell slot a number of times equal to your Wisdom modifier (minimum of once).").spellGrants)
      .toEqual([{ level: 1, name: "zeta call", amount: "max(1, @abilities.wis.mod)" }]);
  });

  it("treats a learned cantrip as a cantrip, not a spell", () => {
    const result = traits("You learn the Eta Spark cantrip, which you cast using Intelligence as your spellcasting ability for this spell.");
    expect(result.cantripGrants).toEqual(["eta spark"]);
    expect(result.spellGrants).toEqual([]);
  });

  it("does not turn a back-reference into a spell", () => {
    expect(traits("You can cast it once without expending a spell slot.").spellGrants).toEqual([]);
  });

  it("does not grant a spell the text only lets you cast normally", () => {
    const result = traits("When you hit, you can cast Theta Strike without using a Bonus Action. You expend a spell slot as normal, and you can cast this spell in this way only once per turn.");
    expect(result.spellGrants).toEqual([]);
  });

  it("stops a spell list at the first piece of prose", () => {
    const result = traits("You can cast Iota Hex, and you regain the ability to do so when you finish a Long Rest.");
    expect(result.spellGrants).toEqual([{ level: 1, name: "iota hex", amount: "1" }]);
  });

  it("reads always prepared spells with a free cast in either parser", () => {
    const html = "<p>You always have the Nu Mask and Xi Curse spells prepared. You can cast each spell once without a spell slot.</p>";
    const expected = [{ level: 1, name: "nu mask", amount: "1" }, { level: 1, name: "xi curse", amount: "1" }];
    expect(AdvancementHelper.parseHTMLSpellAdvancementData(html).spellGrants).toEqual(expected);
    expect(AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(html).spellGrants).toEqual(expected);
  });

  it("reads level pairs and learned cantrips in either parser", () => {
    const html = "<p>You learn the Omicron Frost cantrip. When you reach character levels 3 and 5, you learn the Pi Shard spell and the Rho Blade spell, respectively.</p>";
    for (const result of [AdvancementHelper.parseHTMLSpellAdvancementData(html), AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(html)]) {
      expect(result.cantripGrants).toEqual(["omicron frost"]);
      expect(result.spellGrants).toEqual([
        { level: 3, name: "pi shard", amount: "1" },
        { level: 5, name: "rho blade", amount: "1" },
      ]);
    }
  });

  it("keeps no uses on table grants that state no limit", () => {
    const result = AdvancementHelper.parseHTMLSpellAdvancementData("<p>Starting at 3rd level, you can cast the Kappa Veil spell with this trait.</p>");
    expect(result.spellGrants).toEqual([{ level: 3, name: "kappa veil" }]);
  });
});

describe("AdvancementHelper spell cast back-references", () => {
  it("limits only the spell a singular back-reference names", () => {
    const result = AdvancementHelper.parseHTMLSpellAdvancementDataForTraits("<p>You can cast Lambda Charm an unlimited number of times with this trait. Starting at 3rd level, you can also cast Mu Whisper with this trait. Once you cast it, you can’t do so again until you finish a Long Rest.</p>");
    expect(result.spellGrants).toEqual([
      { level: 1, name: "lambda charm", amount: "" },
      { level: 3, name: "mu whisper", amount: "1" },
    ]);
  });
});

describe("AdvancementHelper restricted spell choices", () => {
  const traits = (text: string) => AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(`<p>${text}</p>`);

  it("reads a fixed spell and a school restricted choice (2014 wording)", () => {
    const result = traits("You learn the Sigma Step spell and one 1st-level spell of your choice. The 1st-level spell must be from the divination or enchantment school of magic. You can cast each of these spells without expending a spell slot. Once you cast either of these spells in this way, you can’t cast that spell in this way again until you finish a long rest.");
    expect(result.spellGrants).toEqual([{ level: 1, name: "sigma step", amount: "1" }]);
    expect(result.spellChoices).toEqual([{ level: 1, spellList: "", amount: "1", schools: ["div", "enc"] }]);
  });

  it("reads a school restricted choice and 'that spell and the X spell' (2024 wording)", () => {
    const result = traits("Choose one level 1 spell from the Illusion or Necromancy school of magic. You always have that spell and the Tau Veil spell prepared. You can cast each of these spells without expending a spell slot. Once you cast either spell in this way, you can’t cast that spell in this way again until you finish a Long Rest.");
    expect(result.spellGrants).toEqual([{ level: 1, name: "tau veil", amount: "1" }]);
    expect(result.spellChoices).toEqual([{ level: 1, spellList: "", amount: "1", schools: ["ill", "nec"] }]);
  });

  it("reads a higher level school choice without a fixed spell", () => {
    const result = traits("You learn one 2nd-level spell of your choice. The 2nd-level spell must be from the abjuration or divination school of magic. You can cast this feat’s 2nd-level spell without a spell slot, and you must finish a long rest before you can cast it in this way again.");
    expect(result.spellGrants).toEqual([]);
    expect(result.spellChoices).toEqual([{ level: 2, spellList: "", amount: "1", schools: ["abj", "div"] }]);
  });

  it("reads a spell choice from a list named earlier", () => {
    const result = traits("You learn one cantrip of your choice from the artificer spell list, and you learn one 1st-level spell of your choice from that list. You can cast this feat’s 1st-level spell without a spell slot, and you must finish a long rest before you can cast it in this way again.");
    expect(result.spellListCantripChoice).toBe("artificer");
    expect(result.spellChoices).toEqual([{ level: 1, spellList: "artificer", amount: "1" }]);
  });
});

