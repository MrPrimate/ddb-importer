import DDBEnricherAbstract from "./mixins/DDBEnricherAbstract.mjs";
import { MonsterEnrichers } from "./_module.mjs";

export default class DDDMonsterFeatureEnricher extends DDBEnricherAbstract {

  _loadEnricherData(name) {
    const stub = this.ENRICHERS?.[this.monsterName]?.[name];
    if (stub) {
      const EnricherClass = DDBEnricherAbstract._loadDataStub(stub);
      return new EnricherClass({
        ddbEnricher: this,
      });
    }
    return null;
  }

  _prepare() {
    this.hintName = (this.is2014 ? this.NAME_HINTS_2014[this.monsterName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterName]?.[this.name]
      ?? this.name;

    this._getEnricherMatchesV2();
  }

  constructor({ activityGenerator } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "monster",
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
    "Flying Snake": { "Bite": () => MonsterEnrichers.FlyingSnake.Bite },
  };

}
