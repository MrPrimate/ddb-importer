// This Macro was provided by @Elwin#1410 on Discord and is included with their permission
// some modifications have been made for inclusion with DDB Importer
//
// In the preItemRoll phase, the macro validates that there is one target and that the item
// is not already activated. It then adds an effect to the actor activating the item,
// this effect contains the a flag to identify the target, an onUseMacroMacro that will callback this
// ItemMacro on preDamageRoll as well as a DamageBonusMacro that will also callback this ItemMacro.
// The first time that an attack hits and the damage is rolled, the preDamageRoll macro is called to
// validate if the item used for the attack and if the target is valid for this item. If it is valid,
// the item is modified to replace the damage types that appear in it damage parts, versatile formula and other formula,
// by "force" damage. Then during the damage bonus phase, if the target is valid, the item extra damage is
// computed and returned. In this phase, a function is also registered to be executed on the "midi-qol.DamageRollComplete"
// hook event to revert the item damage back to its orignal values and to remove the effects on the source and the target.
// ###################################################################################################

const newDamageType = "force";
const sourceItemName = "Planar Warrior";

if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {
  // Validate requirements to activate this item
  const macroData = args[0];
  const token = canvas.tokens.get(macroData.tokenId);

  const actor = token?.actor; // actor who used the feat
  if (!actor) {
    ui.notifications.error(`${sourceItemName}: No token selected`);
    return false; // source needed
  }

} else if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  // Adds active effects on source of this item, those on the target are applied by MidiQOL
  const macroData = args[0];
  const token = canvas.tokens.get(macroData.tokenId);
  const actor = token.actor; // actor who used the feat

  // We only check for target here to allow midi-qol late targeting
  if (macroData.hitTargets.length < 1) {
    ui.notifications.error(`${sourceItemName}: No target selected`);
    return { haltEffectsApplication: true }; // target needed
  }

  const targetUuid = macroData.hitTargets[0].uuid;

  // create an active effect,
  //  - the first to set the target of the item
  //  - the second to set the flag for an onUseMacro to validate if the attack is valid for the feat
  //  - the third to set the flag for the macro to be called for extra damage
  let effect = await actor.effects.find((e) => (e.name ?? e.label) === macroData.item.name);
  if (effect) {
    console.error(`${sourceItemName}: Effect already on actor`);
    return;
  }

  const effectData = {
    changes: [
      // who is marked
      {
        key: "flags.midi-qol.planarWarrior.targetUuid",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: targetUuid,
        priority: 20,
      },
      // macro to change damage type if target is valid on next attack that hits
      DDBImporter.lib.DDBMacros.generateOnUseMacroChange({ macroPass: "preDamageRoll", macroType: "feat", macroName: "planarWarrior.js", priority: 15, document: { name: macroData.item.name } }),
      // macro to apply the damage
      {
        key: "flags.dnd5e.DamageBonusMacro",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: DDBImporter.lib.DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "planarWarrior.js", document: { name: macroData.item.name }}),
        priority: 20,
      },
    ],

    origin: macroData.itemUuid, //flag the effect as associated to the item used
    disabled: false,
    duration: foundry.utils.duplicate(macroData.item.effects[0].duration),
    img: macroData.item.img,
    label: macroData.item.name,
    name: macroData.item.name,
  };
  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
} else if (args[0].tag === "OnUse" && args[0].macroPass === "preDamageRoll") {
  // Validates if target is valid for the attack and replaces damage type if thats the case
  let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
  if (!foundry.utils.getProperty(workflow.actor.flags, "midi-qol.planarWarrior.targetUuid")) {
    // There was a problem, the hook was set but the never called while the item was active
    return;
  }
  // Make sure the temp property is set to false, we keep this in workflow variable otherwise
  // if set on actor it would be removed on an actor update
  foundry.utils.setProperty(workflow, "planarWarrior.validTarget", false);

  if (!isValidTarget(workflow)) {
    return;
  }

  // Set property for ItemMacro.DamageBonus macroPass
  foundry.utils.setProperty(workflow, "planarWarrior.validTarget", true);

  // Set default damage type
  workflow.defaultDamageType = newDamageType;

  // Replace item damage
  replaceItemDamage(workflow);
} else if (args[0].tag === "DamageBonus") {
  // Adds bonus damage if target is valid
  const macroData = args[0];
  let workflow = MidiQOL.Workflow.getWorkflow(macroData.uuid);
  if (!foundry.utils.getProperty(workflow, "planarWarrior.validTarget")) {
    // Skip, maybe next attack could be valid for this item
    return {};
  }

  // Reset to false to make sure it is not called again without validation first
  foundry.utils.setProperty(workflow, "planarWarrior.validTarget", false);

  const sourceItemUuid = macroData.sourceItemUuid;

  // Register hook to revert damage after damage roll is complete
  Hooks.once(`midi-qol.DamageRollComplete.${macroData.itemUuid}`, async (workflow) => {
    // Revert item damage
    revertItemDamage(workflow);
    // Remove actor and target effects for the origin
    await removeEffects(workflow, sourceItemUuid);
    // Clear temporary workflow variable
    delete workflow.planarWarrior;
  });

  // Use same roll options as the one from the damageRoll
  const rollOptions = macroData.damageRoll?.options ?? { critical: macroData.isCritical };
  // Construct a DamageRoll to compute critical damage using the appropriate defined method and use the resulting formula
  const damageBonusResult = new CONFIG.Dice.DamageRoll(
    `@scale.horizon-walker.planar-warrior[${newDamageType}]`,
    macroData.rollData,
    rollOptions
  );

  return { damageRoll: damageBonusResult.formula, flavor: `${macroData.item.name} Damage` };
}

/**
 * Returns true if the worflow item and target are valid for the item effect to be applied.
 *
 * @param {*} workflow the midi-qol workflow.
 * @returns true if item and target are valid, false otherwise.
 */
function isValidTarget(workflow) {
  // only hits
  if (workflow.hitTargets.size < 1) {
    return false;
  }

  // only weapon attacks
  if (!["mwak", "rwak"].includes(workflow.item?.system.actionType)) {
    return false;
  }

  const targetUuid = workflow.hitTargets.first().document.uuid;
  // only on the marked target
  if (targetUuid !== foundry.utils.getProperty(workflow.actor.flags, "midi-qol.planarWarrior.targetUuid")) {
    return false;
  }
  return true;
}

/**
 * Replaces the current workflow item damage type with newDamageType.
 * Damage types that are replaced:
 * - item.system.damage.parts: The damage types in part formula are replaced as well as the damage type of a part.
 * - item.system.damage.versatile: The damage types in versatile formula.
 * - item.system.formula: The damage types in other formula.
 *
 * @param {*} workflow the midi-qol workflow.
 */
function replaceItemDamage(workflow) {
  // Change temporarely the damage type of the item, but make a temporary copy before applying changes
  // and keep the original values in a flag
  const item = workflow.item;
  if (item.system.damage?.parts?.length > 0 && !foundry.utils.getProperty(workflow, "planarWarrior.origDmg")) {
    const origDmg = item.system.damage;

    let newDmg = foundry.utils.duplicate(origDmg);
    let newOtherFormula = foundry.utils.duplicate(item.system.formula ?? "");

    for (let i = 0; i < newDmg.parts.length; i++) {
      newDmg.parts[i] = foundry.utils.duplicate(origDmg.parts[i]);
      // Change damage type in formula if present
      newDmg.parts[i][0] = getUpdatedFormula(newDmg.parts[i][0]);
      // Change damage type
      newDmg.parts[i][1] = newDamageType;
    }
    // Convert all formulas (even if damage is dependent on save)
    newDmg.versatile = getUpdatedFormula(newDmg.versatile);
    newOtherFormula = getUpdatedFormula(newOtherFormula);

    // Set in memory and recompute item derived data
    foundry.utils.setProperty(workflow, "planarWarrior.origDmg", origDmg);
    foundry.utils.setProperty(workflow, "planarWarrior.origOtherFormula", item.system.formula);
    item.system.damage = newDmg;
    item.system.formula = newOtherFormula;
    item.prepareDerivedData();

    console.log(`${sourceItemName}: ${item.name} damage changed to`, item.system.damage, item.system.formula);
  }
}

/**
 * Reverts the temporary workflow item damage changes with the original values.
 *
 * @param {*} workflow the midi-qol workflow.
 */
function revertItemDamage(workflow) {
  // Revert item to original damage
  const origDmg = foundry.utils.getProperty(workflow, "planarWarrior.origDmg");
  if (!origDmg) {
    return;
  }
  const origOtherFormula = foundry.utils.getProperty(workflow, "planarWarrior.origOtherFormula");

  // Set in memory and recompute item derived data
  workflow.item.system.damage = origDmg;
  workflow.item.system.formula = origOtherFormula;
  workflow.item.prepareDerivedData();
  foundry.utils.setProperty(workflow, "planarWarrior.origDmg", null);
  foundry.utils.setProperty(workflow, "planarWarrior.origOtherFormula", null);
  console.log(`${sourceItemName}: ${workflow.item.name} damage reverted to`, origDmg, origOtherFormula);

}

/**
 * Removed the item effects from the source and the target.
 *
 * @param {*} workflow the midi-qol workflow.
 * @param {*} sourceItemUuid the UUID of the item that initiated the effects.
 */
async function removeEffects(workflow, sourceItemUuid) {
  const actorUuid = workflow.actor.uuid;
  const targetUuid = workflow.hitTargets.first().document.uuid;
  // Remove effect from source
  await DAE.deleteActiveEffect(actorUuid, sourceItemUuid);

  // Remove effect from target
  await DAE.deleteActiveEffect(targetUuid, sourceItemUuid);
}

/**
 * Replaces damage types contained the specified formula with newDamageType.
 * It will replace only "normal" damage types (bludgeoning, piercing, slashing) if replaceNormalDmgTypeOnly is true,
 * otherwise it will replace any damage type.
 *
 * @param {*} formula damage formula to be updated.
 * @returns  new damage formula with damage types updated.
 */
function getUpdatedFormula(formula) {
  if (!formula) {
    return formula;
  }
  let newFormula = formula;
  newFormula = newFormula.replace(/(\[)([^\]]+)(\])/g, `$1${newDamageType}$3`);
  return newFormula;
}
