import { logger, DDBMacros } from "../../lib/_module";


function daeStubEffects(actor, change, _current, _delta, _changes) {

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
    case "system.traits.languages.communication.telepathy.value": {
      const rollData = actor.getRollData();
      const formula = Roll.replaceFormulaData(change.value, rollData, { missing: 0, warn: false });
      const evaluated = Roll.safeEval(formula);
      foundry.utils.setProperty(actor, change.key, evaluated);
      return true;
    }
    case "system.attributes.movement.all": {
      const movement = actor.system.attributes.movement;
      let op = "";
      if (typeof change.value === "string") {
        change.value = change.value.trim();
        if (["+", "-", "/", "*"].includes(change.value[0])) {
          op = change.value[0];
        }
      }
      for (const key of Object.keys(movement)) {
        if (["units", "hover", "ignoredDifficultTerrain", "special"].includes(key)) continue;
        // dnd5e adds the flat bonus to each speed before halving, so it only scales with the
        // speeds, is never set or offset itself, and may stay negative
        const isBonus = (key as string) === "bonus";
        if (isBonus && op !== "*" && op !== "/") continue;
        let valueString = change.value;
        if (op !== "") {
          if (!movement[key]) continue;
          valueString = `${movement[key]} ${change.value}`;
        }
        try {
          const roll = new Roll(valueString, actor.getRollData());
          if (!roll.isDeterministic) {
            logger.error(`Error evaluating system.attributes.movement.all = ${valueString}. Roll is not deterministic for ${actor.name} ${actor.uuid} dice terms ignored`);
          }

          const result = roll.evaluateSync({ strict: false }).total;
          movement[key] = String(Math.floor((isBonus ? result : Math.max(0, result)) + 0.5));
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


/** Seconds per dnd5e scalar time period, for an activity duration copied onto an enchantment. */
const ACTIVITY_DURATION_SECONDS: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  month: 2592000,
  year: 31536000,
};

/**
 * Give an importer enchantment the duration of the activity applying it when it has no counted
 * duration of its own.
 *
 * dnd5e 6.0 does this for every applied effect (`getAppliedEffectChanges`), and the self-enchant
 * toggles ported from main rely on it; 5.x applies the profile as built, so a toggle whose text
 * gives no "for N minutes" would never end. times-up stamps the start of applied enchantments.
 */
export function inheritActivityDuration(
  _item: unknown,
  enchantmentData: {
    flags?: { ddbimporter?: unknown };
    duration?: { seconds?: number | null; rounds?: number | null; turns?: number | null };
  },
  options?: { activity?: { duration?: { value?: unknown; units?: string } } | null },
) {
  if (!enchantmentData?.flags?.ddbimporter) return true;
  const duration = enchantmentData.duration ?? {};
  const counted = [duration.seconds, duration.rounds, duration.turns].some((value) => Number.isFinite(value) && (value as number) > 0);
  if (counted) return true;
  const source = options?.activity?.duration;
  const value = Number(source?.value);
  if (!source?.units || !Number.isFinite(value) || value <= 0) return true;
  // times-up counts rounds only in combat, so a round duration also carries its seconds
  if (source.units === "round") enchantmentData.duration = { ...duration, rounds: value, seconds: value * (CONFIG.time?.roundTime ?? 6) };
  else if (source.units === "turn") enchantmentData.duration = { ...duration, turns: value };
  else if (ACTIVITY_DURATION_SECONDS[source.units]) {
    enchantmentData.duration = { ...duration, seconds: value * ACTIVITY_DURATION_SECONDS[source.units] };
  }
  return true;
}

export default class DDBEffectHooks {


  static ddbMacro(actor, change, ..._params) {
    const scope = { actor, token: null };
    const data = JSON.parse(change.value);

    DDBMacros.executeDDBMacro(data.type, data.name, scope);
  }


  static processCustomApplyEffectHooks(_actor, change, _current, _delta, _changes) {

    if (change.mode !== CONST.ACTIVE_EFFECT_MODES.CUSTOM) return;

  }

  static loadHooks() {
    // special effect functions
    Hooks.on("applyActiveEffect", DDBEffectHooks.processCustomApplyEffectHooks);
    Hooks.on("dnd5e.preApplyEnchantment", inheritActivityDuration);
    if (!game.modules.get("dae")?.active) {
      Hooks.on("applyActiveEffect", daeStubEffects);
    }
  }

}
