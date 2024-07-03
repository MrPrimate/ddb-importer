// Based on a macro provided by the delightful @Elwin#1410

// Default name of the item
const DEFAULT_ITEM_NAME = "Hail of Thorns";
// Set to false to remove debug logging
const debug = false;

const dependencies = ["dae", "times-up", "midi-qol"];
if (!DDBImporter?.EffectHelper.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
  return;
}

if (debug) {
  console.error(DEFAULT_ITEM_NAME, arguments);
}

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  const macroData = args[0];

  if (macroData.hitTargets.length < 1) {
    // No target hit
    return;
  }
  const rangedWeaponAttack = DDBImporter?.EffectHelper.isRangedWeaponAttack(macroData);
  if (!rangedWeaponAttack) {
    // Not a ranged weapon attack
    return;
  }

  const originEffect = actor.effects.find((ef) => ef.getFlag("midi-qol", "castData.itemUuid") === macroItem.uuid);
  if (!originEffect) {
    console.error(`${DEFAULT_ITEM_NAME}: spell active effect was not found.`);
    return;
  }
  const level = foundry.utils.getProperty(originEffect, "flags.midi-qol.castData.castLevel") ?? 1;
  const nbDice = Math.min(level, 6);

  // Temporary spell data for the burst effect
  const areaSpellData = {
    type: "spell",
    name: `${macroItem.name}: Burst`,
    img: macroItem.img,
    system: {
      level: level,
      activation: { type: "none" },
      target: { value: 5, units: "ft", type: "radius", prompt: false },
      chatFlavor: `[${nbDice}d10 - piercing] Target of the attack and each creature within 5 feet of it`,
      damage: { parts: [[`${nbDice}d10[piercing]`, "piercing"]], versatile: "" },
      actionType: "save",
      save: { ability: "dex" },
      preparation: { mode: "atwill" },
      duration: { units: "inst" },
    },
  };
  foundry.utils.setProperty(
    areaSpellData,
    "flags.midi-qol.onUseMacroName",
    DDBImporter.lib.DDBMacros.generateMidiOnUseMacroFlagValue("spell", "hailOfThorns.js", ["preItemRoll", "prePreambleComplete", "preActiveEffects"], macroItem.uuid)
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
  });
  await MidiQOL.completeItemUse(areaSpell, config, options);

  // Remove concentration and the effect causing it since the effect has been used
  const effect = MidiQOL.getConcentrationEffect(actor, macroItem);
  await effect?.delete();
} else if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {

  const targetToken = workflow.targets.first();
  const gs = canvas?.dimensions?.distance ?? 5;
  const templateOptions = {};
  let targetData = rolledItem.system.target ?? { value: 0 };
  const { width, height } = targetToken.document;
  templateOptions.distance = Number(targetData.value) + (Math.max(width, height, 0) / 2) * gs;

  templateOptions.x = targetToken.center?.x ?? 0;
  templateOptions.y = targetToken.center?.y ?? 0;

  foundry.utils.setProperty(templateOptions, "flags.dnd5e.origin", macroItem.uuid);

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
  });
  return true;
} else if (args[0].tag === "OnUse" && args[0].macroPass === "prePreambleComplete") {
  // Add template to concentration to be auto deleted
  await MidiQOL.addConcentrationDependent(macroItem.actor, workflow.template, macroItem);
} else if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  // Note: update workflow to prevent adding effect to delete template, already handled by concentration
  workflow.template = undefined;
  workflow.templateUuid = undefined;
}
