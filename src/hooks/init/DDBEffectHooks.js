import { logger, DDBMacros } from "../../lib/_module.mjs";

// eslint-disable-next-line no-unused-vars, complexity
function daeLightStubEffects(actor, change, _current, _delta, _changes) {

  if (typeof change?.key !== "string") return true;

  switch (change.key) {
    case "system.attributes.movement.walk":
    case "system.attributes.movement.fly":
    case "system.attributes.movement.climb":
    case "system.attributes.movement.burrow":
    case "system.attributes.movement.swim": {
      const rollData = actor.getRollData();
      const formula = Roll.replaceFormulaData(change.value, rollData, { missing: 0, warn: false });
      const evaluated = Roll.safeEval(formula);
      foundry.utils.setProperty(actor, change.key, evaluated);
      return true;
    }
    case "system.attributes.movement.hover":
      foundry.utils.setProperty(actor, change.key, foundry.utils.hasProperty(change, "value"));
      return true;
    case "system.traits.di.all":
    case "system.traits.dr.all":
    case "system.traits.dv.all": {
      const key = change.key.replace(".all", ".value");
      foundry.utils.setProperty(actor, key, new Set(Object.keys(CONFIG.DND5E.damageTypes)));
      return true;
    }
    case "system.traits.languages.all":
      foundry.utils.setProperty(actor, "system.traits.languages.value", ["standard:*", "exotic:*", "ddb:*"]);
      return true;
    case "system.attributes.movement.all": {
      const movement = actor.system.attributes.movement;
      let op = "";
      if (typeof change.value === "string") {
        change.value = change.value.trim();
        if (["+", "-", "/", "*"].includes(change.value[0])) {
          op = change.value[0];
        }
      }
      for (let key of Object.keys(movement)) {
        if (["units", "hover"].includes(key)) continue;
        let valueString = change.value;
        if (op !== "") {
          if (!movement[key]) continue;
          valueString = `${movement[key]} ${change.value}`;
        }
        try {
          const roll = new Roll(valueString, actor.getRollData());
          let result;
          if (!roll.isDeterministic) {
            logger.error(`Error evaluating system.attributes.movement.all = ${valueString}. Roll is not deterministic for ${actor.name} ${actor.uuid} dice terms ignored`);
          }
          // eslint-disable-next-line no-sync
          result = roll.evaluateSync({ strict: false }).total;
          movement[key] = Math.floor(Math.max(0, result) + 0.5);
        } catch (err) {
          logger.warn(`Error evaluating custom movement.all = ${valueString}`, key, err);
        }
      };
      return true;
    }
    // no default
  }
  return true;
}


export default class DDBEffectHooks {

  // eslint-disable-next-line no-unused-vars
  static ddbMacro(actor, change, ..._params) {
    const scope = { actor, token: null };
    const data = JSON.parse(change.value);

    DDBMacros.executeDDBMacro(data.type, data.name, scope);
  }

  // eslint-disable-next-line no-unused-vars
  static processCustomApplyEffectHooks(_actor, change, _current, _delta, _changes) {
    // eslint-disable-next-line no-useless-return
    if (change.mode !== CONST.ACTIVE_EFFECT_MODES.CUSTOM) return;

  }

  static loadHooks() {
    // special effect functions
    Hooks.on("applyActiveEffect", DDBEffectHooks.processCustomApplyEffectHooks);
    if (!game.modules.get("dae")?.active) {
      Hooks.on("applyActiveEffect", daeLightStubEffects);
    }
  }

}
