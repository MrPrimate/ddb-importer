
const rayChoices = DDBImporter.EffectHelper.extractListItems(args[0].itemData.system.description.value);
const workflow = args[0].workflow;

function confusionRayEffect(document) {
  let effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
  effect.changes.push(
    { key: "system.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "* 0", priority: "20" },
    {
      key: "macro.CE",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Reaction",
      priority: "20"
    },
  );
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEnd"]);
  effect.duration.rounds = 2;
  effect.duration.seconds = 12;

  document.effects.push(effect);
}

function slowingRayEffect(document, dc, saveAbility) {
  let effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
  effect.changes.push(
    { key: "system.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "/2", priority: "20" },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=end,label=Slow Ray (End of Turn),saveRemove=true,saveDC=${dc},saveAbility=${saveAbility},killAnim=true`,
      priority: "20"
    },
    {
      key: "macro.CE",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Reaction",
      priority: "20"
    },
  );
  effect.duration.seconds = 60;
  document.effects.push(effect);
}

function damageRayEffect(document, nodamageSave = false) {
  const dmg = DDBImporter.EffectHelper.getMonsterFeatureDamage(document.system.description.value, document);

  if (nodamageSave) {
    foundry.utils.setProperty(document, "flags.midiProperties.saveDamage", "nodam");
  } else {
    foundry.utils.setProperty(document, "flags.midiProperties.saveDamage", "halfdam");
    foundry.utils.setProperty(document, "flags.midiProperties.halfdam", true);
  }
  foundry.utils.setProperty(document, "flags.midiProperties.magicdam", true);

  if (dmg) {
    document.system.damage.parts = dmg.parts;
  }
}


function DisintegrationRayEffect(document) {

}

function telekineticRayEffect(document) {
  const effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
  DDBImporter.EffectHelper.addStatusEffectChange(effect, "Restrained");
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
  effect.duration.rounds = 2;
  effect.duration.seconds = 12;
  document.effects.push(effect);
}

async function sleepRayEffect(document) {
  await DDBImporter.lib.DDBMacros.setItemMacroFlag(document, "monsterFeature", "sleep.js");
  DDBImporter.lib.DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "sleep.js", ["postActiveEffects"]);
}

async function petrificationRayEffect(document) {
  const effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
  await DDBImporter.lib.DDBMacros.setItemMacroFlag(document, "monsterFeature", "petrification.js");
  effect.changes.push(DDBImporter.lib.DDBMacros.generateMacroChange({ macroType: "monsterFeature", macroName: "petrification.js" }));
  effect.duration.rounds = 2;
  effect.duration.seconds = 12;
  foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "endEveryTurn");
  document.effects.push(effect);
}

async function attackWithRay(documentData, target) {
  // console.warn("ATTACK RAY", {
  //   documentData: foundry.utils.deepClone(documentData),
  // })
  const rayItem = new CONFIG.Item.documentClass(documentData, { parent: workflow.actor });
  const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targets: (target?.uuid ? [ target.uuid ] : args[0].targetUuids) });

  // console.warn("Midi Options Final", {
  //   documentData,
  //   options,
  //   rayItem,
  //   target,
  // });
  return await MidiQOL.completeItemUse(rayItem, config, options);
}

async function createBaseRay(rayName, { description, saveAbility = "", saveDC = null }) {
  const rayData = foundry.utils.duplicate(workflow.item);
  delete rayData.effects;
  delete rayData._id;
  delete rayData.flags["midi-qol"].onUseMacroName;
  delete rayData.flags["midi-qol"].onUseMacroParts;
  if (foundry.utils.hasProperty(rayData, "flags.itemacro")) delete rayData.flags.itemacro;
  if (foundry.utils.hasProperty(rayData, "flags.dae.macro")) delete rayData.flags.dae.macro;
  rayData.name = rayName;
  rayData.system.save.ability = saveAbility;
  rayData.system.description.value = description;
  rayData.system.description.chat = "";
  rayData.system.duration.units = "inst";
  rayData.effects = [];

  const overTimeEffects = DDBImporter.EffectHelper.generateOverTimeEffect(workflow.actor, rayData);

  if (rayName === "Slowing Ray") {
    slowingRayEffect(rayData, saveDC, saveAbility);
  } else if (["Enervation Ray", "Wounding Ray"].includes(rayName)) {
    damageRayEffect(rayData, false);
  } else if (["Disintegration Ray", "Death Ray"].includes(rayName)) {
    damageRayEffect(rayData, true);
  } else if (rayName === "Telekinetic Ray") {
    telekineticRayEffect(rayData);
  } else if (rayName === "Sleep Ray") {
    await sleepRayEffect(rayData);
  } else if (rayName === "Petrification Ray") {
    await petrificationRayEffect(rayData);
  } else if (rayName === "Confusion Ray") {
    confusionRayEffect(rayData);
  }

  console.warn("Base Ray", {
    rayData,
    overTimeEffects,
    lastArg: args[0],
    workflow,
  });
  return rayData;
}


// number: index + 1,
// title: title.textContent,
// content: content.innerHTML ?? content.wholeText ?? content.textContent,
// full: item.innerHTML,


async function getRandomRayNumber() {
  const roll = new Roll(`1d${rayChoices.length}`);
  await roll.evaluate({ async: true });
  return roll.total;
}

async function randomRayButtonCallback(results, _html) {
  const num = await getRandomRayNumber();
  results.results[1] = num;
  return results;
}

const results = [];
for (const target of args[0].targets) {

  const rayChooser = await DDBImporter.DialogHelper.ChooserDialog.Ask(
    [{
      type: "label",
      label: `Ray for ${target.name}`,
      },
      {
      type: 'select',
      label: 'Choose a ray...',
      options: rayChoices.map((t) => ({ label: `${t.number} - ${t.title}`, value: t.number })),
    }],
    [{
      label: "Select",
      value: "choice",
    }, {
      label: "Random",
      value: "random",
      callback: randomRayButtonCallback,
    }, {
      label: "Cancel",
      value: "cancel",
    }],
    {
      title: 'Eye Rays',
      options: {
        width: 450,
        height: "auto",
      },
      defaultButton: "Random",
    }
  );


  // console.warn(rayChooser);

  if (!rayChooser.success) continue;

  const rayChoice = rayChoices.find((r) => r.number === rayChooser.results[1]);

  if (!rayChoice) {
    console.warn("Unable to determine Ray Choice", { rayChooser, rayChoices, target });
    continue;
  }

  let save = rayChoice.content.match(/DC (?<dc>[0-9]+) (?<ability>.*?) saving throw|\(save DC (?<dc_only>[0-9]+)\)/);

  if (!save) {
    save = rayChoice.content.match(/\[\/save (?<ability>\w+) (?<dc>\d\d)/);
  }

  // console.warn("SAVE", save);

  const ray = await createBaseRay(rayChoice.title, {
    description: rayChoice.full,
    saveAbility: save && save.groups["ability"] ? save.groups["ability"].toLowerCase().substr(0, 3) : "",
    saveDC: save && save.groups["dc"]
      ? save.groups["dc"]
      : save && save.groups["dc_only"]
         ? save.groups["dc_only"]
         : "",
    target,
  });


  results.push(await attackWithRay(ray, target));
}

return results;
