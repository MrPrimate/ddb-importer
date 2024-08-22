import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDMonsterEnricher extends DDBBaseEnricher {

  _prepare() {
    this.hintName = this.NAME_HINTS[this.monsterName]?.[this.name] ?? this.name;
    this.activity = this.ACTIVITY_HINTS[this.monsterName]?.[this.hintName];
    this.effect = this.EFFECT_HINTS[this.monsterName]?.[this.hintName];
    this.override = this.DOCUMENT_OVERRIDES[this.monsterName]?.[this.hintName];
  }

  constructor({ document, name = null, monster } = {}) {
    super({ document, name });
    this.monster = monster;
    this.monsterName = this.monster.name;
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this._prepare();
  }


  NAME_HINTS = {};

  ACTIVITY_HINTS = {

  };

  DOCUMENT_OVERRIDES = {

  };

  EFFECT_HINTS = {

  };
}
