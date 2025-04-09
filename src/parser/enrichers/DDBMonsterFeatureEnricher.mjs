import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { GenericEnrichers, MonsterEnrichers } from "./_module.mjs";
import { logger, utils } from "../../lib/_module.mjs";

export default class DDDMonsterFeatureEnricher extends DDBEnricherFactoryMixin {

  _defaultNameLoader() {
    const monsterHintName = utils.pascalCase(this.monsterHintName ?? this.monsterName);
    const featName = utils.pascalCase(this.name);
    if (!MonsterEnrichers[monsterHintName]?.[featName]) {
      return null;
    }
    return new MonsterEnrichers[monsterHintName][featName]({
      ddbEnricher: this,
    });
  }

  _loadEnricherData() {
    const monsterHintName = this.monsterHintName ?? this.monsterName;
    if (!this.ENRICHERS?.[monsterHintName]?.[this.hintName]) {
      return this._defaultNameLoader();
    }
    return new this.ENRICHERS[monsterHintName][this.hintName]({
      ddbEnricher: this,
    });
  }


  _getMonsterNameHint() {
    if (this.is2014) {
      const keys = Object.keys(this.MONSTER_NAME_HINT_2014_INCLUDES);
      const hint = keys.find((key) => this.monsterName.includes(key));
      if (hint) {
        this.monsterHintName = this.MONSTER_NAME_HINT_2014_INCLUDES[hint];
        return;
      }
    }
    const keys = Object.keys(this.MONSTER_NAME_HINT_INCLUDES);
    const hint = keys.find((key) => this.monsterName.includes(key));

    if (hint) {
      this.monsterHintName = this.MONSTER_NAME_HINT_INCLUDES[hint];
      return;
    }

    // no monster or monster partial match, check generic options
    const genericKeys = Object.keys(this.GENERIC_FEATURE_NAME);
    const splitName = this.name.split("(")[0].trim();
    const genericHint = genericKeys.find((key) => this.name === key || splitName === key);

    // console.warn(`Generic Hint for ${this.name} (${this.monsterName})`, {
    //   genericHint,
    //   genericKeys,
    //   name: `${this.name}`,
    //   splitName: `${splitName}`,
    //   monsterName: `${this.monsterName}`,
    // });
    if (genericHint) {
      this.monsterHintName = "Generic";
      this.hintName = this.GENERIC_FEATURE_NAME[genericHint];
      return;
    }

    const startsWithKeys = Object.keys(this.GENERIC_FEATURE_NAME_STARTS_WITH);
    const startsWithHint = startsWithKeys.find((key) => this.name.startsWith(key));
    if (startsWithHint) {
      this.monsterHintName = "Generic";
      this.hintName = this.GENERIC_FEATURE_NAME_STARTS_WITH[startsWithHint];
      return;
    }

    const includesKeys = Object.keys(this.GENERIC_FEATURE_NAME_INCLUDES);
    const includesHint = includesKeys.find((key) => this.name.includes(key));
    if (includesHint) {
      this.monsterHintName = "Generic";
      this.hintName = this.GENERIC_FEATURE_NAME_INCLUDES[includesHint];
      return;
    }

    logger.debug(`No Monster Name Hint for ${this.name} (${this.monsterName})`);

    this.monsterHintName = this.monsterName;
  }

  _getNameHint() {
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

  constructor({ activityGenerator, notifier = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "monster",
      notifier,
    });
    this.monsterHintName = null;
  }

  async load({ ddbParser, document, name = null, monster, is2014 = null } = {}) {
    this.monster = monster;
    this.monsterName = this.monster.name;
    await super.load({ ddbParser, document, name, is2014 });
  }

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_2014_INCLUDES = {
    // "Dragon": "Dragon",
  };

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_INCLUDES = {
    // "Dragon": "Dragon",
    "Animated Object (": "Summon Animated Object",
    "Empyrean (": "Empyrean",
    "Giant Insect (": "Giant Insect",
    "Force Ballista": "Eldritch Cannon",
    "Flamethrower": "Eldritch Cannon",
    "Protector": "Eldritch Cannon",
  };

  NAME_HINTS_2014 = {};

  NAME_HINTS = {
    "Elemental Cultist": {
      "Elemental Absorption (1/Day)": "Elemental Absorption",
    },
  };

  GENERIC_FEATURE_NAME = {
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

  GENERIC_FEATURE_NAME_STARTS_WITH = {
    "Legendary Resistance": "Legendary Resistance",
    "Pack Tactics": "Pack Tactics",
  };

  GENERIC_FEATURE_NAME_INCLUDES = {
    "Absorption": "Absorption",
  };

  GENERIC_ENRICHERS = {
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

  ENRICHERS = {
    Generic: this.GENERIC_ENRICHERS,
    "Conjured Animals": { "Pack Damage": MonsterEnrichers.ConjuredAnimals.PackDamage },
    "Conjured Air Elemental": { "Air Element": MonsterEnrichers.ConjuredElemental.AirElement },
    "Conjured Earth Elemental": { "Earth Element": MonsterEnrichers.ConjuredElemental.EarthElement },
    "Conjured Fire Elemental": { "Fire Element": MonsterEnrichers.ConjuredElemental.FireElement },
    "Conjured Water Elemental": { "Water Element": MonsterEnrichers.ConjuredElemental.WaterElement },
    "Conjured Fey": { "Psychic Attack": MonsterEnrichers.ConjuredFey.PsychicAttack },
    "Construct Spirit (Stone)": {
      "Stony Lethargy (Stone Only)": MonsterEnrichers.SummonConstruct.StonyLethargy,
    },
    "Giant Insect": {
      "Poison Jab": MonsterEnrichers.GiantInsect.PoisonJab,
      "Venomous Spew (Centipede Only)": MonsterEnrichers.GiantInsect.VenomousSpew,
    },
    "Clay Golem": {
      "Haste (Recharge 5–6)": MonsterEnrichers.ClayGolem.Haste,
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
  };

}
