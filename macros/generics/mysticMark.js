// Mystic Mark (The Magus Class): store a prepared spell in the mark and release it later.
// scope.parameters: { action: "store" | "release", flag, classIdentifier }
// "store" records a prepared level 1+ class spell cast with an action or Bonus Action and the slot level
// spent on the mark (the Aegis or Enspell activity spends the slot). "release" casts that spell at the
// stored level without a slot, removes the Aegis effects and Enspell weapon enchantments, clears the
// record and ends the Activate self enchantment.

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

if (!isSimpleDDBMacro) {
  console.error("Not a DDB Simple Macro call, exiting");
  return;
}

const parentActor = (typeof actor !== "undefined") ? actor : undefined;
const sourceItem = (typeof item !== "undefined") ? item : undefined;

if (!parentActor || !sourceItem) {
  ui.notifications.error("No parent actor or source item found");
  return;
}

const scopeParameters = JSON.parse(scope.parameters || "{}");
const flag = scopeParameters.flag ?? "mystic-mark";
const classIdentifier = scopeParameters.classIdentifier ?? "magus";
const preparedStates = [
  CONFIG.DND5E.spellPreparationStates.prepared.value,
  CONFIG.DND5E.spellPreparationStates.always.value,
];

function storableSpells() {
  return parentActor.items.filter((spell) => spell.type === "spell"
    && spell.system.level >= 1
    && spell.system.sourceItem === `class:${classIdentifier}`
    && preparedStates.includes(spell.system.prepared)
    && ["action", "bonus"].includes(spell.system.activation?.type),
  ).sort((a, b) => (a.system.level - b.system.level) || a.name.localeCompare(b.name));
}

/** Slot levels the actor has, from the lowest spell level up. */
function slotLevels(minimum) {
  const levels = [];
  for (let level = minimum; level <= 9; level++) {
    if ((parentActor.system.spells?.[`spell${level}`]?.max ?? 0) > 0) levels.push(level);
  }
  return levels;
}

if (scopeParameters.action === "store") {
  const spells = storableSpells();
  if (spells.length === 0) {
    ui.notifications.warn("No prepared spells with a casting time of an action or Bonus Action to store.");
    return;
  }
  const spellOptions = spells
    .map((spell) => `<option value="${spell.id}">${spell.name} (level ${spell.system.level})</option>`)
    .join("");
  const levelOptions = slotLevels(1)
    .map((level) => `<option value="${level}">${level}</option>`)
    .join("");
  const result = await foundry.applications.api.DialogV2.prompt({
    window: { title: `${sourceItem.name}: Store Spell` },
    content: `<div class="form-group"><label>Spell</label><div class="form-fields"><select name="spellId">${spellOptions}</select></div></div>
<div class="form-group"><label>Slot level spent</label><div class="form-fields"><select name="level">${levelOptions}</select></div></div>`,
    ok: {
      label: "Store",
      callback: (_event, button) => ({
        spellId: button.form.elements.spellId.value,
        level: Number(button.form.elements.level.value),
      }),
    },
    rejectClose: false,
  });
  if (!result) return;
  const spell = parentActor.items.get(result.spellId);
  const level = Math.max(result.level, spell?.system.level ?? 1);
  await parentActor.setFlag("world", flag, { spellId: result.spellId, level, name: spell?.name });
  ui.notifications.info(`${spell?.name} stored in ${sourceItem.name} at level ${level}.`);
  return;
}

if (scopeParameters.action === "release") {
  const stored = parentActor.getFlag("world", flag);
  const spell = stored ? parentActor.items.get(stored.spellId) : null;
  if (!spell) {
    ui.notifications.warn(`No spell is stored in ${sourceItem.name}.`);
    return;
  }

  await spell.use({ spell: { slot: `spell${stored.level}` }, consume: { spellSlot: false } }, { configure: false });

  // releasing ends the mark, so its Aegis effects and Enspell weapon enchantments go with it
  const markEffects = parentActor.effects.filter((effect) => effect.origin?.startsWith(sourceItem.uuid));
  if (markEffects.length > 0) {
    await parentActor.deleteEmbeddedDocuments("ActiveEffect", markEffects.map((effect) => effect.id));
  }
  for (const weapon of parentActor.items) {
    if (weapon.id === sourceItem.id) continue;
    const enchantments = weapon.effects.filter((effect) => effect.isAppliedEnchantment
      && effect.origin?.startsWith(sourceItem.uuid));
    if (enchantments.length > 0) {
      await weapon.deleteEmbeddedDocuments("ActiveEffect", enchantments.map((effect) => effect.id));
    }
  }
  await parentActor.unsetFlag("world", flag);

  // the Activate self enchantment carries this activity as a rider, so it goes last
  const activation = sourceItem.effects.filter((effect) => effect.isAppliedEnchantment);
  if (activation.length > 0) {
    await sourceItem.deleteEmbeddedDocuments("ActiveEffect", activation.map((effect) => effect.id));
  }
}
