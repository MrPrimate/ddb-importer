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

/**
 * Returns a temporary spell item data for the Ensnaring Strike effect.
 *
 * @param {Item5e} originItem the origin spell item that was cast.
* @returns temporary spell item data for Ensnaring Strike effect.
 */
function getTempSpellData(originItem, spellLevel) {
  // Temporary spell data for the ensnaring effect.
  // Note: we keep same id as origin spell to make sure that the AEs have the same origin
  // as the origin spell (for concentration handling)

  const newData = originItem.toObject();

  const newActivities = {};
  for (const [key, activity] of Object.entries(newData.system.activities)) {
    if (activity.type === "save") {
      // activity.effects.push({ _id: effectId });
      newActivities[key] = activity;
    }
  }

  return {
    _id: originItem.id,
    type: "spell",
    name: `${originItem.name}`,
    img: originItem.img,
    system: {
      level: 1,
      preparation: { mode: "atwill" },
      activities: newActivities,
      target: originItem.system.target,
    },
    effects: newData.effects.filter((ef) => ef.name.includes("Restrained")).map((ef) => {
      ef.changes.forEach((c) => {
        c.value = c.value
          .replace("(0)", spellLevel)
          .replace("(@spellLevel)", spellLevel);
      });
      return ef;
    }),
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

  const activity = args[0].workflow.activity;
  if (!DDBImporter.EffectHelper.isAttack({ activity, classification: "weapon" })) return;

  const ensnaringStrikeDoc = actor.items.find((i) =>
    (i.flags.ddbimporter?.originalName ?? i.name) === "Ensnaring Strike"
    && i.system.source.rules === "2014",
  );

  // console.warn("Ensnaring Strike", {
  //   args,
  //   actor,
  //   workflow,
  //   ensnaringStrikeDoc,
  // })

  const originEffect = actor.effects.find((ef) =>
    ensnaringStrikeDoc.uuid === foundry.utils.getProperty(ef, "flags.midi-qol.castData.itemUuid")
  );
  if (!originEffect) {
    console.error(`Ensnaring Strike: spell active effect was not found.`);
    return;
  }

  const castLevel = actor.flags["midi-qol"].ensnaringStrike.level;


  // Temporary spell data for the ensnaring effect
  const spellData = getTempSpellData(ensnaringStrikeDoc, castLevel);
  const spell = new Item.implementation(spellData, {
    parent: actor,
    temporary: true,
  });


  // If AA has a special custom effect for the restrained condition, use it instead of standard one
  if (game.modules.get("autoanimations")?.active) {
    DDBImporter.EffectHelper.configureCustomAAForCondition("restrained", macroData, ensnaringStrikeDoc.name, spell.uuid);
  }
  // Check if target is large or larger and give it advantage on next save
  const targetActor = workflow.hitTargets.first().actor;
  if (DDBImporter.EffectHelper.getActorSizeValue(targetActor) >= DDBImporter.EffectHelper.getSizeValue("lg")) {
    await DDBImporter.EffectHelper.addSaveAdvantageToTarget(targetActor, ensnaringStrikeDoc, "str", " (Large Creature)");
  }

  const conEffect = MidiQOL.getConcentrationEffect(actor, ensnaringStrikeDoc);
  const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({
    targets: [macroData.hitTargetUuids[0]],
    slotLevel: castLevel,
    scaling: castLevel - 1,
  });
  options.skipOnUse = true;

  // foundry.utils.setProperty(options,"flags.dnd5e.use.concentrationId", conEffect?.id);
  const spellEffectWorkflow = await MidiQOL.completeItemUse(spell, config, options);

  // console.warn({spellEffectWorkflow, conEffect})

  if (spellEffectWorkflow.hitTargets.size > 0 && spellEffectWorkflow.failedSaves.size > 0) {
    // At least one target has an effect, we can remove the original effect from the caster
    await originEffect.delete();
  }
  else {
    // Remove concentration and the effect causing it since the effect has been used
    conEffect?.delete();
  }
}

