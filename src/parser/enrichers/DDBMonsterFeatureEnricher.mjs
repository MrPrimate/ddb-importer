import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { MonsterEnrichers } from "./_module.mjs";

export default class DDDMonsterFeatureEnricher extends DDBEnricherMixin {

  _loadEnricherData(name) {
    if (!this.ENRICHERS?.[this.monsterName]?.[name]) return null;
    return new this.ENRICHERS[this.monsterName][name]({
      ddbEnricher: this,
    });
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
  }

  load({ ddbParser, document, name = null, monster, is2014 = null } = {}) {
    this.monster = monster;
    this.monsterName = this.monster.name;
    super.load({ ddbParser, document, name, is2014 });
  }


  NAME_HINTS_2014 = {};

  NAME_HINTS = {};

  ENRICHERS = {
    "Flying Snake": { "Bite": MonsterEnrichers.FlyingSnake.Bite },
    "Purple Worm": { "Bite": MonsterEnrichers.PurpleWorm.Bite },
  };

}
