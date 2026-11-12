// Maximum Damage: roll the maximum of some damage (Overchannel, and other features that deal maximum
// damage instead of rolling). The dialog builds a list of damage entries, added from this actor's recent
// chat cards (rolled damage, or the damage a cast or attack card would roll), from a typed formula, or
// from dice, a bonus and a damage type. Each entry is maximised and they go to chat together as one
// damage card, one roll per entry, that can be applied.
//
// scope.parameters (JSON, every key optional):
//   title: the damage card's title. Default: the name of the activity that ran this macro.
//   description: the card's flavor text, followed by the maximised damage. Default: "<item>: <title>".
//   sources: which recent chat cards to offer, by the item they came from, as a list of
//     { type, subtypes? }: type is the item type ("spell", "weapon", "equipment", "feat", ...) or
//     "any", and subtypes, when given, the item's system.type.value ("martialM", "natural", "class").
//     Default: [{ "type": "spell" }].
//   activityTypes: when given, only cards from these activity types ("attack", "damage", "save", ...).
//   damageTypes: when given, only damage of these types is offered, and the formula and dice rows
//     offer only these types.
//   maxSpellLevel: when given, only spells cast at this level or lower.
//   thisItem: only cards made with the item that ran the macro (a weapon that maximises its own damage);
//     sources is ignored. Otherwise that item's own cards are left out.

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

if (!isSimpleDDBMacro) {
  console.error("Not a DDB Simple Macro call, exiting");
  return;
}

const RECENT_MESSAGES = 30;
const DICE = [4, 6, 8, 10, 12];

function readParameters() {
  if (!scope.parameters) return {};
  if (typeof scope.parameters === "object") return scope.parameters;
  try {
    return JSON.parse(scope.parameters);
  } catch {
    ui.notifications.error(`${item.name}: the Maximum Damage macro parameters are not valid JSON.`);
    return null;
  }
}

const parameters = readParameters();
if (!parameters) return;

const invokingActivity = scope.activityId ? item.system.activities.get(scope.activityId) : null;
const title = parameters.title ?? invokingActivity?.name ?? "Maximum Damage";
const sources = Array.isArray(parameters.sources) && parameters.sources.length > 0
  ? parameters.sources
  : [{ type: "spell" }];
const activityTypes = Array.isArray(parameters.activityTypes) && parameters.activityTypes.length > 0
  ? parameters.activityTypes
  : null;
const damageTypes = Array.isArray(parameters.damageTypes) && parameters.damageTypes.length > 0
  ? parameters.damageTypes
  : null;
const maxSpellLevel = Number.isFinite(parameters.maxSpellLevel) ? parameters.maxSpellLevel : null;

function damageTypeOptions() {
  return Object.entries(CONFIG.DND5E.damageTypes)
    .filter(([value]) => !damageTypes || damageTypes.includes(value))
    .map(([value, config]) => ({ value, label: game.i18n.localize(config.label ?? value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function damageTypeLabel(type) {
  const config = CONFIG.DND5E.damageTypes[type] ?? CONFIG.DND5E.healingTypes?.[type];
  return config ? game.i18n.localize(config.label).toLowerCase() : (type ?? "");
}

function describeParts(parts) {
  return parts.map((part) => `${part.formula} ${damageTypeLabel(part.type)}`.trim()).join(", ");
}

function sourceMatches(sourceItem, activity) {
  if (activityTypes && !activityTypes.includes(activity?.type)) return false;
  if (parameters.thisItem) return sourceItem.id === item.id && sourceItem.parent === item.parent;
  if (sourceItem.id === item.id) return false;
  return sources.some((source) => (source.type === "any" || source.type === sourceItem.type)
    && (!Array.isArray(source.subtypes) || source.subtypes.includes(sourceItem.system.type?.value)));
}

// dnd5e 6 keeps the scaling on the message system data, dnd5e 5 in a flag. A damage roll card on
// dnd5e 5 has none, so it comes from the cast card the roll was made from.
function messageScaling(message) {
  const own = message.system?.scaling ?? message.getFlag("dnd5e", "scaling");
  if (own !== undefined && own !== null) return Number(own) || 0;
  const originId = message.system?.origin ?? message.getFlag("dnd5e", "originatingMessage");
  const origin = originId ? game.messages.get(originId) : null;
  if (!origin || origin === message) return 0;
  return Number(origin.system?.scaling ?? origin.getFlag("dnd5e", "scaling") ?? 0) || 0;
}

function messageActivity(message) {
  try {
    return message.getAssociatedActivity?.() ?? null;
  } catch {
    return null;
  }
}

// rolled damage: the formula already holds the slot scaling, critical dice and the chosen type
function partsFromDamageRolls(message) {
  return message.rolls
    .filter((roll) => roll instanceof CONFIG.Dice.DamageRoll)
    .map((roll) => ({ formula: roll.formula, data: {}, type: roll.options?.type }));
}

// a cast or attack card that has not rolled damage yet: build the damage the activity would roll at
// that level, from a scaled clone as dnd5e's own chat card buttons do. The roll data is resolved into
// the formula so it reads, and matches the card's rolled damage, as the roll would ("1 - 1", not
// "1 + @abilities.str.mod").
function partsFromActivity(activity, scaling) {
  if (!activity?.damage?.parts?.length) return [];
  const clone = activity.item.clone({ "flags.dnd5e.scaling": scaling }, { keepId: true });
  const scaled = clone.system.activities.get(activity.id);
  const config = scaled?.getDamageConfig?.({}) ?? { rolls: [] };
  return config.rolls
    .filter((roll) => roll.parts?.length)
    .map((roll) => ({
      formula: new Roll(roll.parts.join(" + "), roll.data ?? {}).formula,
      data: {},
      type: roll.options?.type,
    }));
}

function recentDamage() {
  const entries = [];
  const seen = new Set();
  const messages = game.messages.contents.slice(-RECENT_MESSAGES).reverse();
  for (const message of messages) {
    if (message.speaker?.actor !== actor.id) continue;
    const activity = messageActivity(message);
    const sourceItem = activity?.item ?? message.getAssociatedItem?.();
    if (!sourceItem || !sourceMatches(sourceItem, activity)) continue;

    const isSpell = sourceItem.type === "spell";
    const scaling = isSpell ? messageScaling(message) : 0;
    const level = isSpell ? (sourceItem.system.level ?? 0) + scaling : 0;
    if (maxSpellLevel !== null && isSpell && level > maxSpellLevel) continue;

    const rolled = partsFromDamageRolls(message);
    const parts = (rolled.length > 0 ? rolled : partsFromActivity(activity, scaling))
      .filter((part) => !damageTypes || damageTypes.includes(part.type));
    if (parts.length === 0) continue;

    const source = `${sourceItem.name}${level > 0 ? `, level ${level}` : ""}`;
    // newest first, so a cast or attack card whose damage was then rolled is dropped in favour of the roll
    const key = `${source}: ${describeParts(parts)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = `${key}${rolled.length > 0 ? " (rolled)" : ""}`;
    entries.push({ label, parts, source });
  }
  return entries;
}

function escapeHTML(text) {
  return `${text ?? ""}`.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function typeSelectHTML(name) {
  const options = damageTypeOptions()
    .map((option) => `<option value="${option.value}">${escapeHTML(option.label)}</option>`)
    .join("");
  return `<select name="${name}" style="flex: 1 1 8em;">${options}</select>`;
}

function dialogHTML(recent) {
  const recentOptions = recent.length > 0
    ? recent.map((entry, index) => `<option value="${index}">${escapeHTML(entry.label)}</option>`).join("")
    : `<option value="">No recent damage</option>`;
  const dieOptions = DICE.map((faces) => `<option value="${faces}" ${faces === 6 ? "selected" : ""}>d${faces}</option>`).join("");
  const row = "display: flex; gap: 0.25em; align-items: center; margin-bottom: 0.5em;";
  return `
    <div class="ddb-maximum-damage">
      <label>Recent damage</label>
      <div style="${row}">
        <select name="recent" style="flex: 1 1 auto;" ${recent.length === 0 ? "disabled" : ""}>${recentOptions}</select>
        <button type="button" data-maximum-damage-add="recent" style="flex: 0 0 auto; width: auto;" ${recent.length === 0 ? "disabled" : ""}>Add</button>
      </div>
      <label>Formula</label>
      <div style="${row}">
        <input type="text" name="formula" placeholder="8d6 + @abilities.int.mod" style="flex: 2 1 10em;"/>
        ${typeSelectHTML("formulaType")}
        <button type="button" data-maximum-damage-add="formula" style="flex: 0 0 auto; width: auto;">Add</button>
      </div>
      <label>Dice</label>
      <div style="${row}">
        <input type="number" name="number" min="1" step="1" value="1" style="flex: 0 0 4em;"/>
        <select name="faces" style="flex: 0 0 5em;">${dieOptions}</select>
        <span>+</span>
        <input type="number" name="bonus" step="1" value="0" style="flex: 0 0 4em;"/>
        ${typeSelectHTML("diceType")}
        <button type="button" data-maximum-damage-add="dice" style="flex: 0 0 auto; width: auto;">Add</button>
      </div>
      <label>Damage to maximise</label>
      <ul class="maximum-damage-entries" style="list-style: none; margin: 0.25em 0; padding: 0;"></ul>
    </div>`;
}

// the dialog keeps the entries in this list and redraws it after each add or remove
async function askForDamage(recent) {
  const entries = [];

  const renderEntries = (root) => {
    const list = root.querySelector(".maximum-damage-entries");
    if (entries.length === 0) {
      list.innerHTML = `<li><em>Nothing added yet.</em></li>`;
      return;
    }
    list.innerHTML = entries.map((entry, index) => `
      <li style="display: flex; gap: 0.5em; align-items: center;">
        <span style="flex: 1 1 auto;">${escapeHTML(entry.label)}</span>
        <a data-maximum-damage-remove="${index}" title="Remove"><i class="fa-solid fa-trash"></i></a>
      </li>`).join("");
    for (const link of list.querySelectorAll("[data-maximum-damage-remove]")) {
      link.addEventListener("click", () => {
        entries.splice(Number(link.dataset.maximumDamageRemove), 1);
        renderEntries(root);
      });
    }
  };

  const addEntry = (root, source) => {
    const value = (name) => root.querySelector(`[name="${name}"]`)?.value ?? "";
    if (source === "recent") {
      const picked = recent[Number(value("recent"))];
      if (!picked) return;
      for (const part of picked.parts) {
        entries.push({ ...part, label: `${picked.source}: ${describeParts([part])}`, source: picked.source });
      }
    } else if (source === "formula") {
      const formula = value("formula").trim();
      if (formula === "") return;
      if (!Roll.validate(formula)) {
        ui.notifications.error(`${title}: "${formula}" is not a valid roll formula.`);
        return;
      }
      const part = { formula, data: actor.getRollData(), type: value("formulaType") };
      entries.push({ ...part, label: describeParts([part]) });
      root.querySelector(`[name="formula"]`).value = "";
    } else if (source === "dice") {
      const number = Number.parseInt(value("number"));
      const bonus = Number.parseInt(value("bonus")) || 0;
      if (!Number.isFinite(number) || number < 1) return;
      const formula = `${number}d${value("faces")}${bonus > 0 ? ` + ${bonus}` : bonus < 0 ? ` - ${Math.abs(bonus)}` : ""}`;
      const part = { formula, data: {}, type: value("diceType") };
      entries.push({ ...part, label: describeParts([part]) });
    }
    renderEntries(root);
  };

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${item.name}: ${title}` },
    position: { width: 520 },
    content: dialogHTML(recent),
    rejectClose: false,
    render: (_event, dialog) => {
      const root = dialog.element ?? dialog;
      for (const button of root.querySelectorAll("[data-maximum-damage-add]")) {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          addEntry(root, button.dataset.maximumDamageAdd);
        });
      }
      renderEntries(root);
    },
    buttons: [
      { action: "roll", label: "Roll Maximum Damage", icon: "fa-solid fa-dice", default: true, callback: () => "roll" },
      { action: "cancel", label: "Cancel", callback: () => "cancel" },
    ],
  });
  if (result !== "roll") return null;
  return entries;
}

const recent = recentDamage();
const entries = await askForDamage(recent);
if (!entries) return;
if (entries.length === 0) {
  ui.notifications.warn(`${title}: add at least one damage entry before rolling.`);
  return;
}

const maximised = [];
for (const entry of entries) {
  if (!Roll.validate(entry.formula)) {
    ui.notifications.error(`${title}: "${entry.formula}" is not a valid roll formula.`);
    return;
  }
  const roll = await new Roll(entry.formula, entry.data).evaluate({ maximize: true });
  maximised.push({ total: roll.total, formula: roll.formula, type: entry.type });
}

const usedSources = [...new Set(entries.map((entry) => entry.source).filter((source) => source))];
const summary = `${usedSources.length > 0 ? `${usedSources.join(", ")}: ` : ""}${describeParts(maximised)}`;
const flavor = `${parameters.description ?? `${item.name}: ${title}`} (${summary})`;

// Roll the totals through a damage activity on a clone of the item, so the card is dnd5e's own damage
// message, with its apply controls, on every dnd5e version. The card is titled from the activity, so
// it takes the title. Only a damage activity will do (an attack activity adds the weapon's base damage
// and ability modifier to whatever parts it is given), so an item without one gets a stand-in on the
// clone; the real item is never changed.
const damageActivity = item.system.activities.find((activity) => activity.type === "damage");
const activityId = damageActivity?.id ?? foundry.utils.randomID();
const parts = maximised.map((part) => ({
  custom: { enabled: true, formula: `${part.total}` },
  types: part.type ? [part.type] : [],
}));
const clone = item.clone({
  [`system.activities.${activityId}`]: damageActivity
    ? { name: title, damage: { parts } }
    : { _id: activityId, type: "damage", name: title, damage: { parts } },
}, { keepId: true });
await clone.system.activities.get(activityId).rollDamage({}, { configure: false }, { data: { flavor } });
