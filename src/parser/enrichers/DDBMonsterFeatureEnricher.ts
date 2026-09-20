import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as GenericEnrichers from "./generic/_module";
import * as MonsterEnrichers from "./monster/_module";
import { logger, utils } from "../../lib/_module";
import DDBMonsterFeature from "../monster/features/DDBMonsterFeature";
import type DDBEnricherData from "./data/DDBEnricherData";

export default class DDBMonsterFeatureEnricher extends DDBEnricherFactoryMixin<Record<string, string>> {
  // monster and monsterName are assigned in load() before any enricher lookup runs
  monster!: I5eMonsterData;
  monsterName!: string;
  monsterHintName: string | null;
  // diagnostic data, only set when a monster enricher match is found
  hints?: {
    monsterHintName: string;
    featName: string;
  };

  _splitNameLoader(): DDBEnricherData | null {
    if (!this.name) return null;
    this.name = this.name.split("(")[0].trim();
    return this._loadEnricherData();
  }

  _defaultNameLoader(): DDBEnricherData | null {
    if (!this.name) return null;
    const monsterHintName = utils.pascalCase(this.monsterHintName ?? this.monsterName);
    const featName = utils.pascalCase(this.name);
    const Enricher = (MonsterEnrichers as TEnricherGroupMap)[monsterHintName]?.[featName];
    if (!Enricher) {
      if (this.name.includes("(")) {
        return this._splitNameLoader();
      }
      return this._genericFallbackLoader();
    }
    this.hints = {
      monsterHintName,
      featName,
    };
    return new Enricher({
      ddbEnricher: this,
    });
  }

  /**
   * A monster-name hint (MONSTER_NAME_HINT_INCLUDES) routes resolution to a
   * per-monster enricher group before the generic feature-name maps are ever
   * consulted. When that group has no match for the feature, fall back to the
   * generic maps so hint-mapped monsters (e.g. "Empyrean (Celestial)") keep
   * cross-monster automation like Legendary Resistance.
   */
  _genericFallbackLoader(): DDBEnricherData | null {
    if ((this.monsterHintName ?? this.monsterName) === "Generic") return null;
    const genericHint = this._genericFeatureHint(this.name ?? "");
    if (!genericHint) return null;
    this.monsterHintName = "Generic";
    this.hintName = genericHint;
    return this._loadEnricherData();
  }

  override _loadEnricherData(): DDBEnricherData | null {
    const monsterHintName = this.monsterHintName ?? this.monsterName;
    const hintName = this.hintName;
    if (!hintName || !this.ENRICHERS?.[monsterHintName]?.[hintName]) {
      return this._defaultNameLoader();
    }
    return new this.ENRICHERS[monsterHintName][hintName]({
      ddbEnricher: this,
    });
  }


  _getMonsterNameHint(): void {
    if (this.is2014) {
      const keys = Object.keys(this.MONSTER_NAME_HINT_2014_INCLUDES);
      const hint = keys.find((key: string) => this.monsterName.includes(key));
      if (hint) {
        this.monsterHintName = this.MONSTER_NAME_HINT_2014_INCLUDES[hint];
        return;
      }
    }
    const keys = Object.keys(this.MONSTER_NAME_HINT_INCLUDES);
    const hint = keys.find((key: string) => this.monsterName.includes(key));

    if (hint) {
      this.monsterHintName = this.MONSTER_NAME_HINT_INCLUDES[hint];
      return;
    }

    // no monster or monster partial match, check generic options
    const genericHint = this._genericFeatureHint(this.name ?? "");
    if (genericHint) {
      this.monsterHintName = "Generic";
      this.hintName = genericHint;
      return;
    }

    logger.debug(`No Monster Name Hint for ${this.name} (${this.monsterName})`);

    this.monsterHintName = this.monsterName;
  }

  /** Resolve a feature name against the generic feature-name maps. */
  _genericFeatureHint(name: string): string | null {
    const splitName = name.split("(")[0].trim();
    const exactHint = Object.keys(this.GENERIC_FEATURE_NAME)
      .find((key: string) => name === key || splitName === key);
    if (exactHint) return this.GENERIC_FEATURE_NAME[exactHint];

    const startsWithHint = Object.keys(this.GENERIC_FEATURE_NAME_STARTS_WITH)
      .find((key: string) => name.startsWith(key));
    if (startsWithHint) return this.GENERIC_FEATURE_NAME_STARTS_WITH[startsWithHint];

    const includesHint = Object.keys(this.GENERIC_FEATURE_NAME_INCLUDES)
      .find((key: string) => name.includes(key));
    if (includesHint) return this.GENERIC_FEATURE_NAME_INCLUDES[includesHint];

    return null;
  }

  override _getNameHint(): void {
    const name = this.name ?? "";
    const fullHint = (this.is2014 ? this.NAME_HINTS_2014[this.monsterName]?.[name] : null)
      ?? this.NAME_HINTS[this.monsterName]?.[name];

    if (fullHint) {
      this.hintName = fullHint;
      return;
    }

    this._getMonsterNameHint();
    if (this.monsterHintName === "Generic") return;

    // _getMonsterNameHint always sets monsterHintName; the fallback mirrors its final branch
    const monsterHintName = this.monsterHintName ?? this.monsterName;
    const partialHint = (this.is2014 ? this.NAME_HINTS_2014[monsterHintName]?.[name] : null)
      ?? this.NAME_HINTS[monsterHintName]?.[name];
    if (partialHint) {
      this.hintName = partialHint;
      return;
    }

    this.hintName = this.name;
  }

  constructor({
    activityGenerator,
    notifier = null,
  }: {
    activityGenerator: TActivityGenerator;
    notifier?: NotifierV1 | null;
    fallbackEnricher?: string;
  }) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "monster",
      notifier,
    });
    this.monsterHintName = null;
  }

  override async load({ ddbParser, document, name = null, monster, is2014 = null }: {
    ddbParser: DDBMonsterFeature;
    document?: I5eWeaponItem | I5eFeatItem | I5eInventoryItem;
    name?: string | null;
    monster: I5eMonsterData;
    is2014?: boolean | null;
  }): Promise<void> {
    this.monster = monster;
    this.monsterName = this.monster.name;
    await super.load({ ddbParser, document, name, is2014 });
  }

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_2014_INCLUDES: Record<string, string> = {
    // "Dragon": "Dragon",
  };

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_INCLUDES: Record<string, string> = {
    // "Dragon": "Dragon",
    "Animated Object (": "Summon Animated Object",
    "Empyrean (": "Empyrean",
    "Giant Insect (": "Giant Insect",
    "Force Ballista": "Eldritch Cannon",
    "Flamethrower": "Eldritch Cannon",
    "Protector": "Eldritch Cannon",
  };

  override NAME_HINTS_2014: Record<string, Record<string, string>> = {};

  override NAME_HINTS: Record<string, Record<string, string>> = {
    "Elemental Cultist": {
      "Elemental Absorption (1/Day)": "Elemental Absorption",
    },
  };

  GENERIC_FEATURE_NAME: Record<string, string> = {
    "Blood Frenzy": "Blood Frenzy",
    "Brave": "Brave",
    "Dark Devotion": "Dark Devotion",
    "Dwarven Resilience": "Dwarven Resilience",
    "Fallible Invisibility": "Invisibility",
    "Fey Ancestry": "Fey Ancestry",
    "Grappler": "Grappler",
    "Improved Critical": "Improved Critical",
    "Invisibility": "Invisibility",
    // a lair's options arrive as one feature: "Lair Actions" for legacy stat blocks, and the
    // lair's own heading where a partner book folds the actions into it
    "An Apple Tree Dragon's Lair": "Lair Actions",
    "Lair Actions": "Lair Actions",
    "Light Sensitivity": "Sunlight Sensitivity",
    "Magic Resistance": "Magic Resistance",
    "Mask of the Wild": "Mask of the Wild",
    "Mental Fortitude": "Mental Fortitude",
    "Multiattack": "Multiattack",
    "Multiple Heads": "Two Heads",
    "Petrifying Gaze": "Petrifying Gaze",
    "Reckless": "Reckless",
    "Reversal of Fortune": "Reversal of Fortune",
    "Shared Invisibility": "Invisibility",
    "Slowing Breath": "Slowing Breath",
    "Spell Reflection": "Spell Reflection",
    "Suave Defense": "Suave Defense",
    "Sunlight Hypersensitivity": "Sunlight Sensitivity",
    "Sunlight Sensitivity": "Sunlight Sensitivity",
    "Sunlight Weakness": "Sunlight Sensitivity",
    "Weakening Breath": "Weakening Breath",
    "Weight of Wings": "Weight of Wings",
    "Superior Invisibility": "Invisibility",
    "The Pleurossa's Lair": "Lair Actions",
    "Two Heads": "Two Heads",
    "Uncanny Dodge": "Uncanny Dodge",
    "Illumination": "Illumination",
    "Vanish": "Invisibility",
    "Aberrant Ground": "Aberrant Ground",
    "Baleful Command": "Status Rider",
    "Brutal Gore": "Status Rider",
    "Burn": "Status Rider",
    "Chaos Blade": "Status Rider",
    "Chaos Claw": "Status Rider",
    "Chaos Staff": "Status Rider",
    "Charming": "Status Rider",
    "Curse of the Riddle": "Status Rider",
    "Cursed Touch": "Status Rider",
    "Euphoria Breath": "Status Rider",
    "Faerie Dust": "Status Rider",
    "Fiendish Blood": "Status Rider",
    "First Roar": "Status Rider",
    "Second Roar": "Status Rider",
    "Third Roar": "Status Rider",
    "Freezing Burst": "Status Rider",
    "Giggling Magic": "Status Rider",
    "Great Bow": "Status Rider",
    "Ice Spear": "Status Rider",
    "Icy Bite": "Status Rider",
    "Ocean Spear": "Status Rider",
    "Inferno Blast": "Status Rider",
    "Invitation": "Status Rider",
    "Majestic Song": "Status Rider",
    "Misty Escape": "Status Rider",
    "Mucus Cloud": "Status Rider",
    "Nimble Escape": "Status Rider",
    "Noxious Miasma": "Status Rider",
    "Ooze Cube": "Status Rider",
    "Psychic Warp": "Status Rider",
    "Rapport Spores": "Status Rider",
    "Ravage": "Status Rider",
    "Repulsion Breath": "Status Rider",
    "Restless Touch": "Status Rider",
    "Rotting Fist": "Status Rider",
    "Scorching Sands": "Status Rider",
    "Shadow Stealth": "Status Rider",
    "Shadowy Teleport": "Status Rider",
    "Shimmering Shield": "Status Rider",
    "Spiteful Escape": "Status Rider",
    "Stake to the Heart": "Status Rider",
    "Steal Body": "Status Rider",
    "Crackling Wave": "Status Rider",
    "Injecting Claw": "Status Rider",
    "Mutating Claw": "Status Rider",
    "Silver Needle": "Status Rider",
    "Tongue Twister": "Status Rider",
    "Stench Spray": "Status Rider",
    "Tendril": "Status Rider",
    "Tentacle Slam": "Status Rider",
    "Thunderbolt": "Status Rider",
    "Thunderous Bellow": "Status Rider",
    "Unnerving Gaze": "Status Rider",
    "Warping Hex": "Status Rider",
    "Water Jet": "Status Rider",
    "Web Strand": "Status Rider",
    "Weight of Years": "Status Rider",
    "Whirlwind": "Status Rider",
    "Whirlwind of Sand": "Status Rider",
    "World-Shaking Movement": "Status Rider",
    "Grasping Root": "Ongoing Damage",
    "Whelm": "Ongoing Damage",
    "Constricting Vine": "Ongoing Damage",
    "Vortex": "Ongoing Damage",
    "Life-Draining Root": "Ongoing Damage",
    "Smother": "Ongoing Damage",
    "Engulf": "Ongoing Damage",
    "Swallow": "Ongoing Damage",
    "Spores": "Ongoing Damage",
    "Create Whirlwind": "Ongoing Damage",
    "War Cry": "War Cry",
    "Bolster": "Bolster",
    "Fortify": "Fortify",
    "Rally": "Rally",
    "Protection": "Protection",
    "Riposte": "Riposte",
    "Counterattack": "Counterattack",
    "Freeze": "Freeze",
    "Fear of Fire": "Fear of Fire",
    "Eldritch Restoration": "Eldritch Restoration",
    "Hellish Restoration": "Hellish Restoration",
    "Spirit Jar": "Spirit Jar",
    "Undead Restoration": "Undead Restoration",
    "Iron Scent": "Iron Scent",
    "Life Suppression": "Life Suppression",
    "Reflective Carapace": "Reflective Carapace",
    "Berserk": "Berserk",
    "Maneuver": "Maneuver",
    "Adhesive": "Adhesive",
    "Shadow Escape": "Shadow Escape",
    "Barbed Hide": "Barbed Hide",
    "Attach": "Attach",
    "Crush": "Crush",
    "Sticky Shield": "Sticky Shield",
    "Sticky Net": "Sticky Net",
    "Prone Deficiency": "Prone Deficiency",
    "Energy Drain": "Energy Drain",
    "Deflect Missile": "Deflect Missile",
    "Animal Spirit": "Animal Spirit",
    "Hunger of Yeenoghu": "Hunger of Yeenoghu",
    "Sharpened Beak": "Sharpened Beak",
    "Fey Melody": "Fey Melody",
    "Cataclysmic Event": "Cataclysmic Event",
    "Vampire Weakness": "Vampire Weakness",
    "Living Shadow": "Living Shadow",
    "Beast of Burden": "Beast of Burden",
    "Confer Fire Resistance": "Confer Fire Resistance",
    "Consume Life": "Consume Life",
    "Claws": "Grapple Conditions",
    "Grab": "Grapple Conditions",
    "Fire Aura": "Damage Aura",
    "Flame Aura": "Damage Aura",
    "Heat Aura": "Damage Aura",
    "Mimicry": "Observer Check",
    "Transparent": "Observer Check",
    "Sleep Breath": "Staged Save",
    "Petrifying Bite": "Staged Save",
    "Infernal Glaive": "Infernal Wound",
    "Infernal Tail": "Infernal Wound",
    "Stench": "Turn Start Aura Save",
    "Deathly Stench": "Turn Start Aura Save",
    "Stench of Death": "Turn Start Aura Save",
    "Fear Aura": "Turn Start Aura Save",
    "Lordly Presence": "Turn Start Aura Save",
    "Annihilating Aura": "Turn Start Aura Save",
    "Rotting Presence": "Turn Start Aura Save",
    "Searing Presence": "Turn Start Aura Save",
    "Aura of Menace": "Turn Start Aura Save",
    "Ophidiophobia Aura": "Turn Start Aura Save",
    "Enchanting Presence": "Turn Start Aura Save",
    "Joyful Presence": "Turn Start Aura Save",
    "Sorrowful Presence": "Turn Start Aura Save",
    "Cloud of Vermin": "Turn Start Aura Save",
    "Cold Aura": "Turn Start Aura Save",
    "Drone": "Turn Start Aura Save",
    "Putrid Aura (Acid and Poison Forms Only)": "Turn Start Aura Save",
    "Putrid Stench": "Turn Start Aura Save",
    "Toxic Aura": "Turn Start Aura Save",
    "Foul": "Foul",
    "Weight of Ages": "Weight of Ages",
    // "starts its turn within N feet" auras
    "Aberrant Form": "Turn Start Aura Save",
    "Arcane Leak": "Turn Start Aura Save",
    "Captivating Presence": "Turn Start Aura Save",
    "Chilling Aura": "Turn Start Aura Save",
    "Chilling Presence": "Turn Start Aura Save",
    "Cloak of Dawn": "Turn Start Aura Save",
    "Cloud of Insects": "Turn Start Aura Save",
    "Confounding Ugliness": "Turn Start Aura Save",
    "Confusing Burble": "Turn Start Aura Save",
    "Crippling Fear": "Turn Start Aura Save",
    "Dire Cacophony": "Turn Start Aura Save",
    "Distracting Babble": "Turn Start Aura Save",
    "Dread": "Turn Start Aura Save",
    "Dreadful": "Turn Start Aura Save",
    "Fearsome Presence": "Turn Start Aura Save",
    "Fetid Aura": "Turn Start Aura Save",
    "Fiery Aura": "Turn Start Aura Save",
    "Foment Confusion": "Turn Start Aura Save",
    "Foment Madness": "Turn Start Aura Save",
    "Foul Form": "Turn Start Aura Save",
    "Fungal Aura": "Turn Start Aura Save",
    "Ghastly Visions": "Turn Start Aura Save",
    "Gibbering": "Turn Start Aura Save",
    "Halo of Pestilence": "Turn Start Aura Save",
    "Hideous Cacophony": "Turn Start Aura Save",
    "Horrid Gnashing": "Turn Start Aura Save",
    "Immobilizing Fear": "Turn Start Aura Save",
    "Maddening Babble": "Turn Start Aura Save",
    "Nauseating Stench": "Turn Start Aura Save",
    "Numbing Aura": "Turn Start Aura Save",
    "Psychic Maelstrom": "Turn Start Aura Save",
    "Sparkling Scales": "Turn Start Aura Save",
    "Sweet Fragrance": "Turn Start Aura Save",
    "Thirst Aura": "Turn Start Aura Save",
    "Unnerving Mask": "Turn Start Aura Save",
    "Void Warping": "Turn Start Aura Save",
    "Wing Bind": "Turn Start Aura Save",
    // the tail: also "ends its turn within N feet", enemy-only and aura-is-terrain wording
    "Agonizing Aura": "Turn Start Aura Save",
    "Aura of Annihilation": "Turn Start Aura Save",
    "Aura of Blood Lust": "Turn Start Aura Save",
    "Aura of Doom": "Turn Start Aura Save",
    "Aura of Drunkenness": "Turn Start Aura Save",
    "Aura of Erebos": "Turn Start Aura Save",
    "Aura of False Divinity": "Turn Start Aura Save",
    "Aura of Fury": "Turn Start Aura Save",
    "Aura of Luck": "Turn Start Aura Save",
    "Aura of Mind Erosion": "Turn Start Aura Save",
    "Aura of Nightmares": "Turn Start Aura Save",
    "Aura of Overwhelming Splendor": "Turn Start Aura Save",
    "Blighted Aura": "Turn Start Aura Save",
    "Boon of Dread": "Turn Start Aura Save",
    "Brambleskin": "Turn Start Aura Save",
    "Cacophony of Minds": "Turn Start Aura Save",
    "Ceaseless Screaming": "Turn Start Aura Save",
    "Contamination": "Turn Start Aura Save",
    "Corrupting Mist": "Turn Start Aura Save",
    "Dreamwalker's Charm": "Turn Start Aura Save",
    "Entropic Aura": "Turn Start Aura Save",
    "Eye of the Storm": "Turn Start Aura Save",
    "Flame Essence": "Turn Start Aura Save",
    "Frozen Aura": "Turn Start Aura Save",
    "Gatekeeper's Aura": "Turn Start Aura Save",
    "Horrid Sob": "Turn Start Aura Save",
    "Lightning Aura": "Turn Start Aura Save",
    "Molten Skin": "Turn Start Aura Save",
    "Negative Energy Aura": "Turn Start Aura Save",
    "Oncoming Storm": "Turn Start Aura Save",
    "Plague of Ill Omen": "Turn Start Aura Save",
    "Predatory Aura": "Turn Start Aura Save",
    "Primordial Aura": "Turn Start Aura Save",
    "Towering Terror": "Turn Start Aura Save",
    "Unbearable Stench": "Turn Start Aura Save",
    "Vile Stench": "Turn Start Aura Save",
    "Vile Vermin": "Turn Start Aura Save",
    "Viral Aura": "Turn Start Aura Save",
    "Void Aura": "Turn Start Aura Save",
    "Whirling Blades": "Turn Start Aura Save",
    // ally-buff emanations
    "Aura of Authority": "Ally Buff Aura",
    "Aura of Bravery": "Ally Buff Aura",
    "Marshal Undead": "Ally Buff Aura",
    "Turning Defiance": "Ally Buff Aura",
    // self-teleports; Misty Escape, Shadowy Teleport and Spiteful Escape stay on Status Rider
    "Astral Step": "Teleport",
    "Benign Transportation": "Teleport",
    "Benign Transposition": "Teleport",
    "Cloud Step": "Teleport",
    "Destined Jaunt": "Teleport",
    "Ethereal Step": "Teleport",
    "Far Realm Step": "Teleport",
    "Fey Leap": "Teleport",
    "Fey Step": "Teleport",
    "Flitterstep": "Teleport",
    "Grinning Step": "Teleport",
    "Hidden Step": "Teleport",
    "Jaunt": "Teleport",
    "Light Step": "Teleport",
    "Phase Step": "Teleport",
    "Psychic Step": "Teleport",
    "Shadow Jaunt": "Teleport",
    "Shadow Jump": "Teleport",
    "Shadow Step": "Teleport",
    "Shadowstep": "Teleport",
    "Spatial Loophole": "Teleport",
    "Starlight Step": "Teleport",
    "Teleport": "Teleport",
    "Time Slip": "Teleport",
    "Warp Step": "Teleport",
    // teleports riding on a save, damage or healing roll
    "Arcane Prowl": "Teleport",
    "Arcane Teleport": "Teleport",
    "Blinding Teleport": "Teleport",
    "Bone-Chilling Step": "Teleport",
    "Booming Step": "Teleport",
    "Corrosive Teleport": "Teleport",
    "Dark Teleport": "Teleport",
    "Deathly Teleport": "Teleport",
    "Eldritch Teleport": "Teleport",
    "Elemental Rebuke": "Teleport",
    "Fell Rebuke": "Teleport",
    "Fiery Teleport": "Teleport",
    "Flickering Teleport": "Teleport",
    "Frightening Teleport": "Teleport",
    "Radiant Teleport": "Teleport",
    "Recuperative Teleport": "Teleport",
    "Sands of Time": "Teleport",
    "Spiteful Teleport": "Teleport",
    "Shape-Shift": "Shape-Shift",
    "Tear Through Space": "Teleport",
    "Teleporting Lash": "Teleport",
    "Venomous Teleport": "Teleport",
    "Vile Teleport": "Teleport",
    "Void Warp": "Teleport",
  };

  GENERIC_FEATURE_NAME_STARTS_WITH: Record<string, string> = {
    "Keen ": "Keen Senses",
    "Legendary Resistance": "Legendary Resistance",
    "Pack Tactics": "Pack Tactics",
  };

  GENERIC_FEATURE_NAME_INCLUDES: Record<string, string> = {
    "Absorption": "Absorption",
    "Camouflage": "Camouflage",
  };

  GENERIC_ENRICHERS: Record<string, EnricherConstructor> = {
    "Absorption": MonsterEnrichers.Generic.Absorption,
    "Blood Frenzy": MonsterEnrichers.Generic.BloodFrenzy,
    "Brave": MonsterEnrichers.Generic.Brave,
    "Camouflage": MonsterEnrichers.Generic.Camouflage,
    "Dark Devotion": MonsterEnrichers.Generic.DarkDevotion,
    "Dwarven Resilience": MonsterEnrichers.Generic.DwarvenResilience,
    "Fey Ancestry": MonsterEnrichers.Generic.FeyAncestry,
    "Grappler": MonsterEnrichers.Generic.Grappler,
    "Improved Critical": MonsterEnrichers.Generic.ImprovedCritical,
    "Invisibility": MonsterEnrichers.Generic.Invisibility,
    "Keen Senses": MonsterEnrichers.Generic.KeenSenses,
    "Lair Actions": MonsterEnrichers.Generic.LairActions,
    "Legendary Resistance": MonsterEnrichers.Generic.LegendaryResistance,
    "Shape-Shift": MonsterEnrichers.Generic.ShapeShift,
    "Magic Resistance": MonsterEnrichers.Generic.MagicResistance,
    "Mask of the Wild": MonsterEnrichers.Generic.MaskOfTheWild,
    "Mental Fortitude": MonsterEnrichers.Generic.MentalFortitude,
    "Pack Tactics": MonsterEnrichers.Generic.PackTactics,
    "Petrifying Gaze": MonsterEnrichers.Generic.PetrifyingGaze,
    "Reckless": GenericEnrichers.RecklessAttack,
    "Reversal of Fortune": MonsterEnrichers.Generic.ReversalOfFortune,
    "Slowing Breath": MonsterEnrichers.Generic.SlowingBreath,
    "Suave Defense": MonsterEnrichers.Generic.SuaveDefense,
    "Sunlight Sensitivity": MonsterEnrichers.Generic.SunlightSensitivity,
    "Two Heads": MonsterEnrichers.Generic.TwoHeads,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Illumination": MonsterEnrichers.Generic.Illumination,
    "Weakening Breath": MonsterEnrichers.Generic.WeakeningBreath,
    "Aberrant Ground": MonsterEnrichers.Generic.AberrantGround,
    "Turn Start Aura Save": MonsterEnrichers.Generic.TurnStartAuraSave,
    "War Cry": MonsterEnrichers.Generic.WarCry,
    "Bolster": MonsterEnrichers.Generic.Bolster,
    "Fortify": MonsterEnrichers.Generic.Fortify,
    "Rally": MonsterEnrichers.Generic.Rally,
    "Protection": MonsterEnrichers.Generic.Protection,
    "Riposte": MonsterEnrichers.Generic.Riposte,
    "Counterattack": MonsterEnrichers.Generic.Counterattack,
    "Freeze": MonsterEnrichers.Generic.Freeze,
    "Fear of Fire": MonsterEnrichers.Generic.FearOfFire,
    "Eldritch Restoration": MonsterEnrichers.Generic.EldritchRestoration,
    "Hellish Restoration": MonsterEnrichers.Generic.HellishRestoration,
    "Spirit Jar": MonsterEnrichers.Generic.SpiritJar,
    "Undead Restoration": MonsterEnrichers.Generic.UndeadRestoration,
    "Iron Scent": MonsterEnrichers.Generic.IronScent,
    "Life Suppression": MonsterEnrichers.Generic.LifeSuppression,
    "Reflective Carapace": MonsterEnrichers.Generic.ReflectiveCarapace,
    "Berserk": MonsterEnrichers.Generic.Berserk,
    "Maneuver": MonsterEnrichers.Generic.Maneuver,
    "Adhesive": MonsterEnrichers.Generic.Adhesive,
    "Shadow Escape": MonsterEnrichers.Generic.ShadowEscape,
    "Barbed Hide": MonsterEnrichers.Generic.BarbedHide,
    "Attach": MonsterEnrichers.Generic.Attach,
    "Crush": MonsterEnrichers.Generic.Crush,
    "Sticky Shield": MonsterEnrichers.Generic.StickyShield,
    "Sticky Net": MonsterEnrichers.Generic.StickyNet,
    "Prone Deficiency": MonsterEnrichers.Generic.ProneDeficiency,
    "Energy Drain": MonsterEnrichers.Generic.EnergyDrain,
    "Deflect Missile": MonsterEnrichers.Generic.DeflectMissile,
    "Animal Spirit": MonsterEnrichers.Generic.AnimalSpirit,
    "Hunger of Yeenoghu": MonsterEnrichers.Generic.HungerOfYeenoghu,
    "Sharpened Beak": MonsterEnrichers.Generic.SharpenedBeak,
    "Fey Melody": MonsterEnrichers.Generic.FeyMelody,
    "Cataclysmic Event": MonsterEnrichers.Generic.CataclysmicEvent,
    "Vampire Weakness": MonsterEnrichers.Generic.VampireWeakness,
    "Living Shadow": MonsterEnrichers.Generic.LivingShadow,
    "Beast of Burden": MonsterEnrichers.Generic.BeastOfBurden,
    "Confer Fire Resistance": MonsterEnrichers.Generic.ConferFireResistance,
    "Consume Life": MonsterEnrichers.Generic.ConsumeLife,
    "Grapple Conditions": MonsterEnrichers.Generic.GrappleConditions,
    "Damage Aura": MonsterEnrichers.Generic.DamageAura,
    "Observer Check": MonsterEnrichers.Generic.ObserverCheck,
    "Staged Save": MonsterEnrichers.Generic.StagedSave,
    "Infernal Wound": MonsterEnrichers.Generic.InfernalWound,
    "Ongoing Damage": MonsterEnrichers.Generic.OngoingDamage,
    "Status Rider": MonsterEnrichers.Generic.StatusRider,
    "Foul": MonsterEnrichers.Generic.Foul,
    "Weight of Ages": MonsterEnrichers.Generic.WeightOfAges,
    "Weight of Wings": MonsterEnrichers.Generic.WeightOfWings,
    "Ally Buff Aura": MonsterEnrichers.Generic.AllyBuffAura,
    "Teleport": MonsterEnrichers.Generic.Teleport,
  };

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {};

  ENRICHERS: Record<string, Record<string, EnricherConstructor>> = {
    Generic: this.GENERIC_ENRICHERS,
    "Conjured Animals": { "Pack Damage": MonsterEnrichers.ConjuredAnimals.PackDamage },
    "Conjured Air Elemental": { "Air Element": MonsterEnrichers.ConjuredElemental.ElementDamage },
    "Conjured Earth Elemental": { "Earth Element": MonsterEnrichers.ConjuredElemental.ElementDamage },
    "Conjured Fire Elemental": { "Fire Element": MonsterEnrichers.ConjuredElemental.ElementDamage },
    "Conjured Water Elemental": { "Water Element": MonsterEnrichers.ConjuredElemental.ElementDamage },
    "Conjured Fey": { "Psychic Attack": MonsterEnrichers.ConjuredFey.PsychicAttack },
    "Construct Spirit (Stone)": {
      "Stony Lethargy (Stone Only)": MonsterEnrichers.SummonConstruct.StonyLethargy,
    },
    "Giant Insect": {
      "Poison Jab": MonsterEnrichers.GiantInsect.PoisonJab,
      "Venomous Spew (Centipede Only)": MonsterEnrichers.GiantInsect.VenomousSpew,
    },
    "Clay Golem": {
      "Haste (Recharge 5\u20136)": MonsterEnrichers.ClayGolem.Haste,
    },
    "EldritchCannon": {
      "Force Ballista": MonsterEnrichers.EldritchCannon.ForceBallista,
      "Flamethrower": MonsterEnrichers.EldritchCannon.Flamethrower,
      "Protector": MonsterEnrichers.EldritchCannon.Protector,
      "Explosive Force Ballista": MonsterEnrichers.EldritchCannon.ForceBallista,
      "Explosive Flamethrower": MonsterEnrichers.EldritchCannon.Flamethrower,
      "Explosive Protector": MonsterEnrichers.EldritchCannon.Protector,
    },
    "Beholder Zombie": {
      "Eye Ray": MonsterEnrichers.Beholder.EyeRays,
      "Eye Rays": MonsterEnrichers.Beholder.EyeRays,
    },
    "Xanathar (Beholder)": {
      "Eye Ray": MonsterEnrichers.Beholder.EyeRays,
      "Eye Rays": MonsterEnrichers.Beholder.EyeRays,
    },
    "Xanathar": {
      "Eye Ray": MonsterEnrichers.Beholder.EyeRays,
      "Eye Rays": MonsterEnrichers.Beholder.EyeRays,
    },
    "Spectator": {
      "Eye Rays": MonsterEnrichers.Beholder.EyeRays,
    },
    "Death Tyrant": {
      // the legendary "Eye Ray" (use one random ray) has no ray table of its own to carve up
      "Eye Rays": MonsterEnrichers.Beholder.EyeRays,
    },
    "Dullahan": {
      "Headless Wail (Costs 2 Actions)": MonsterEnrichers.Dullahan.HeadlessWail,
      "Headless Summoning (Recharges After A Short Or Long Rest)": MonsterEnrichers.Dullahan.HeadlessSummoning,
    },
    "Spiritual Weapon": {
      "Move and Attack": MonsterEnrichers.SpiritualWeapon.Attack,
    },
    "Venom Troll": {
      "Venom Spray": MonsterEnrichers.VenomTroll.VenomSpray,
      "Venom Spray (Recharge 6)": MonsterEnrichers.VenomTroll.VenomSpray,
    },
  };
}
