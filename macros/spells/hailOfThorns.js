// Based on a macro provided by the delightful @Elwin#1410

// Default name of the item
const DEFAULT_ITEM_NAME = "Hail of Thorns";
// Set to false to remove debug logging
const debug = true;

const dependencies = ["dae", "times-up", "midi-qol"];
if (!DDBImporter?.EffectHelper.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
  return;
}

if (debug) {
  console.error(DEFAULT_ITEM_NAME, arguments);
}

if (args[0].tag !== "OnUse") return;

// due to calling functions macroItem no longer returns the item the macro change was on.
const originDoc = actor.items.find((i) =>
  (i.flags.ddbimporter?.originalName ?? i.name) === DEFAULT_ITEM_NAME
  && i.system.source.rules === "2014",
);

if (args[0].macroPass === "postActiveEffects") {
  if (debug) console.warn("postActiveEffects")

  const macroData = args[0];

  if (macroData.hitTargets.length < 1) {
    // No target hit
    return;
  }

  const activity = macroData.workflow.activity;
  const rangedWeaponAttack = DDBImporter?.EffectHelper.isRangedWeaponAttack({
    activity,
    macroData,
    sourceToken: canvas.tokens?.get(macroData.tokenId),
    targetToken: macroData.hitTargets[0].object,
  });
  if (!rangedWeaponAttack) {
    // Not a ranged weapon attack
    console.info(`Not a ranged weapon attack, ${DEFAULT_ITEM_NAME} skipped.`);
    return;
  }

  const originEffect = actor.effects.find((ef) =>
    originDoc.uuid === foundry.utils.getProperty(ef, "flags.midi-qol.castData.itemUuid"),
  );

  if (!originEffect) {
    console.error(`${DEFAULT_ITEM_NAME}: spell active effect was not found.`);
    return;
  }
  const level = foundry.utils.getProperty(originEffect, "flags.midi-qol.castData.castLevel") ?? 1;
  const nbDice = Math.min(level, 6);

  // Temporary spell data for the burst effect
  const areaSpellData = {
    type: "spell",
    name: `${originDoc.name}: Burst`,
    img: originDoc.img,
    system: originDoc.toObject().system,
  };

  areaSpellData.system.preparation = { mode: "atwill" };

  const newActivities = {};
  for (const [key, activity] of Object.entries(areaSpellData.system.activities)) {
    if (activity.type === "save") {
      activity.damage.parts[0].number = nbDice;
      newActivities[key] = activity;
    }
  }
  areaSpellData.system.activities = newActivities;

  foundry.utils.setProperty(
    areaSpellData,
    "flags.midi-qol.onUseMacroName",
    DDBImporter.lib.DDBMacros.generateMidiOnUseMacroFlagValue("spell", "hailOfThorns.js", ["preItemRoll", "prePreambleComplete", "preActiveEffects"], originDoc.uuid)
  );

  if (game.modules.get("walledtemplates")?.active) {
    foundry.utils.setProperty(areaSpellData, "flags.walledtemplates", {
      wallsBlock: "walled",
      wallRestriction: "move",
    });
  }

  const areaSpell = new CONFIG.Item.documentClass(areaSpellData, {
    parent: actor,
    temporary: true,
  });

  const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({
    targets: [macroData.hitTargetUuids[0]],
    // scaling: areaSpell.system.level - level,
  });
  await MidiQOL.completeItemUse(areaSpell, config, options);

  // Remove concentration and the effect causing it since the effect has been used
  const effect = MidiQOL.getConcentrationEffect(actor, originDoc);
  await effect?.delete();
} else if (args[0].macroPass === "preItemRoll") {
  if (debug) console.warn("preItemRoll")

  const targetToken = workflow.targets.first();
  const gs = canvas?.dimensions?.distance ?? 5;
  const templateOptions = {};
  let targetData = rolledItem.system.target?.template ?? { size: 0 };
  const { width, height } = targetToken.document;
  templateOptions.distance = Number(targetData.size) + (Math.max(width, height, 0) / 2) * gs;

  templateOptions.x = targetToken.center?.x ?? 0;
  templateOptions.y = targetToken.center?.y ?? 0;

  foundry.utils.setProperty(templateOptions, "flags.dnd5e.origin", originDoc.uuid);

  // Prompt for template is false, which disables template placement, auto creation
  // and placement is done in dnd5e.useItem hook instead.
  Hooks.once("dnd5e.useItem", async function (item, config, options, templates) {
    if (item.uuid !== rolledItem.uuid) {
      return;
    }
    const template = game.system.canvas.AbilityTemplate.fromItem(rolledItem, templateOptions);
    const templateData = template.document.toObject();

    const [measuredTemplateDoc] = await canvas?.scene?.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
    if (!measuredTemplateDoc) {
      console.error(`${DEFAULT_ITEM_NAME} | Error could not create template`, templateData);
      return;
    }
    await MidiQOL.addConcentrationDependent(originDoc.actor, measuredTemplateDoc, originDoc);
  });
  return true;
} else if (args[0].macroPass === "preActiveEffects") {
  // Note: update workflow to prevent adding effect to delete template, already handled by concentration
  workflow.template = undefined;
  workflow.templateUuid = undefined;
}
