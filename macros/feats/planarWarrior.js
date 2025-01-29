// This Macro was provided by @Elwin#1410 on Discord and is included with their permission
// some modifications have been made for inclusion with DDB Importer
//
// Usage:
// This item needs to be used to activate. When activated the target is marked and the next time the
// target is hit with a weapon attack the effect will be applied.
//
// Description:
// In the postActiveEffects phase of the Planar Warrior Mark activity (in owner's workflow):
//   It validates that there is one target and that the item is not already activated. It then adds an
//   effect to the actor activating the item, this effect contains the a flag to identify the target,
//   an onUseMacroMacro that will callback this ItemMacro on preDamageRoll as well as a DamageBonusMacro
//   that will also callback this ItemMacro.
// In the preDamageRoll phase of any owner's item activity (in owner's workflow):
//   The first time that an attack hits and the damage is rolled, the macro validates if the activity used
//   for the attack is a weapon attack and if the target is valid for this activity.
//   If valid, the activity is modified to replace the damage types that appears in its damage parts by "force" damage.
// In the DamageBonus phase of any owner's item activity (in owner's workflow)::
//   If the target is valid, the Planar Warrior extra damage is computed and returned. In this phase, a function is
//   also registered to be executed on the "midi-qol.DamageRollComplete" hook event to revert the activity damage
//   back to its orignal values and to remove the effects on the source and the target.
// ###################################################################################################

const NEW_DAMAGE_TYPE = "force";
const MACRO_ITEM_ORIGINAL_NAME = "Planar Warrior";

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  // Adds active effects on source of this item, those on the target are applied by MidiQOL

  if (!workflow.effectTargets?.size) {
    return; // target needed
  }

  const target = workflow.effectTargets.first();

  const effectData = {
    changes: [
      // who is marked
      {
        key: "flags.world.planarWarrior.targetUuid",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: target.document.uuid,
        priority: 20,
      },
      // macro to change damage type if target is valid on next attack that hits
      DDBImporter.lib.DDBMacros.generateOnUseMacroChange({
        macroPass: "preDamageRoll",
        macroType: "feat",
        macroName: "planarWarrior.js",
        priority: 15,
        document: { name: rolledItem.name },
      }),
      // macro to apply the damage
      {
        key: "flags.dnd5e.DamageBonusMacro",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: DDBImporter.lib.DDBMacros.generateItemMacroValue({
          macroType: "feat",
          macroName: "planarWarrior.js",
          document: { name: rolledItem.name },
        }),
        priority: 20,
      },
    ],
    origin: rolledItem.uuid, //flag the effect as associated to the item used
    transfer: false,
    disabled: false,
    duration: foundry.utils.deepClone(rolledItem.effects?.contents[0]?.duration ?? {}),
    img: rolledItem.img,
    name: rolledItem.name,
    flags: {
      "dae.stackable": "noneName",
      ddbimporter: {
        macroName: MACRO_ITEM_ORIGINAL_NAME,
      },
    }
  };
  const [selfEffect] = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

  const markedEffect = target?.actor.effects?.find((ae) => ae.origin?.startsWith(rolledItem.uuid));
  if (selfEffect && markedEffect) {
    await markedEffect.addDependent(selfEffect);
    await selfEffect.addDependent(markedEffect);
  }
} else if (args[0].tag === "OnUse" && args[0].macroPass === "preDamageRoll") {
  // Validates if target is valid for the attack and replaces damage type if thats the case
  if (!foundry.utils.getProperty(actor, "flags.world.planarWarrior.targetUuid")) {
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
  workflow.defaultDamageType = NEW_DAMAGE_TYPE;

  // Replace activity damage
  DDBImporter.EffectHelper.replaceActivityDamageMidi([NEW_DAMAGE_TYPE]);
} else if (args[0].tag === "DamageBonus") {
  // Adds bonus damage if target is valid
  const macroData = args[0];
  if (!foundry.utils.getProperty(workflow, "planarWarrior.validTarget")) {
    // Skip, maybe next attack could be valid for this item
    return {};
  }

  // Reset to false to make sure it is not called again without validation first
  foundry.utils.setProperty(workflow, "planarWarrior.validTarget", false);

  // Register hook to revert damage after damage roll is complete
  Hooks.once(`midi-qol.DamageRollComplete.${workflow.itemUuid}`, async (currentWorkflow) => {
    console.warn("here", {
      scope, currentWorkflow,
    })

    // Revert item damage
    DDBImporter.EffectHelper.revertActivityDamageMidi(currentWorkflow);
    // Remove actor and target effects for the origin
    await currentWorkflow.actor?.effects
      ?.find((ae) => ae.flags?.ddbimporter?.macroName === MACRO_ITEM_ORIGINAL_NAME
      && ae.origin?.startsWith(actor.uuid)
    )?.delete();
    // Clear temporary workflow variable
    delete currentWorkflow.planarWarrior;
  });

  // Use same roll options as the one from the damageRoll
  const dmgRollOptions = workflow.damageRolls?.[0]?.options ?? {};
  const rollOptions = {
    isCritical: dmgRollOptions?.isCritical,
    critical: foundry.utils.deepClone(dmgRollOptions?.critical ?? {}),
    flavor: `${MACRO_ITEM_ORIGINAL_NAME} Damage`,
    type: NEW_DAMAGE_TYPE,
  };

  // Construct a DamageRoll to compute critical damage using the appropriate defined method and use the resulting formula
  const damageBonusRoll = new CONFIG.Dice.DamageRoll(
    `@scale.horizon-walker.planar-warrior`,
    macroData.rollData,
    rollOptions
  );

  return damageBonusRoll;
}

/**
 * Returns true if the worflow item and target are valid for the item effect to be applied.
 *
 * @param {MidiQOL.Workflow} currentWorkflow the midi-qol workflow.
 * @returns {boolean} true if item and target are valid, false otherwise.
 */
function isValidTarget(currentWorkflow) {
  // only hits
  if (!currentWorkflow.hitTargets.size) {
    return false;
  }

  // only weapon attacks

  const activity = currentWorkflow.activity;

  // console.warn(activity);
  if (!DDBImporter.EffectHelper.isAttack({ activity, classification: "weapon" })) return false;

  const targetUuid = currentWorkflow.hitTargets.first().document.uuid;
  // only on the marked target
  if (targetUuid !== foundry.utils.getProperty(currentWorkflow.actor, "flags.world.planarWarrior.targetUuid")) {
    return false;
  }
  return true;
}
