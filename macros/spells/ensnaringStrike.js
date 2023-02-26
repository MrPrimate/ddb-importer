// Based on a macro by Elwin#1410 with permission. Thanks Elwin!
//
// Optional AA setup:
//   A special custom restrained condition can be added for Ensnaring Strike.
//     - In the AA Auto Rec menu, select the Active Effects tab.
//     - Duplicate the Restrained entry.
//     - Rename the duplicate to "Restrained [Ensnaring Strike]"
//     - Change the animation to something more appropriate for the spell, e.g.:
//       - Type: Spell
//       - Animation: Entangle
//       - Variant: 01
//       - Color: Green

if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  return;
}

const itemName = "Ensnaring Strike";
const icon = "icons/magic/nature/root-vine-entangled-hand.webp";

/**
 * Adds a save advantage effect for the next save on the specified target actor.
 *
 * @param {*} targetActor the target actor on which to add the effect.
 * @param {*} originItem the item that is the origin of the effect.
 */
async function addSaveAdvantageToTarget(targetActor, originItem) {
  const effectData = {
    _id: randomID(),
    changes: [
      {
        key: "flags.midi-qol.advantage.ability.save.str",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    origin: originItem.uuid,
    disabled: false,
    transfer: false,
    icon,
    label: `${originItem.name}: Save Advantage Large Creature`,
    duration: { turns: 1 },
    flags: {
      dae: {
        specialDuration: ["isSave.str"],
      },
    },
  };
  await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
}

/**
 * Returns a new duration which reflects the remaining duration of the specified one.
 *
 * @param {*} duration the source duration
 * @returns a new duration which reflects the remaining duration of the specified one.
 */
function getRemainingDuration(duration) {
  const newDuration = {};
  if (duration.type === "seconds") {
    newDuration.seconds = duration.remaining;
  } else if (duration.type === "turns") {
    const remainingRounds = Math.floor(duration.remaining);
    const remainingTurns = (duration.remaining - remainingRounds) * 100;
    newDuration.rounds = remainingRounds;
    newDuration.turns = remainingTurns;
  }
  return newDuration;
}


/**
 * Returns a temporary spell item data for the Ensnaring Strike effect.
 *
 * @param {*} sourceActor the actor that casted the origin spell item.
 * @param {*} originItem the origin spell item that was cast.
 * @param {*} originEffect the effect from the origin spell item that was cast.
 * @returns temporary spell item data for Ensnaring Strike effect.
 */
function getTempSpellData(sourceActor, originItem, originEffect) {
  const level = getProperty(originEffect, "flags.midi-qol.castData.castLevel") ?? 1;
  const nbDice = level;

  // Get restrained condition id
  const statusId = CONFIG.statusEffects.find(se => se.name === CONFIG.DND5E.conditionTypes["restrained"])?.id;
  const conEffect = MidiQOL.getConcentrationEffect(sourceActor);

  // Temporary spell data for the ensnaring effect.
  // Note: we keep same id as origin spell to make sure that the AEs have the same origin
  // as the origin spell (for concentration handling)
  return {
    _id: originItem.id,
    type: "spell",
    name: `${originItem.name}`,
    img: originItem.img,
    system: {
      level: level,
      actionType: "save",
      save: { ability: "str" },
      preparation: { mode: "atwill" },
      target: { type: "creature", value: 1 },
    },
    effects: [
      {
        _id: randomID(),
        changes: [
          {
            key: "StatusEffect",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: statusId,
            priority: 20,
          },
          {
            key: "flags.dae.deleteUuid",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: conEffect.uuid,
            priority: 20,
          },
          {
            key: "flags.midi-qol.OverTime",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: `turn=start,damageRoll=${nbDice}d6,damageType=piercing,label=${originItem.name}: Effect,actionSave=true,rollType=check,saveAbility=str,saveDC=@attributes.spelldc`,
            priority: 20,
          },
        ],
        origin: originItem.uuid,
        disabled: false,
        transfer: false,
        icon,
        label: originItem.name,
        duration: getRemainingDuration(conEffect.duration),
      },
    ],
  };
}

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  const macroData = args[0];

  const workflow = MidiQOL.Workflow.getWorkflow(macroData.uuid);
  if (workflow?.options?.skipOnUse) {
    // Skip onUse when temporary effect item is used (this is a custom option that is passed to completeItemUse)
    return;
  }

  if (macroData.hitTargets.length < 1) {
    // No target hit
    return;
  }
  if (!["mwak", "rwak"].includes(macroData.itemData.system.actionType)) {
    // Not a weapon attack
    return;
  }

  const originItem = await fromUuid(macroData.sourceItemUuid);
  if (!originItem) {
    // Could not find origin item
    console.error(`${itemName}: origin item ${macroData.sourceItemUuid} not found.`);
    return;
  }
  const sourceActor = await fromUuid(macroData.actorUuid);
  if (sourceActor.getFlag("world", "ensnaring-strike.used")) {
    // Effect already applied to target
    console.warn(`${itemName}: spell already used.`);
    return;
  }

  const originEffect = sourceActor.effects.find((ef) =>
    ef.getFlag("midi-qol", "castData.itemUuid") === macroData.sourceItemUuid
  );
  if (!originEffect) {
    console.error(`${itemName}: spell active effect was not found.`);
    return;
  }

  // Flag the spell as used.
  let originEffectChanges = duplicate(originEffect.changes);
  originEffectChanges.push({
    key: "flags.world.ensnaring-strike.used",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "1",
    priority: 20,
  });
  await originEffect.update({ changes: originEffectChanges });

  // Temporary spell data for the ensnaring effect
  const spellData = getTempSpellData(sourceActor, originItem, originEffect);
  const spell = new Item.implementation(spellData, {
    parent: sourceActor,
    temporary: true,
  });

  // If AA has a special custom effect for the restrained condition, use it instead of standard one
  if (game.modules.get("autoanimations")?.active) {
    game.modules.get("ddb-importer")?.api.effects.configureCustomAAForCondition("restrained", macroData, originItem.name, spell.uuid);
  }
  // Check if target is large or larger and give it advantage on next save
  const targetActor = macroData.hitTargets[0].actor;
  if (dnd5e.config.tokenSizes[targetActor?.system.traits.size ?? "med"] >= dnd5e.config.tokenSizes["lg"]) {
    await addSaveAdvantageToTarget(targetActor, originItem);
  }
  const options = {
    createWorkflow: true,
    targetUuids: [macroData.hitTargetUuids[0]],
    configureDialog: false,
    skipOnUse: true,
  };
  const spellEffectWorkflow = await MidiQOL.completeItemUse(spell, {}, options);
  const conEffect = MidiQOL.getConcentrationEffect(sourceActor);

  if (spellEffectWorkflow.hitTargets.size > 0 && spellEffectWorkflow.failedSaves.size > 0) {
    // Transfer target of concentration from the caster to the target to allow removing effect on caster.
    const conTargets = [];
    spellEffectWorkflow.failedSaves.forEach((token) =>
      conTargets.push({
        tokenUuid: token.document?.uuid ?? token.uuid,
        actorUuid: token.actor?.uuid ?? "",
      })
    );
    await sourceActor.setFlag("midi-qol", "concentration-data.targets", conTargets);
    await originEffect.delete();
  } else {
    // Remove concentration and the effect causing it since the effect has been used
    if (conEffect) {
      conEffect.delete();
    }
  }
}
