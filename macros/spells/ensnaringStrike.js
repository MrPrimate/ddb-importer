// Based on a macro by Elwin#1410 with permission. Thanks Elwin!
//
// Optional AA setup:
//   A special custom restrained condition can be added for Ensnaring Strike.
//     - In the AA Auto Rec menu, select the Active Effects tab.
//     - Create a new entry.name "Restrained [Ensnaring Strike]"
//     - Animation Type: On Token
//     - Primary Animation: (Set the animation to something more appropriate for the spell), e.g.:
//       - Type: Spell
//       - Animation: Entangle
//       - Variant: 01
//       - Color: Green
//       - Options:
//         - Persistent: (checked)

if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  return;
}

const DEFAULT_ITEM_NAME = "Ensnaring Strike";

/**
 * Returns a temporary spell item data for the Ensnaring Strike effect.
 *
 * @param {Actor5e} sourceActor the actor that casted the origin spell item.
 * @param {Item5e} originItem the origin spell item that was cast.
 * @param {ActiveEffect5e} originEffect the effect from the origin spell item that was cast.
 * @returns temporary spell item data for Ensnaring Strike effect.
 */
function getTempSpellData(sourceActor, originItem, originEffect) {
  const level = foundry.utils.getProperty(originEffect, "flags.midi-qol.castData.castLevel") ?? 1;
  const nbDice = level;

  // Get restrained condition id
  const statusId = CONFIG.statusEffects.find(se => se.name === CONFIG.DND5E.conditionTypes["restrained"].label)?.id;
  const conEffect = MidiQOL.getConcentrationEffect(sourceActor, originItem);

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
        changes: [
          {
            key: "StatusEffect",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: statusId,
            priority: 20,
          },
          {
            key: "flags.midi-qol.OverTime",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: `turn=start,damageRoll=${nbDice}d6,damageType=piercing,label=${originItem.name}: Effect,actionSave=roll,rollType=check,saveAbility=str,saveDC=@attributes.spelldc,killAnim=true`,
            priority: 20,
          },
        ],
        origin: originItem.uuid,
        disabled: false,
        transfer: false,
        img: originItem.img,
        name: originItem.name,
        duration: DDBImporter?.EffectHelper.getRemainingDuration(conEffect.duration),
      },
    ],
  };
}

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  const macroData = args[0];

  if (workflow.options?.skipOnUse) {
    // Skip onUse when temporary effect item is used (this is a custom option that is passed to completeItemUse)
    return;
  }

  if (workflow.hitTargets.size < 1) {
    // No target hit
    return;
  }
  if (!["mwak", "rwak"].includes(rolledItem?.system?.actionType)) {
    // Not a weapon attack
    return;
  }

  const originEffect = actor.effects.find((ef) =>
    ef.getFlag("midi-qol", "castData.itemUuid") === macroItem.uuid
  );
  if (!originEffect) {
    console.error(`${DEFAULT_ITEM_NAME}: spell active effect was not found.`);
    return;
  }

  // Temporary spell data for the ensnaring effect
  const spellData = getTempSpellData(actor, macroItem, originEffect);
  const spell = new Item.implementation(spellData, {
    parent: actor,
    temporary: true,
  });

  // If AA has a special custom effect for the restrained condition, use it instead of standard one
  if (game.modules.get("autoanimations")?.active) {
    DDBImporter?.EffectHelper.configureCustomAAForCondition("restrained", macroData, macroItem.name, spell.uuid);
  }
  // Check if target is large or larger and give it advantage on next save
  const targetActor = workflow.hitTargets.first().actor;
  if (getActorSizeValue(targetActor) >= getSizeValue("lg")) {
    await DDBImporter?.EffectHelper.addSaveAdvantageToTarget(targetActor, macroItem, "str", " (Large Creature)");
  }

  const conEffect = MidiQOL.getConcentrationEffect(actor, macroItem);
  const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targets: [macroData.hitTargetUuids[0]] });
  options.skipOnUse = true;
  foundry.utils.setProperty(options,"flags.dnd5e.use.concentrationId", conEffect?.id);
  const spellEffectWorkflow = await MidiQOL.completeItemUse(spell, config, options);

  if (spellEffectWorkflow.hitTargets.size > 0 && spellEffectWorkflow.failedSaves.size > 0) {
    // At least one target has an effect, we can remove the original effect from the caster
    await originEffect.delete();
  } else {
    // Remove concentration and the effect causing it since the effect has been used
    conEffect?.delete();
  }
}

/**
* Returns the numeric value of the specified actor's size.
*
* @param {Actor5e} actor actor for which to get the size value.
* @returns {number} the numeric value of the specified actor's size.
*/
function getActorSizeValue(actor) {
  return getSizeValue(actor?.system?.traits?.size ?? "med");
}

/**
 * Returns the numeric value of the specified size.
 *
 * @param {string} size  the size name for which to get the size value.
 * @returns {number} the numeric value of the specified size.
 */
function getSizeValue(size) {
  return Object.keys(CONFIG.DND5E.actorSizes).indexOf(size ?? "med");
}
