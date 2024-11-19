import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { MonsterEnrichers } from "./_module.mjs";

export default class DDDMonsterFeatureEnricher extends DDBEnricherMixin {

  _loadEnricherData() {
    if (!this.ENRICHERS?.[this.monsterHintName]?.[this.hintName]) return null;
    return new this.ENRICHERS[this.monsterHintName][this.hintName]({
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
    const hint = keys.find((key) => this.name.includes(key));
    if (hint) {
      this.monsterHintName = this.MONSTER_NAME_HINT_INCLUDES[hint];
      return;
    }

    this.monsterHintName = this.monsterName;
  }

  _getNameHint() {
    if (this.isCustomAction) return;
    const fullHint = (this.is2014 ? this.NAME_HINTS_2014[this.monsterName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterName]?.[this.name];
    if (fullHint) {
      this.hintName = fullHint;
      return;
    }

    this._getMonsterNameHint();
    const partialHint = (this.is2014 ? this.NAME_HINTS_2014[this.monsterHintName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterHintName]?.[this.name];
    if (partialHint) {
      this.hintName = partialHint;
      return;
    }

    this.hintName = this.name;
  }

  _prepare() {
    this.hintName = (this.is2014 ? this.NAME_HINTS_2014[this.monsterName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterName]?.[this.name]
      ?? this.name;

    this._getEnricherMatchesV2();
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

  load({ ddbParser, document, name = null, monster, is2014 = null } = {}) {
    this.monster = monster;
    this.monsterName = this.monster.name;
    super.load({ ddbParser, document, name, is2014 });
  }

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_2014_INCLUDES = {
    "Dragon": "Dragon",
  };

  // name includes for monsters only match against the name
  MONSTER_NAME_HINT_INCLUDES = {
    "Dragon": "Dragon",
  };

  NAME_HINTS_2014 = {};

  NAME_HINTS = {};

  ENRICHERS = {
    "Flying Snake": { "Bite": MonsterEnrichers.FlyingSnake.Bite },
    "Purple Worm": { "Bite": MonsterEnrichers.PurpleWorm.Bite },
    "Dragon": {
      "Frightful Presence": MonsterEnrichers.Dragon.FrightfulPresence,
    },
  };

}
