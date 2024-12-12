export const PARSING_ACTIONS = {
  KEEP_ACTIONS: [
    "Psychic Blades",
    "Sorcery Points",
    "Font of Magic: Sorcery Points",
  ],
  KEEP_ACTIONS_STARTSWITH: [
    "Metamagic:",
  ],
  SKIPPED_ACTIONS: [
    // weapon properties
    "Cleave",
    "Graze",
    "Nick",
    "Push",
    "Sap",
    "Slow",
    "Topple",
    "Vex",
    // others
    "Activate Large Form",
    "Assume Unbreakable Majesty",
    "Bardic Damage",
    "Bardic Inspiration: Agile Strikes",
    "Beguiling Magic: Regain Use",
    "Blink Steps",
    "Brew Poison",
    "Channel Divinity: Abjure Foes",
    "Channel Divinity: Divine Spark",
    "Channel Divinity: Guided Strike (Benefit Ally)",
    "Channel Divinity: Guided Strike (Self)",
    "Channel Divinity: Invoke Duplicity",
    "Channel Divinity: Sear Undead",
    "Channel Divinity: Turn Undead",
    "Channel Divinity: War God's Blessing",
    "Charge Attack",
    "Deflect Attack: Redirect Attack",
    "Deflect Attack",
    "Divine Strike",
    "Embody Legends",
    "Enhanced Dual Wielding",
    "Enhanced Unarmed Strike",
    "Evergreen Wildshape",
    "Flurry of Blows (Heightened)",
    "Flurry of Blows: Addle",
    "Flurry of Blows: Push",
    "Flurry of Blows: Topple",
    "Flurry of Blows",
    "Focus Points",
    "Form of the Beast: Tail (reaction)",
    "Free Casting",
    "Ghostly Gaze",
    "Grant Wrath of the Sea",
    "Hand of Harm: Physician's Touch",
    "Hand of Healing: Physician's Touch",
    "Improved Dash",
    "Invoke Duplicity: Cast Spells",
    "Invoke Duplicity: Distract",
    "Invoke Duplicity: Move Illusion",
    "Invoke Duplicity: Shared Distraction",
    "Ki Points",
    "Lay On Hands: Heal",
    "Lay On Hands: Purify Poison",
    "Lay on Hands: Restoring Touch",
    "Leave Druidic Message",
    "Luck Points",
    "Manifest Wrath of the Sea",
    "Merge with Shadows",
    "Moonlight Step: Regain Uses",
    "Nature Magician",
    "Patient Defense (Heightened)",
    "Patient Defense",
    "Polearm Master - Opportunity Attack",
    "Psionic Power: Protective Field",
    "Psionic Power: Psi-Bolstered Knack",
    "Psionic Power: Psi-Powered Leap",
    "Psionic Power: Psionic Energy Dice",
    "Psionic Power: Psionic Energy",
    "Psionic Power: Psionic Strike",
    "Psionic Power: Psychic Whispers",
    "Psionic Power: Recovery",
    "Psionic Power: Telekinetic Movement",
    "Psionic Power: Telekinetic Thrust",
    "Psychic Blades: Attack (STR)",
    "Psychic Blades: Bonus Attack (DEX)",
    "Psychic Blades: Bonus Attack (STR)",
    "Psychic Blades: Homing Strikes",
    "Psychic Blades: Rend Mind",
    "Psychic Teleportation",
    "Quick Search",
    "Rage (Instinctive Pounce)",
    "Rage: Regain Expended Uses",
    "Rage: Relentless Rage",
    "Rage: Teleport",
    "Reactive Spell",
    "Sacred Weapon: Imbue Weapon",
    "Saving Throw Reroll",
    "Second Wind: Tactical Shift",
    "Shift",
    "Soul Blades: Homing Strikes",
    "Soul Blades: Psychic Teleportation",
    "Speedy Recovery",
    "Step of the Wind (Heightened)",
    "Step of the Wind: Fleet Step",
    "Step of the Wind",
    "Stonecunning (Tremorsense)",
    "Summon Wildfire Spirit: Command",
    "Superiority Dice",
    "Telekinetic Master: Weapon Attack",
    "Unerring Strike",
    "War Priest: Bonus Attack",
    "Wild Magic Surge table",
    "Wild Shape: Circle Forms",
    "Wild Shape: Improved Lunar Radiance",
    "Imbue Aura of Protection",
    "Channel Divinity: Divine Sense",
    "Energy Redirection",
    "Battle Medic",
    "Avenging Angel",
    "Hunter's Mark",
    "Primal Companion: Restore Beast",
    "Primal Companion: Summon",
    "Hunter's Mark: Precise Hunter",
    "Temporary Hit Points",
    "Bolstering Performance",
    "Dreadful Strike: Sudden Strike",
    "Dreadful Strike: Mass Fear",
    "Dreadful Strike",
    "Hunter's Prey: Colossus Slayer",
    "Hunter's Mark: Superior Hunter's Prey",
    "Colossus Slayer",
    "Masterful Mimicry",
    "Steady Aim: Roving Aim",
    "Improve Fate",
    "Wild Magic Surge Table",
    "Font of Magic: Convert Spell Slots",
    "Telekinetic Shove",
    "Revelation in Flesh: Transform",
    "Trance of Order: Align Consciousness",
    "Healing Light: Expend Healing",
    "Awakened Mind: Clairvoyant Combatant",
    "Arcane Ward: Hit Points",
    "Arcane Ward - Hit Points",
    "Defile Ground: Move Corruption",
    "Unarmed Strike",
  ],
  SKIPPED_ACTIONS_STARTSWITH: [
    // weapon properties
    "Cleave (",
    "Graze (",
    "Nick (",
    "Push (",
    "Sap (",
    "Slow (",
    "Topple (",
    "Vex (",
    // others
    "Tactical Master:",
    "Brutal Strike:",
    "Channel Divinity: War God",
    "Combat Inspiration: ",
    "Font of Magic: Create",
    "Improved Brutal Strike:",
    "Land's Aid:",
    "Maneuver: Disarming Attack (Dex.",
    "Maneuver: Menacing Attack (Dex.",
    "Maneuver: Parry (Dex.",
    "Maneuver: Trip Attack (Dex.",
    "Misty Step: ",
    "Natural Recovery:",
    "Pact of the Blade:",
    "Sneak Attack:",
    "Starry Form:",
    "Wild Resurgence:",
    "War Bond:",
    "Slasher:",
    "Fast Hands:",
    "Use Magic Device:",
    "Elemental Affinity:",
  ],
  SKIPPED_2014_ONLY_ACTIONS: [
    "Convert Sorcery Points",
  ],
  SKIPPED_2024_ONLY_ACTIONS: [
    "Lifedrinker",
  ],
  HIGHEST_LEVEL_ONLY_ACTION_MATCH: [
    "Bardic Inspiration",
    "Channel Divinity: Invoke Duplicity",
    "Moonlight Step",
    "Warding Flare",
  ],
};


export const PARSING_ATTACK_ACTIONS = {
  FORCE_WEAPON_FEATURES: [
    "Unarmed Strike",
    "Psychic Blades: Attack (DEX)",
    "Psychic Blades: Attack (STR)",
    "Psychic Blades: Bonus Attack (DEX)",
    "Psychic Blades: Bonus Attack (STR)",
    "Psychic Blades",
    "Thunder Gauntlets",
    "Lightning Launcher",
    "Guardian Armor: Thunder Gauntlets",
    "Guardian Armor: Thunder Gauntlets (STR)",
    "Infiltrator Armor: Lightning Launcher",
    "Infiltrator Armor: Lightning Launcher (DEX)",
    "Arcane Propulsion Armor Gauntlet",
    "Arms of the Astral Self (WIS)",
    "Arms of the Astral Self (DEX/STR)",
    "Arms of the Astral Self",
    "Bite",
    "Claw",
    "Gore",
    "Sting",
    "Talon",
    "Trunk",
    "Claws",
    "Fangs",
    "Form of the Beast: Bite",
    "Form of the Beast: Claws",
    "Form of the Beast: Tail",
    "Fanged Bite",
  ],
};