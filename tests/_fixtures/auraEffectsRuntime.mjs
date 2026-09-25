import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// Optional external integration. Run against a local checkout without vendoring its source.
export const queriesPath = path.join(process.env.AURA_EFFECTS_ROOT ?? "/home/jack/repos/github/Aura-Effects", "scripts/queries.mjs");
export const runtimeAvailable = fs.existsSync(queriesPath);
const get = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
const set = (object, key, value) => {
  const parts = key.split(".");
  const last = parts.pop();
  for (const part of parts) object = object[part] ??= {};
  object[last] = value;
};
const clone = (value) => JSON.parse(JSON.stringify(value));

/** Foundry document/roll boundaries only; winner selection runs the external queries.mjs verbatim. */
export function createAuraRuntime({ preferLatest = false, dae = false } = {}) {
  const documents = new Map();
  class Roll {
    static replaceFormulaData(formula, data) {
      return formula.replace(/@([\w.]+)/g, (_match, key) => get(data, key) ?? "0");
    }
    constructor(formula, data) {
      this.formula = Roll.replaceFormulaData(formula, data);
    }
    evaluateSync() {
      // These fixtures rank numbers, never dice. Reject anything beyond their arithmetic grammar.
      if (!(/^[\d\s+(),.\-max]+$/).test(this.formula)) throw new Error(`Unsupported fixture formula: ${this.formula}`);
      this.total = new Function("max", `return (${this.formula});`)(Math.max);
      return this;
    }
  }
  const wrap = (data) => ({
    ...data, id: data._id,
    getFlag(namespace, key) {
      return this.flags?.[namespace]?.[key];
    },
  });
  const context = vm.createContext({
    Roll,
    foundry: {
      utils: {
        Semaphore: class {
          add(fn) {
            return fn();
          }
        },
        getProperty: get, setProperty: set,
        mergeObject: (target, updates) => {
          for (const [key, value] of Object.entries(updates)) set(target, key, value);
          return target;
        },
      },
      documents: {
        async modifyBatch(operations) {
          for (const op of operations) {
            if (op.action === "delete") op.parent.effects = op.parent.effects.filter((e) => !op.ids.includes(e.id));
            else op.parent.effects.push(...op.data.map((e, i) => wrap({ ...e, _id: `${op.parent.uuid}-${i}-${op.parent.effects.length}` })));
          }
        },
      },
    },
    game: {
      settings: { get: (_module, key) => key === "preferLatest" && preferLatest },
      modules: { get: (key) => ({ active: key === "dae" && dae }) },
    },
    fromUuidSync: (uuid) => documents.get(uuid),
    CONST: { ACTIVE_EFFECT_SHOW_ICON: { NEVER: 0 } },
  });
  const source = fs.readFileSync(queriesPath, "utf8").replace(/export\s*\{[^}]*\};?\s*$/, "");
  vm.runInContext(`${source}\nglobalThis.apply = applyAuraEffects;`, context, { filename: queriesPath });
  return {
    actor(uuid = "Actor.recipient", effects = []) {
      const actor = { uuid, effects: effects.map(wrap) };
      documents.set(uuid, actor);
      return actor;
    },
    source(data, rollData, uuid = `Actor.source.Item.aura.ActiveEffect.${documents.size}`) {
      const effect = wrap(clone(data));
      Object.assign(effect, { uuid, parent: { getRollData: () => rollData }, actor: {}, toObject: () => clone(data) });
      documents.set(uuid, effect);
      return effect;
    },
    apply(actor, sources) {
      return context.apply({ [actor.uuid]: sources.map((e) => e.uuid) });
    },
    evaluate(formula, data) {
      return new Roll(formula, data).evaluateSync().total;
    },
  };
}

// Diagnostic only: report the upstream batch defect without asserting it as importer behavior.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const flags of [{}, { auraeffects: {} }]) {
    const runtime = createAuraRuntime();
    const target = runtime.actor();
    const data = {
      name: "Aura of Protection", flags,
      system: { canStack: false, bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Protection", evaluatePreApply: true, changes: [] },
    };
    const sources = [3, 5].map((mod) => runtime.source(data, { abilities: { cha: { mod } } }));
    try {
      await runtime.apply(target, sources);
      process.stdout.write(`${JSON.stringify({ sourceFlags: flags, expected: [5], actual: target.effects.map((e) => e.flags.auraeffects.bestValue) })}\n`);
    } catch (error) {
      process.stdout.write(`${JSON.stringify({ sourceFlags: flags, expected: [5], error: error.message })}\n`);
    }
  }
}
