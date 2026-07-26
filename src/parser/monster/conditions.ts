import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

interface AdjustmentsConfigCondition {
  id: number;
  name: string;
  type: number;
  slug: string;
}

type TAdjustmentsConfigResult = IDDBConfigDamageAdjustment[] | AdjustmentsConfigCondition[] | null;

DDBMonster.prototype.getAdjustmentsConfig = function getAdjustmentsConfig(this: DDBMonster, type: string): TAdjustmentsConfigResult {
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

DDBMonster.prototype.getDamageAdjustments = function getDamageAdjustments(this: DDBMonster, type: string): I5eDamageTraitSet {
  const config = this.getAdjustmentsConfig(type);
  const values = new Set<string>();
  const custom: string[] = [];
  const bypass = new Set<string>();
  const midiQolInstalled = game.modules.get("midi-qol")?.active;

  if (!config) {
    logger.warn(`getDamageAdjustments: unknown adjustment type ${type} for ${this.source.name}`);
    return { value: [], bypasses: [], custom: "" };
  }

  this.source.damageAdjustments.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    if (!adjustment) return;
    const ddbValue = DICTIONARY.actor.damageAdjustments.find((d) => d.id === adjustment.id);
    if (ddbValue?.foundryValues) {
      const foundryValues = ddbValue.foundryValues.value ?? [];
      const foundryBypasses = ddbValue.foundryValues.bypasses ?? [];
      if (foundryValues.length > 0) foundryValues.forEach(values.add, values);
      if (foundryBypasses.length > 0) foundryBypasses.forEach(bypass.add, bypass);
      if (midiQolInstalled && ddbValue.midiValues) {
        for (const value of ddbValue.midiValues) {
          values.add(value);
        }
      }
    } else {
      custom.push(adjustment.name);
    }

    if (midiQolInstalled) {
      if (adjustment.slug.toLowerCase().includes("bludgeoning-piercing-and-slashing-from-nonmagical")) {
        values.add("bludgeoning");
        values.add("piercing");
        values.add("slashing");
      }
      if (adjustment.slug.toLowerCase().includes("silvered")) values.add("silver");
      if (adjustment.slug.toLowerCase().includes("adamantine")) values.add("adamant");
      // if (adjustment.slug.toLowerCase().includes("magic")) values.add("magic");
      // if (adjustment.slug.toLowerCase().includes("nonmagical")) values.add("non-magic");
    }
  });

  const adjustments: I5eDamageTraitSet = {
    value: Array.from(values),
    bypasses: Array.from(bypass),
    custom: custom.join("; "),
  };

  return adjustments;
};

DDBMonster.prototype._generateDamageImmunities = function _generateDamageImmunities(this: DDBMonster) {
  const traits = this.npc.system.traits;
  if (!traits) {
    logger.warn(`_generateDamageImmunities: missing npc traits for ${this.source.name}`);
    return;
  }
  traits.di = this.getDamageAdjustments("immunities");
};

DDBMonster.prototype._generateDamageResistances = function _generateDamageResistances(this: DDBMonster) {
  const traits = this.npc.system.traits;
  if (!traits) {
    logger.warn(`_generateDamageResistances: missing npc traits for ${this.source.name}`);
    return;
  }
  traits.dr = this.getDamageAdjustments("resistances");
};

DDBMonster.prototype._generateDamageVulnerabilities = function _generateDamageVulnerabilities(this: DDBMonster) {
  const traits = this.npc.system.traits;
  if (!traits) {
    logger.warn(`_generateDamageVulnerabilities: missing npc traits for ${this.source.name}`);
    return;
  }
  traits.dv = this.getDamageAdjustments("vulnerabilities");
};

DDBMonster.prototype._generateConditionImmunities = function _generateConditionImmunities(this: DDBMonster) {
  const config = this.getAdjustmentsConfig("conditions");
  const traits = this.npc.system.traits;

  if (!config || !traits) {
    logger.warn(`_generateConditionImmunities: missing conditions config or npc traits for ${this.source.name}`);
    return;
  }

  const values = new Set<string>();
  const custom: string[] = [];

  this.source.conditionImmunities.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    if (!adjustment) {
      logger.warn(`_generateConditionImmunities: unknown condition immunity id ${adj} for ${this.source.name}`);
      return;
    }
    const valueAdjustment = DICTIONARY.conditions.find((condition) => condition.label.toLowerCase() == adjustment.name.toLowerCase());
    if (valueAdjustment) {
      values.add(valueAdjustment.foundry);
    } else {
      custom.push(adjustment.name);
    }
  });

  traits.ci = {
    value: Array.from(values),
    custom: custom.join("; "),
  };

};
