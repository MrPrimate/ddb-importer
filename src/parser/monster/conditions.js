import DICTIONARY from "../../dictionary.js";
import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype.getAdjustmentsConfig = function getAdjustmentsConfig(type) {
  const damageAdjustments = CONFIG.DDB.damageAdjustments;

  switch (type) {
    case "resistances":
      return damageAdjustments.filter((adj) => adj.type == 1);
    case "immunities":
      return damageAdjustments.filter((adj) => adj.type == 2);
    case "vulnerabilities":
      return damageAdjustments.filter((adj) => adj.type == 3);
    case "conditions":
      return CONFIG.DDB.conditions.map((condition) => {
        return {
          id: condition.definition.id,
          name: condition.definition.name,
          type: condition.definition.type,
          slug: condition.definition.slug,
        };
      });
    default:
      return null;
  }
};

DDBMonster.prototype.getDamageAdjustments = function getDamageAdjustments(type) {
  const config = this.getAdjustmentsConfig(type);
  let values = new Set();
  let custom = [];
  let bypass = new Set();
  const midiQolInstalled = game.modules.get("midi-qol")?.active;

  this.source.damageAdjustments.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    if (!adjustment) return;
    const ddbValue = DICTIONARY.character.damageAdjustments.find((d) => d.id === adjustment.id);
    if (ddbValue?.foundryValues) {
      if (ddbValue.foundryValues.value.length > 0) ddbValue.foundryValues.value.forEach(values.add, values);
      if (ddbValue.foundryValues.bypass.length > 0) ddbValue.foundryValues.bypass.forEach(bypass.add, bypass);
      if (midiQolInstalled && ddbValue.midiValues) {
        values.add(ddbValue.midiValues);
      }
    } else {
      custom.push(adjustment.name);
    }

    if (midiQolInstalled) {
      if (adjustment.slug.toLowerCase().includes("bludgeoning-piercing-and-slashing-from-nonmagical")) values.add("physical");
      if (adjustment.slug.toLowerCase().includes("silvered")) values.add("silver");
      if (adjustment.slug.toLowerCase().includes("adamantine")) values.add("adamant");
      // if (adjustment.slug.toLowerCase().includes("magic")) values.add("magic");
      // if (adjustment.slug.toLowerCase().includes("nonmagical")) values.add("non-magic");
    }
  });

  const adjustments = {
    value: Array.from(values),
    bypasses: Array.from(bypass),
    custom: custom.join("; "),
  };

  return adjustments;
};

DDBMonster.prototype._generateDamageImmunities = function _generateDamageImmunities() {
  this.npc.system.traits.di = this.getDamageAdjustments("immunities");
};

DDBMonster.prototype._generateDamageResistances = function _generateDamageResistances() {
  this.npc.system.traits.dr = this.getDamageAdjustments("resistances");
};

DDBMonster.prototype._generateDamageVulnerabilities = function _generateDamageVulnerabilities() {
  this.npc.system.traits.dv = this.getDamageAdjustments("vulnerabilities");
};

DDBMonster.prototype._generateConditionImmunities = function _generateConditionImmunities() {
  const config = this.getAdjustmentsConfig("conditions");

  let values = new Set();
  let custom = [];

  this.source.conditionImmunities.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    const valueAdjustment = DICTIONARY.conditions.find((condition) => condition.label.toLowerCase() == adjustment.name.toLowerCase());
    if (adjustment && valueAdjustment) {
      values.add(valueAdjustment.foundry);
    } else if (adjustment) {
      custom.push(adjustment.name);
    }
  });

  this.npc.system.traits.ci = {
    value: Array.from(values),
    custom: custom.join("; "),
  };

};
