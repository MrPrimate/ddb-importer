// This Macro was provided by @Elwin#1410 on Discord and is included with their permission
// some modifications have been made for inclusion with DDB Importer

// Description:
// In the postAttackRoll phase, the macro validates that the actor initiating the item is in Rage,
// that no target was already marked and if in combat that it's the combatant turn. If that's the case,
// then an effect is added to the target to mark it and handle any attack from this marked target to any
// other target than the one that marked it.
// ###################################################################################################

const sourceItemName = "Ancestral Protectors";
const rageEffectName = "Rage";

if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll") {
  const macroData = args[0];
  let token = canvas.tokens.get(macroData.tokenId);
  let actor = token.actor;

  if (actor.getFlag("world", "ancestralProtectors.sourceTokenUuid")) {
    // When the marked target makes an attack
    handlePreAttackByMarkedTarget(macroData);
  }
} else if (args[0].tag === "OnUse" && args[0].macroPass === "postAttackRoll") {
  const macroData = args[0];

  if (macroData.hitTargets.length < 1) return;
  // The Barbarian must hit

  let token = canvas.tokens.get(macroData.tokenId);
  let actor = token.actor;

  if (!hasEffectApplied(rageEffectName, actor)) return;
  // The Barbarian must be in Rage

  if (actor.getFlag("world", "ancestralProtectors.targetUuid")) {
    console.warn("There is already a marked target")
    return;
  }
  // There is already a marked target

  const inCombat = game.combat;
  const combatantTurn = !inCombat || !token.combatant || game.combat.combatant.id === token.combatant.id;
  if (!combatantTurn) return;
  // Can only be activated on combatant turn's

  console.log(`${sourceItemName}: Applied on target`, macroData);

  const targetUuid = macroData.hitTargetUuids[0];
  const target = await fromUuid(targetUuid);
  const targetActor = target.actor;
  const sourceItem = await fromUuid(macroData.sourceItemUuid);

  // create an active effect to set the target of the item
  const effectData = {
    changes: [
      // who is marked
      {
        key: "flags.world.ancestralProtectors.targetUuid",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: targetUuid,
        priority: 20,
      },
    ],

    origin: macroData.sourceItemUuid, //flag the effect as associated to the source item used
    disabled: false,
    duration: { rounds: 1 },
    img: sourceItem.img,
    label: `${sourceItemName} - Target`,
    name: `${sourceItemName} - Target`,
  };
  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

  // create an active effect on target
  const targetEffectData = {
    changes: [
      // macro to set disadvantage or not before attack made by marked target
      DDBImporter.lib.DDBMacros.generateOnUseMacroChange({ macroPass: "preAttackRoll", macroType: "feat", macroName: "ancestralProtectors.js", priority: 15, document: { name: macroData.sourceItemUuid } }),
      // macro to set damage resistance or not
      DDBImporter.lib.DDBMacros.generateOnUseMacroChange({ macroPass: "preDamageApplication", macroType: "feat", macroName: "ancestralProtectors.js", priority: 20, document: { name: macroData.sourceItemUuid } }),
      // flag to indicate who marked this actor
      {
        key: "flags.world.ancestralProtectors.sourceTokenUuid",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: macroData.tokenUuid,
        priority: 20,
      },
    ],

    origin: effectData.origin, // flag the effect as associated to the source item used
    disabled: false,
    duration: { rounds: 1 },
    img: sourceItem.img,
    label: `Marked by ${sourceItemName}`,
    name: `Marked by ${sourceItemName}`,
  };
  await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [targetEffectData] });
} else if (args[0].tag === "OnUse" && args[0].macroPass === "preDamageApplication") {
  const macroData = args[0];
  let token = canvas.tokens.get(macroData.tokenId);
  let actor = token.actor;

  if (actor.getFlag("world", "ancestralProtectors.sourceTokenUuid")) {
    // Damage was done by the marked target
    await handlePreDamageByMarkedTarget(macroData);
  }
}

/**
 * Returns true if the specified effect name is found on the actor.
 * @param {*} effectName name of the effect to find.
 * @param {*} actor actor on which to look for the effect.
 * @returns true if the effect is found, false otherwise.
 */
function hasEffectApplied(effectName, actor) {
  return actor.effects.find((ae) => (ae.name ?? ae.label) === effectName) !== undefined;
}

/**
 * When a marked target makes an attack. Sets disadvantage if the marked target does not attack its marker.
 * @param {*} macroData midi-qol macro data.
 * @returns
 */
function handlePreAttackByMarkedTarget(macroData) {
  if (macroData.targets.length < 1) return;

  let token = canvas.tokens.get(macroData.tokenId);
  let actor = token.actor;

  const sourceTokenUuid = actor.getFlag("world", "ancestralProtectors.sourceTokenUuid");
  if (macroData.targetUuids.filter((targetUuid) => targetUuid !== sourceTokenUuid).length > 0) {
    // Target is not the source of the mark
    console.log(`${sourceItemName}: Disadvantage on target for not beeing the marker of the attacker`, macroData);
    foundry.utils.setProperty(macroData.workflowOptions, "disadvantage", true);
  }


}

/**
 * When a marked target deals damage. Adds damage resistance to the target if the damage was caused by an attack and the target is not the marker.
 * @param {*} macroData midi-qol macro data.
 */
async function handlePreDamageByMarkedTarget(macroData) {
  if (macroData.hitTargets.length < 1 || !macroData.attackRoll) return;
  // There must be at least one hit target
  // The damage must be from an attack

  let token = canvas.tokens.get(args[0].tokenId);
  let actor = token.actor;

  const sourceTokenUuid = actor.getFlag("world", "ancestralProtectors.sourceTokenUuid");
  const notSourceTargetUuids = macroData.targetUuids.filter((targetUuid) => targetUuid !== sourceTokenUuid);
  if (notSourceTargetUuids.length > 0) {
    console.log(
      `${sourceItemName}: Damage resistance applied to targets for not being the marker of the attacker`,
      macroData,
      notSourceTargetUuids
    );

    // create an active effect on targets
    const sourceItem = await fromUuid(macroData.sourceItemUuid);
    const targetEffectData = {
      changes: [
        // flag for damage resistance
        {
          key: "system.traits.dr.all",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: "1",
          priority: 20,
        },
      ],

      origin: macroData.sourceItemUuid, //flag the effect as associated to the source item used
      disabled: false,
      duration: { turns: 1 },
      img: sourceItem.img,
      label: `${sourceItemName} - Damage resistance`,
      name: `${sourceItemName} - Damage resistance`,
    };
    foundry.utils.setProperty(targetEffectData, "flags.dae.specialDuration", ["isDamaged"]);

    for (let targetUuid of notSourceTargetUuids) {
      const target = await fromUuid(targetUuid);
      const targetActor = target.actor;
      await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [targetEffectData] });
    }
  }

}
