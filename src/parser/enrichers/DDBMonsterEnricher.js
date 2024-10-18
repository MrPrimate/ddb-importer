import DDBMonsterFeatureActivity from "../monster/features/DDBMonsterFeatureActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDMonsterEnricher extends DDBBaseEnricher {

  _prepare() {
    this.hintName = (this.is2014 ? this.DND_2014.NAME_HINTS[this.monsterName]?.[this.name] : null)
      ?? this.NAME_HINTS[this.monsterName]?.[this.name] ?? this.name;
    this.activity = (this.is2014 ? this.DND_2014.ACTIVITY_HINTS[this.monsterName]?.[this.hintName] : null)
      ?? this.ACTIVITY_HINTS[this.monsterName]?.[this.hintName];
    this.effect = (this.is2014 ? this.DND_2014.EFFECT_HINTS[this.monsterName]?.[this.hintName] : null)
      ?? this.EFFECT_HINTS[this.monsterName]?.[this.hintName];
    this.override = (this.is2014 ? this.DND_2014.DOCUMENT_OVERRIDES[this.monsterName]?.[this.hintName] : null)
      ?? this.DOCUMENT_OVERRIDES[this.monsterName]?.[this.hintName];
    this.additionalActivities = (this.is2014 ? this.DND_2014.ADDITIONAL_ACTIVITIES[this.monsterName]?.[this.name] : null)
      ?? this.ADDITIONAL_ACTIVITIES[this.monsterName]?.[this.hintName];
    this.documentStub = (this.is2014 ? this.DND_2014.DOCUMENT_STUB[this.monsterName]?.[this.hintName] : null)
      ?? this.DOCUMENT_STUB[this.monsterName]?.[this.hintName];
  }

  constructor() {
    super();
    this.additionalActivityClass = DDBMonsterFeatureActivity;
  }

  load({ document, name = null, monster, is2014 = null } = {}) {
    super.load({ document, name });
    this.monster = monster;
    this.monsterName = this.monster.name;
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.is2014 = is2014 ?? this.document.flags?.ddbimporter?.is2014 ?? false;
    this.is2024 = !this.is2014;
    this._prepare();
    this.additionalActivityClass = DDBMonsterFeatureActivity;
    this.effectType = "feat";
    this.enricherType = "monster";
  }

  DND_2014 = {
    NAME_HINTS: {},
    ACTIVITY_HINTS: {},
    ADDITIONAL_ACTIVITIES: {},
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {},
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {};

  ACTIVITY_HINTS = {

  };

  DOCUMENT_OVERRIDES = {

  };

  EFFECT_HINTS = {

  };

  DOCUMENT_STUB = {

  };
}
