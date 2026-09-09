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
