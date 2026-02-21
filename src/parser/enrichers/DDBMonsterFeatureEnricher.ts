import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import { GenericEnrichers, MonsterEnrichers } from "./_module";
import { logger, utils } from "../../lib/_module";

export default class DDBMonsterFeatureEnricher extends DDBEnricherFactoryMixin {

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
      return null;
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
    const genericKeys = Object.keys(this.GENERIC_FEATURE_NAME);
    const splitName = this.name.split("(")[0].trim();
    const genericHint = genericKeys.find((key: string) => this.name === key || splitName === key);

    if (genericHint) {
      this.monsterHintName = "Generic";
      this.hintName = this.GENERIC_FEATURE_NAME[genericHint];
      return;
    }

    const startsWithKeys = Object.keys(this.GENERIC_FEATURE_NAME_STARTS_WITH);
    const startsWithHint = startsWithKeys.find((key: string) => this.name.startsWith(key));
    if (startsWithHint) {
      this.monsterHintName = "Generic";
      this.hintName = this.GENERIC_FEATURE_NAME_STARTS_WITH[startsWithHint];
      return;
    }

    const includesKeys = Object.keys(this.GENERIC_FEATURE_NAME_INCLUDES);
    const includesHint = includesKeys.find((key: string) => this.name.includes(key));
    if (includesHint) {
      this.monsterHintName = "Generic";
      this.hintName = this.GENERIC_FEATURE_NAME_INCLUDES[includesHint];
      return;
    }

    logger.debug(`No Monster Name Hint for ${this.name} (${this.monsterName})`);

    this.monsterHintName = this.monsterName;
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

  async load({ ddbParser, document, name = null, monster, is2014 = null }: { ddbParser: any; document: any; name?: any; monster: any; is2014?: any } = {} as any): Promise<void> {
    this.monster = monster;
    this.monsterName = this.monster.name;
    await super.load({ ddbParser, document, name, is2014 });
  }

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_2014_INCLUDES: Record<string, any> = {
    // "Dragon": "Dragon",
  };

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_INCLUDES: Record<string, any> = {
    // "Dragon": "Dragon",
    "Animated Object (": "Summon Animated Object",
    "Empyrean (": "Empyrean",
    "Giant Insect (": "Giant Insect",
    "Force Ballista": "Eldritch Cannon",
    "Flamethrower": "Eldritch Cannon",
    "Protector": "Eldritch Cannon",
  };

  NAME_HINTS_2014: Record<string, any> = {};

  NAME_HINTS: Record<string, any> = {
    "Elemental Cultist": {
      "Elemental Absorption (1/Day)": "Elemental Absorption",
    },
  };

  GENERIC_FEATURE_NAME: Record<string, any> = {
    "Fallible Invisibility": "Invisibility",
    "Invisibility": "Invisibility",
    "Mask of the Wild": "Mask of the Wild",
    "Multiattack": "Multiattack",
    "Reckless": "Reckless",
    "Reversal of Fortune": "Reversal of Fortune",
    "Shared Invisibility": "Invisibility",
    "Spell Reflection": "Spell Reflection",
    "Suave Defense": "Suave Defense",
    "Superior Invisibility": "Invisibility",
    "Uncanny Dodge": "Uncanny Dodge",
    "Illumination": "Illumination",
  };

  GENERIC_FEATURE_NAME_STARTS_WITH: Record<string, any> = {
    "Legendary Resistance": "Legendary Resistance",
    "Pack Tactics": "Pack Tactics",
  };

  GENERIC_FEATURE_NAME_INCLUDES: Record<string, any> = {
    "Absorption": "Absorption",
  };

  GENERIC_ENRICHERS: Record<string, any> = {
    "Absorption": MonsterEnrichers.Generic.Absorption,
    "Invisibility": MonsterEnrichers.Generic.Invisibility,
    "Legendary Resistance": MonsterEnrichers.Generic.LegendaryResistance,
    "Mask of the Wild": MonsterEnrichers.Generic.MaskOfTheWild,
    "Pack Tactics": MonsterEnrichers.Generic.PackTactics,
    "Reckless": GenericEnrichers.RecklessAttack,
    "Reversal of Fortune": MonsterEnrichers.Generic.ReversalOfFortune,
    "Suave Defense": MonsterEnrichers.Generic.SuaveDefense,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Illumination": MonsterEnrichers.Generic.Illumination,
  };

  ENRICHERS: Record<string, any> = {
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
    "Spectator": {
      "Eye Rays": MonsterEnrichers.Beholder.EyeRays,
    },
    "Dullahan": {
      "Headless Wail (Costs 2 Actions)": MonsterEnrichers.Dullahan.HeadlessWail,
      "Headless Summoning (Recharges After A Short Or Long Rest)": MonsterEnrichers.Dullahan.HeadlessSummoning,
    },
    "Spiritual Weapon": {
      "Move and Attack": MonsterEnrichers.SpiritualWeapon.Attack,
    },
  };
}
