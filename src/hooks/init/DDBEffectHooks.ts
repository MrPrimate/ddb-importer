import { logger, DDBMacros } from "../../lib/_module";


function daeStubEffects(actor: TImporterActor, change: IActiveEffectChangeData, _current: unknown, _delta: unknown, _changes: unknown) {

  if (typeof change?.key !== "string") return true;

  switch (change.key) {
    case "system.attributes.movement.speeds.walk":
    case "system.attributes.movement.speeds.fly":
    case "system.attributes.movement.speeds.climb":
    case "system.attributes.movement.speeds.burrow":
    case "system.attributes.movement.speeds.swim":
    case "system.attributes.movement.walk":
    case "system.attributes.movement.fly":
    case "system.attributes.movement.climb":
    case "system.attributes.movement.burrow":
    case "system.attributes.movement.swim": {
      if (change.value == null) return true;
      const rollData = actor.getRollData();
      const formula = Roll.replaceFormulaData(String(change.value), rollData, { missing: "0", warn: false });
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
    case "system.traits.languages.communication.telepathy.value": {
      if (change.value == null) return true;
      const rollData = actor.getRollData();
      const formula = Roll.replaceFormulaData(String(change.value), rollData, { missing: "0", warn: false });
      const evaluated = Roll.safeEval(formula);
      foundry.utils.setProperty(actor, change.key, evaluated);
      return true;
    }
    // legacy: actors imported before movement.bonus/multiplier still carry movement.all changes
    case "system.attributes.movement.all": {
      if (change.value == null) return true;
      if (!("attributes" in actor.system)) break;
      // group actors carry travel rather than movement under attributes
      const movement = (actor.system as unknown as { attributes?: { movement?: I5eMovement & { multiplier?: number } } })
        .attributes?.movement;
      if (!movement?.speeds) break;
      let op = "";
      if (typeof change.value === "string") {
        change.value = change.value.trim();
        if (["+", "-", "/", "*"].includes(change.value[0])) {
          op = change.value[0];
        }
      }
      const evaluate = (valueString: string): number | null => {
        try {
          const roll = new Roll(valueString, actor.getRollData());
          if (!roll.isDeterministic) {
            logger.error(`Error evaluating system.attributes.movement.all = ${valueString}. Roll is not deterministic for ${actor.name} ${actor.uuid} dice terms ignored`);
          }
          return roll.evaluateSync({ strict: false }).total ?? null;
        } catch (err) {
          logger.warn(`Error evaluating custom movement.all = ${valueString}`, err);
          return null;
        }
      };
      // scaling goes through the multiplier, which dnd5e applies to each speed after the flat bonus
      if (op === "*" || op === "/") {
        const result = evaluate(`${movement.multiplier ?? 1} ${change.value}`);
        if (result !== null) movement.multiplier = Math.max(0, result);
        return true;
      }
      for (const key of Object.keys(movement.speeds) as I5eMovementType[]) {
        let valueString = String(change.value);
        if (op !== "") {
          if (!movement.speeds[key]) continue;
          valueString = `${movement.speeds[key]} ${change.value}`;
        }
        const result = evaluate(valueString);
        if (result !== null) movement.speeds[key] = String(Math.floor(Math.max(0, result) + 0.5));
      }
      return true;
    }
    // no default
  }
  return true;
}


export default class DDBEffectHooks {


  static ddbMacro(actor: Actor.Implementation, change: Record<string, any>, ..._params: unknown[]) {
    const scope = { actor, token: null as Token.Implementation | null };
    const data = JSON.parse(change.value);

    DDBMacros.executeDDBMacro(data.type, data.name, scope);
  }


  static processCustomApplyEffectHooks(_actor: Actor.Implementation, change: Record<string, any>, _current: unknown, _delta: unknown, _changes: unknown) {

    if (change.type !== "custom") return;

  }

  static loadHooks() {
    // special effect functions
    Hooks.on<"applyActiveEffect">("applyActiveEffect", DDBEffectHooks.processCustomApplyEffectHooks);
    if (!game.modules.get("dae")?.active) {
      // the hook types the actor as Actor5e with optional flags; TImporterActor requires flags
      // but daeStubEffects never reads them, so the cast is safe
      Hooks.on<"applyActiveEffect">(
        "applyActiveEffect",
        daeStubEffects as unknown as (
          actor: Actor.Implementation,
          change: IActiveEffectChangeData,
          current: unknown,
          delta: unknown,
          changes: unknown,
        ) => boolean,
      );
    }
  }

}
