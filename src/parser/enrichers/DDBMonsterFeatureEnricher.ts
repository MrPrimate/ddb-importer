import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import { GenericEnrichers, MonsterEnrichers } from "./_module";
import { logger, utils } from "../../lib/_module";
import DDBMonsterFeature from "../monster/features/DDBMonsterFeature";

export default class DDBMonsterFeatureEnricher extends DDBEnricherFactoryMixin<Record<string, string>> {
  monster: I5eMonsterData;
  monsterName: string;
  monsterHintName: string | null;
  hints: {
    monsterHintName: string;
    featName: string;
  };

  _splitNameLoader(): any {
    this.name = this.name.split("(")[0].trim();
    return this._loadEnricherData();
  }

  _defaultNameLoader(): any {
    const monsterHintName = utils.pascalCase(this.monsterHintName ?? this.monsterName);
    const featName = utils.pascalCase(this.name);
    if (!MonsterEnrichers[monsterHintName]?.[featName]) {
      if (this.name.includes("(")) {
        return this._splitNameLoader();
      }
      return this._genericFallbackLoader();
    }
    this.hints = {
      monsterHintName,
      featName,
    };
    return new MonsterEnrichers[monsterHintName][featName]({
      ddbEnricher: this,
    });
  }

  _loadEnricherData(): any {
    const monsterHintName = this.monsterHintName ?? this.monsterName;
    if (!this.ENRICHERS?.[monsterHintName]?.[this.hintName]) {
      return this._defaultNameLoader();
    }
    return new this.ENRICHERS[monsterHintName][this.hintName]({
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

  /**
   * A monster-name hint (MONSTER_NAME_HINT_INCLUDES) routes resolution to a
   * per-monster enricher group before the generic feature-name maps are ever
   * consulted. When that group has no match for the feature, fall back to the
   * generic maps so hint-mapped monsters (e.g. "Empyrean (Celestial)") keep
   * cross-monster automation like Legendary Resistance.
   */
  _genericFallbackLoader(): any {
    if ((this.monsterHintName ?? this.monsterName) === "Generic") return null;
    const genericHint = this._genericFeatureHint(this.name ?? "");
    if (!genericHint) return null;
    this.monsterHintName = "Generic";
    this.hintName = genericHint;
    return this._loadEnricherData();
  }

  _getNameHint(): void {
    const fullHint = (this.is2014 ? this.NAME_HINTS_2014[this.monsterName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterName]?.[this.name];

    if (fullHint) {
      this.hintName = fullHint;
      return;
    }

    this._getMonsterNameHint();
    if (this.monsterHintName === "Generic") return;

    const partialHint = (this.is2014 ? this.NAME_HINTS_2014[this.monsterHintName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterHintName]?.[this.name];
    if (partialHint) {
      this.hintName = partialHint;
      return;
    }

    this.hintName = this.name;
  }

  constructor({ activityGenerator, notifier = null }: { activityGenerator: any; notifier?: any } = {} as any) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "monster",
      notifier,
    });
    this.monsterHintName = null;
  }

  async load({ ddbParser, document, name = null, monster, is2014 = null }: { ddbParser: DDBMonsterFeature; document?: I5eWeaponItem | I5eFeatItem | I5eInventoryItem; name?: any; monster: I5eMonsterData; is2014?: any }): Promise<void> {
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

  NAME_HINTS_2014: Record<string, Record<string, string>> = {};

  NAME_HINTS: Record<string, Record<string, string>> = {
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
    "Spell Reflection": "Spell Reflection",
    "Suave Defense": "Suave Defense",
    "Sunlight Hypersensitivity": "Sunlight Sensitivity",
    "Sunlight Sensitivity": "Sunlight Sensitivity",
    "Sunlight Weakness": "Sunlight Sensitivity",
    "Weakening Breath": "Weakening Breath",
    "Superior Invisibility": "Invisibility",
    "Two Heads": "Two Heads",
    "Uncanny Dodge": "Uncanny Dodge",
    "Illumination": "Illumination",
    "Vanish": "Invisibility",
    "Void Warp": "Teleport",
    "Vile Teleport": "Teleport",
    "Venomous Teleport": "Teleport",
    "Teleporting Lash": "Teleport",
    "Tear Through Space": "Teleport",
    "Shape-Shift": "Shape-Shift",
    "Spiteful Teleport": "Teleport",
    "Sands of Time": "Teleport",
    "Recuperative Teleport": "Teleport",
    "Radiant Teleport": "Teleport",
    "Frightening Teleport": "Teleport",
    "Flickering Teleport": "Teleport",
    "Fiery Teleport": "Teleport",
    "Fell Rebuke": "Teleport",
    "Elemental Rebuke": "Teleport",
    "Eldritch Teleport": "Teleport",
    "Deathly Teleport": "Teleport",
    "Dark Teleport": "Teleport",
    "Corrosive Teleport": "Teleport",
    "Booming Step": "Teleport",
    "Bone-Chilling Step": "Teleport",
    "Blinding Teleport": "Teleport",
    "Arcane Teleport": "Teleport",
    "Arcane Prowl": "Teleport",
    "Warp Step": "Teleport",
    "Time Slip": "Teleport",
    "Teleport": "Teleport",
    "Starlight Step": "Teleport",
    "Spatial Loophole": "Teleport",
    "Shadowstep": "Teleport",
    "Shadow Step": "Teleport",
    "Shadow Jump": "Teleport",
    "Shadow Jaunt": "Teleport",
    "Psychic Step": "Teleport",
    "Phase Step": "Teleport",
    "Light Step": "Teleport",
    "Jaunt": "Teleport",
    "Hidden Step": "Teleport",
    "Grinning Step": "Teleport",
    "Flitterstep": "Teleport",
    "Fey Step": "Teleport",
    "Fey Leap": "Teleport",
    "Far Realm Step": "Teleport",
    "Ethereal Step": "Teleport",
    "Destined Jaunt": "Teleport",
    "Cloud Step": "Teleport",
    "Benign Transposition": "Teleport",
    "Benign Transportation": "Teleport",
    "Astral Step": "Teleport",
    "Infernal Tail": "Infernal Wound",
    "Infernal Glaive": "Infernal Wound",
    "Petrifying Bite": "Staged Save",
    "Sleep Breath": "Staged Save",
    "Transparent": "Observer Check",
    "Mimicry": "Observer Check",
    "Heat Aura": "Damage Aura",
    "Flame Aura": "Damage Aura",
    "Fire Aura": "Damage Aura",
    "Grab": "Grapple Conditions",
    "Claws": "Grapple Conditions",
    "Consume Life": "Consume Life",
    "Confer Fire Resistance": "Confer Fire Resistance",
    "Beast of Burden": "Beast of Burden",
    "Living Shadow": "Living Shadow",
    "Vampire Weakness": "Vampire Weakness",
    "Cataclysmic Event": "Cataclysmic Event",
    "Fey Melody": "Fey Melody",
    "Sharpened Beak": "Sharpened Beak",
    "Hunger of Yeenoghu": "Hunger of Yeenoghu",
    "Animal Spirit": "Animal Spirit",
    "Deflect Missile": "Deflect Missile",
    "Energy Drain": "Energy Drain",
    "Prone Deficiency": "Prone Deficiency",
    "Sticky Net": "Sticky Net",
    "Sticky Shield": "Sticky Shield",
    "Crush": "Crush",
    "Attach": "Attach",
    "Barbed Hide": "Barbed Hide",
    "Shadow Escape": "Shadow Escape",
    "Adhesive": "Adhesive",
    "Maneuver": "Maneuver",
    "Berserk": "Berserk",
    "Reflective Carapace": "Reflective Carapace",
    "Life Suppression": "Life Suppression",
    "Iron Scent": "Iron Scent",
    "Undead Restoration": "Undead Restoration",
    "Spirit Jar": "Spirit Jar",
    "Hellish Restoration": "Hellish Restoration",
    "Eldritch Restoration": "Eldritch Restoration",
    "Fear of Fire": "Fear of Fire",
    "Freeze": "Freeze",
    "Counterattack": "Counterattack",
    "Riposte": "Riposte",
    "Protection": "Protection",
    "Rally": "Rally",
    "Fortify": "Fortify",
    "Bolster": "Bolster",
    "War Cry": "War Cry",
    "Create Whirlwind": "Ongoing Damage",
    "Spores": "Ongoing Damage",
    "Swallow": "Ongoing Damage",
    "Engulf": "Ongoing Damage",
    "Smother": "Ongoing Damage",
    "Life-Draining Root": "Ongoing Damage",
    "Vortex": "Ongoing Damage",
    "Constricting Vine": "Ongoing Damage",
    "Whelm": "Ongoing Damage",
    "Grasping Root": "Ongoing Damage",
    "World-Shaking Movement": "Status Rider",
    "Whirlwind of Sand": "Status Rider",
    "Whirlwind": "Status Rider",
    "Weight of Years": "Status Rider",
    "Web Strand": "Status Rider",
    "Water Jet": "Status Rider",
    "Warping Hex": "Status Rider",
    "Unnerving Gaze": "Status Rider",
    "Thunderous Bellow": "Status Rider",
    "Thunderbolt": "Status Rider",
    "Tentacle Slam": "Status Rider",
    "Tendril": "Status Rider",
    "Stench Spray": "Status Rider",
    "Tongue Twister": "Status Rider",
    "Silver Needle": "Status Rider",
    "Mutating Claw": "Status Rider",
    "Injecting Claw": "Status Rider",
    "Crackling Wave": "Status Rider",
    "Steal Body": "Status Rider",
    "Stake to the Heart": "Status Rider",
    "Spiteful Escape": "Status Rider",
    "Shimmering Shield": "Status Rider",
    "Shadowy Teleport": "Status Rider",
    "Shadow Stealth": "Status Rider",
    "Scorching Sands": "Status Rider",
    "Rotting Fist": "Status Rider",
    "Restless Touch": "Status Rider",
    "Repulsion Breath": "Status Rider",
    "Ravage": "Status Rider",
    "Rapport Spores": "Status Rider",
    "Psychic Warp": "Status Rider",
    "Ooze Cube": "Status Rider",
    "Noxious Miasma": "Status Rider",
    "Nimble Escape": "Status Rider",
    "Mucus Cloud": "Status Rider",
    "Misty Escape": "Status Rider",
    "Majestic Song": "Status Rider",
    "Invitation": "Status Rider",
    "Inferno Blast": "Status Rider",
    "Ocean Spear": "Status Rider",
    "Icy Bite": "Status Rider",
    "Ice Spear": "Status Rider",
    "Great Bow": "Status Rider",
    "Giggling Magic": "Status Rider",
    "Freezing Burst": "Status Rider",
    "Third Roar": "Status Rider",
    "Second Roar": "Status Rider",
    "First Roar": "Status Rider",
    "Fiendish Blood": "Status Rider",
    "Faerie Dust": "Status Rider",
    "Euphoria Breath": "Status Rider",
    "Cursed Touch": "Status Rider",
    "Curse of the Riddle": "Status Rider",
    "Charming": "Status Rider",
    "Chaos Staff": "Status Rider",
    "Chaos Claw": "Status Rider",
    "Chaos Blade": "Status Rider",
    "Burn": "Status Rider",
    "Brutal Gore": "Status Rider",
    "Baleful Command": "Status Rider",
    "The Pleurossa's Lair": "Lair Actions",
    "Weight of Wings": "Weight of Wings",
    "Lair Actions": "Lair Actions",
    "An Apple Tree Dragon's Lair": "Lair Actions",
    "Woodland Friends": "Summon Creatures",
    "Unearthly Bile": "Summon Creatures",
    "Teeming with Life": "Summon Creatures",
    "Summon Yugoloth": "Summon Creatures",
    "Summon Wraith": "Summon Creatures",
    "Summon Water Weird": "Summon Creatures",
    "Summon Undead": "Summon Creatures",
    "Summon Swarms of Insects": "Summon Creatures",
    "Summon Swarm": "Summon Creatures",
    "Summon Specters": "Summon Creatures",
    "Summon Solar Dragon": "Summon Creatures",
    "Summon Slaadi": "Summon Creatures",
    "Summon Shadow Demon": "Summon Creatures",
    "Summon Servant": "Summon Creatures",
    "Summon Nature's Avatar": "Summon Creatures",
    "Summon Mount": "Summon Creatures",
    "Summon Mephits": "Summon Creatures",
    "Summon Ice Devil": "Summon Creatures",
    "Summon Erinyes": "Summon Creatures",
    "Summon Elementals": "Summon Creatures",
    "Summon Elemental": "Summon Creatures",
    "Summon Earth Elemental": "Summon Creatures",
    "Summon Devil": "Summon Creatures",
    "Summon Demon": "Summon Creatures",
    "Summon Demodand": "Summon Creatures",
    "Summon Abyssal Hyenas": "Summon Creatures",
    "Sound the Horn": "Summon Creatures",
    "Rise, Fallen Soldier": "Summon Creatures",
    "Rise from Death": "Summon Creatures",
    "Repeating History": "Summon Creatures",
    "Reinforcements": "Summon Creatures",
    "Reanimate": "Summon Creatures",
    "Ravenous Children": "Summon Creatures",
    "Lupine Howl": "Summon Creatures",
    "Lord's Call": "Summon Creatures",
    "Ice Wolves": "Summon Creatures",
    "Hunter's Quarry": "Summon Creatures",
    "House Pests": "Summon Creatures",
    "Hell's Servitors": "Summon Creatures",
    "Get In Here": "Summon Creatures",
    "Fractal Refraction": "Summon Creatures",
    "Forest Protectors": "Summon Creatures",
    "Flowing Creation": "Summon Creatures",
    "Flash of Inspiration": "Summon Creatures",
    "Fey Mount": "Summon Creatures",
    "Elemental Servitor": "Summon Creatures",
    "Disgorge Zombie": "Summon Creatures",
    "Disgorge Allies": "Summon Creatures",
    "Denizens of the Wilds": "Summon Creatures",
    "Create Lornlings": "Summon Creatures",
    "Corpses": "Summon Creatures",
    "Children of the Night": "Summon Creatures",
    "Children of the Lower Planes": "Summon Creatures",
    "Children of the Forest": "Summon Creatures",
    "Children of Arbeyach": "Summon Creatures",
    "Centipede Singer": "Summon Creatures",
    "Call to Honor": "Summon Creatures",
    "Call the Hounds": "Summon Creatures",
    "Call of the Archimandrite": "Summon Creatures",
    "Call Spiderlings": "Summon Creatures",
    "Call Spawn": "Summon Creatures",
    "Call Rats": "Summon Creatures",
    "Call Children": "Summon Creatures",
    "Call Bats": "Summon Creatures",
    "Awaken Grove Guardians": "Summon Creatures",
    "Attract Bats": "Summon Creatures",
    "Animate Spirits": "Summon Creatures",
    "Animate Husks": "Summon Creatures",
    "Animate Bones": "Summon Creatures",
    "An Army from Blood": "Summon Creatures",
    "Action 2: The Manifold Self": "Summon Creatures",
    "Abyssal Rift": "Summon Creatures",
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
    "Legendary Resistance": MonsterEnrichers.Generic.LegendaryResistance,
    "Magic Resistance": MonsterEnrichers.Generic.MagicResistance,
    "Mask of the Wild": MonsterEnrichers.Generic.MaskOfTheWild,
    "Mental Fortitude": MonsterEnrichers.Generic.MentalFortitude,
    "Pack Tactics": MonsterEnrichers.Generic.PackTactics,
    "Petrifying Gaze": MonsterEnrichers.Generic.PetrifyingGaze,
    "Reckless": GenericEnrichers.RecklessAttack,
    "Reversal of Fortune": MonsterEnrichers.Generic.ReversalOfFortune,
    "Suave Defense": MonsterEnrichers.Generic.SuaveDefense,
    "Sunlight Sensitivity": MonsterEnrichers.Generic.SunlightSensitivity,
    "Two Heads": MonsterEnrichers.Generic.TwoHeads,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Illumination": MonsterEnrichers.Generic.Illumination,
    "Weakening Breath": MonsterEnrichers.Generic.WeakeningBreath,
    "Teleport": MonsterEnrichers.Generic.Teleport,
    "Weight of Wings": MonsterEnrichers.Generic.WeightOfWings,
    "Status Rider": MonsterEnrichers.Generic.StatusRider,
    "Ongoing Damage": MonsterEnrichers.Generic.OngoingDamage,
    "Infernal Wound": MonsterEnrichers.Generic.InfernalWound,
    "Staged Save": MonsterEnrichers.Generic.StagedSave,
    "Observer Check": MonsterEnrichers.Generic.ObserverCheck,
    "Damage Aura": MonsterEnrichers.Generic.DamageAura,
    "Grapple Conditions": MonsterEnrichers.Generic.GrappleConditions,
    "Consume Life": MonsterEnrichers.Generic.ConsumeLife,
    "Confer Fire Resistance": MonsterEnrichers.Generic.ConferFireResistance,
    "Beast of Burden": MonsterEnrichers.Generic.BeastOfBurden,
    "Living Shadow": MonsterEnrichers.Generic.LivingShadow,
    "Vampire Weakness": MonsterEnrichers.Generic.VampireWeakness,
    "Cataclysmic Event": MonsterEnrichers.Generic.CataclysmicEvent,
    "Fey Melody": MonsterEnrichers.Generic.FeyMelody,
    "Sharpened Beak": MonsterEnrichers.Generic.SharpenedBeak,
    "Hunger of Yeenoghu": MonsterEnrichers.Generic.HungerOfYeenoghu,
    "Animal Spirit": MonsterEnrichers.Generic.AnimalSpirit,
    "Deflect Missile": MonsterEnrichers.Generic.DeflectMissile,
    "Energy Drain": MonsterEnrichers.Generic.EnergyDrain,
    "Prone Deficiency": MonsterEnrichers.Generic.ProneDeficiency,
    "Sticky Net": MonsterEnrichers.Generic.StickyNet,
    "Sticky Shield": MonsterEnrichers.Generic.StickyShield,
    "Crush": MonsterEnrichers.Generic.Crush,
    "Attach": MonsterEnrichers.Generic.Attach,
    "Barbed Hide": MonsterEnrichers.Generic.BarbedHide,
    "Shadow Escape": MonsterEnrichers.Generic.ShadowEscape,
    "Adhesive": MonsterEnrichers.Generic.Adhesive,
    "Maneuver": MonsterEnrichers.Generic.Maneuver,
    "Berserk": MonsterEnrichers.Generic.Berserk,
    "Reflective Carapace": MonsterEnrichers.Generic.ReflectiveCarapace,
    "Life Suppression": MonsterEnrichers.Generic.LifeSuppression,
    "Iron Scent": MonsterEnrichers.Generic.IronScent,
    "Undead Restoration": MonsterEnrichers.Generic.UndeadRestoration,
    "Spirit Jar": MonsterEnrichers.Generic.SpiritJar,
    "Hellish Restoration": MonsterEnrichers.Generic.HellishRestoration,
    "Eldritch Restoration": MonsterEnrichers.Generic.EldritchRestoration,
    "Fear of Fire": MonsterEnrichers.Generic.FearOfFire,
    "Freeze": MonsterEnrichers.Generic.Freeze,
    "Counterattack": MonsterEnrichers.Generic.Counterattack,
    "Riposte": MonsterEnrichers.Generic.Riposte,
    "Protection": MonsterEnrichers.Generic.Protection,
    "Rally": MonsterEnrichers.Generic.Rally,
    "Fortify": MonsterEnrichers.Generic.Fortify,
    "Bolster": MonsterEnrichers.Generic.Bolster,
    "War Cry": MonsterEnrichers.Generic.WarCry,
    "Lair Actions": MonsterEnrichers.Generic.LairActions,
    "Summon Creatures": MonsterEnrichers.Generic.SummonCreatures,
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
