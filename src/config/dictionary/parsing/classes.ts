/**
 * Classes DDB ships as their own class definitions that are built from a core class: the World of
 * Warcraft classes (source 313) copy the 2024 class features with WoW changes on top (the Shaman is
 * the Barbarian with Totems, the Death Knight the Paladin with Death Coil). Mapping them to that core
 * class lets the core class enrichers, scale values and rule special cases apply to them. Classes
 * whose DDB name already matches the core class (the WoW Paladin, Druid, Monk, Rogue and Warlock)
 * need no entry.
 */
export const CLASS_BASE_NAMES: Record<string, string> = {
  "Death Knight": "Paladin",
  "Demon Hunter": "Ranger",
  "Evoker": "Sorcerer",
  "Hunter": "Ranger",
  "Mage": "Wizard",
  "Priest": "Cleric",
  "Shaman": "Barbarian",
  "Warrior": "Fighter",
};

/**
 * Subclasses of those classes that reprint a core or book subclass under another name, keyed by
 * "<class>|<subclass>" because the WoW specializations share names across classes ("Holy
 * Specialization" is both a Paladin and a Priest subclass). Matched from the subclass features each
 * specialization carries.
 */
export const SUBCLASS_BASE_NAMES: Record<string, string> = {
  "Death Knight|Blood Specialization": "Oath of the Ebon Blade",
  "Death Knight|Frost Specialization": "Oath of the Ebon Blade",
  "Death Knight|Unholy Specialization": "Oath of the Ebon Blade",
  "Demon Hunter|Devourer Specialization": "Demon Hunter",
  "Demon Hunter|Havoc Specialization": "Demon Hunter",
  "Demon Hunter|Vengeance Specialization": "Demon Hunter",
  "Druid|Balance Specialization": "Circle of the Stars",
  "Druid|Feral Specialization": "Circle of the Moon",
  "Druid|Guardian Specialization": "Circle of the Moon",
  "Druid|Restoration Specialization": "Circle of the Land",
  "Evoker|Augmentation Specialization": "Draconic Sorcery",
  "Evoker|Devastation Specialization": "Draconic Sorcery",
  "Evoker|Preservation Specialization": "Draconic Sorcery",
  "Hunter|Beast Mastery Specialization": "Beast Master",
  "Hunter|Marksmanship Specialization": "Hunter",
  "Hunter|Survival Specialization": "Beast Master",
  "Mage|Arcane Specialization": "Evoker",
  "Mage|Fire Specialization": "Evoker",
  "Mage|Frost Specialization": "Evoker",
  "Monk|Brewmaster Specialization": "Warrior of Mystic Brews",
  "Monk|Mistweaver Specialization": "Warrior of Mercy",
  "Monk|Windwalker Specialization": "Warrior of the Open Hand",
  "Paladin|Holy Specialization": "Oath of the Holy",
  "Paladin|Protection Specialization": "Oath of Devotion",
  "Paladin|Retribution Specialization": "Oath of Vengeance",
  "Priest|Discipline Specialization": "Discipline Domain",
  "Priest|Holy Specialization": "Life Domain",
  "Priest|Shadow Specialization": "Shadow Domain",
  "Rogue|Assassin Specialization": "Assassin",
  "Rogue|Outlaw Specialization": "Swashbuckler",
  "Rogue|Subtlety Specialization": "Soulknife",
  "Shaman|Elemental Specialization": "Path of the Elements",
  "Shaman|Enhancement Specialization": "Path of the Spiritual Guardian",
  "Shaman|Restoration Specialization": "Path of the World Tree",
  "Warlock|Affliction Specialization": "Great Old One Patron",
  "Warlock|Demonology Specialization": "Fiend Patron",
  "Warlock|Destruction Specialization": "Fiend Patron",
  "Warrior|Arms Specialization": "Battle Master",
  "Warrior|Fury Specialization": "Champion",
  "Warrior|Protection Specialization": "Battle Master",
};
