console.warn(args)

const rayChoices = DDBImporter.EffectHelper.extractListItems(args[0].itemData.system.description.value);
const workflow = args[0].workflow;


function slowRayEffect(document, dc, saveAbility) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "/2", priority: "20" },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=end,label=Slow Ray (End of Turn),saveRemove=true,saveDC=${dc},saveAbility=${saveAbility},killAnim=true`,
      priority: "20"
    },
  );
  effect.duration.seconds = 60;
  document.effects.push(effect);
}

function damageRayEffect(document) {
  const dmg = DDBImporter.EffectHelper.getOvertimeDamage(document.system.description.value);

  if (!dmg) return;

  setProperty(document, "flags.midiProperties.fulldam", false);

  // const damage = dmg.parts.reduce((total, current) => {
  //     total = [total, `${current[0]}[${current[1]}]`].join(" + ");
  //     return total;
  //   }, "");
  // const damageType =  dmg.parts.length > 0 ? dmg.parts[0][1] : "";

  document.system.damage.parts = dmg.parts;
}

function telekineticRayEffect(document) {
  const effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
  effect.changes.push(DDBImporter.EffectHelper.generateStatusEffectChange("Restrained"));
  setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
  effect.duration.rounds = 2;
  effect.duration.seconds = 12;
  document.effects.push(effect);
}

async function sleepRayEffect(document) {

  // const effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
//   const macroText = `
// const lastArg = args[args.length - 1];
// const tokenOrActor = await fromUuid(lastArg.actorUuid);
// const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
// const targetRaceOrType = DDBImporter.EffectHelper.getRaceOrType(findTarget.actor);
// const immuneType = ["undead", "construct", "elf", "half-elf"].some((race) => targetRaceOrType.includes(race));
// const immuneCI = findTarget.actor.system.traits.ci.custom.includes("Sleep");

// if (immuneType || immuneCI) return;

// const effectData = {
//   label: "Sleep Ray",
//   name: "Sleep Ray",
//   icon: "icons/svg/sleep.svg",
//   origin: args[0].uuid,
//   disabled: false,
//   duration: { rounds: 10, seconds: 60, startRound: gameRound, startTime: game.time.worldTime },
//   flags: { dae: { specialDuration: ["isDamaged"] } },
//   changes: [
//     { key: "macro.CE", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Unconscious", priority: 20 },
//   ]
// };

// await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
// `;

  // await DDBImporter.lib.DDBMacros.generateItemMacroFlag(document, macroText);

  // effect.changes.push({
  //   key: "macro.itemMacro",
  //   value: "",
  //   mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
  //   priority: priority,
  // });

  await DDBImporter.lib.DDBMacros.setItemMacroFlag(document, "monsterFeature", "sleep.js");
  DDBImporter.lib.DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "sleep.js", ["postActiveEffects"]);

  // effect.duration.seconds = 60;
  // document.effects.push(effect);
}

async function petrificationRayEffect(document) {
  const effect = DDBImporter.EffectHelper.baseEffect(document, document.name, { transfer: false, disabled: false });
  await DDBImporter.lib.DDBMacros.setItemMacroFlag(document, "monsterFeature", "petrification.js");
  effect.changes.push(DDBImporter.lib.DDBMacros.generateMacroChange({ macroType: "monsterFeature", macroName: "petrification.js" }));
  effect.duration.rounds = 2;
  effect.duration.seconds = 12;
  setProperty(effect, "flags.dae.macroRepeat", "endEveryTurn");
  document.effects.push(effect);
}

async function attackWithRay(documentData) {
  const rayItem = new CONFIG.Item.documentClass(documentData, { parent: workflow.actor });
  const workflowOptions = {
    showFullCard: false,
    createWorkflow: true,
    targetUuids: args[0].targetUuids,
    configureDialog: false,
    versatile: false,
    consumeResource: false,
    consumeSlot: false,
  };

  console.warn("Midi Options", {
    documentData,
    workflowOptions,
    rayItem,
  });
  return await MidiQOL.completeItemUse(rayItem, {}, workflowOptions);
}

async function createBaseRay(rayName, { description, saveAbility = "", saveDC = null }) {
  const rayData = duplicate(workflow.item);
  delete rayData.effects;
  delete rayData._id;
  delete rayData.flags["midi-qol"].onUseMacroName;
  delete rayData.flags["midi-qol"].onUseMacroParts;
  if (hasProperty(rayData, "flags.itemacro")) delete rayData.flags.itemacro;
  if (hasProperty(rayData, "flags.dae.macro")) delete rayData.flags.dae.macro;
  rayData.name = rayName;
  rayData.system.save.ability = saveAbility;
  rayData.system.description.value = description;
  rayData.system.description.chat = "";
  rayData.system.duration.units = "inst";
  rayData.effects = [];

  const overTimeEffects = DDBImporter.EffectHelper.generateOverTimeEffect(workflow.actor, rayData);

  if (rayName === "Slow Ray") {
    slowRayEffect(rayData, saveDC, saveAbility);
  } else if (["Enervation Ray", "Disintegration Ray", "Death Ray"].includes(rayName)) {
    damageRayEffect(rayData);
  } else if (rayName === "Telekinetic Ray") {
    telekineticRayEffect(rayData);
  } else if (rayName === "Sleep Ray") {
    await sleepRayEffect(rayData);
  } else if (rayName === "Petrification Ray") {
    await petrificationRayEffect(rayData);
  }

  console.warn("Midi Options", {
    rayData,
    overTimeEffects,
    lastArg: args[0],
    workflow,
  });
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
  results.results[0] = num;
  return results;
}

const rayChooser = await DDBImporter.DialogHelper.ChooserDialog.Ask(
  [{
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


console.warn(rayChooser);

if (!rayChooser.success) return;

const rayChoice = rayChoices.find((r) => r.number === rayChooser.results[0]);

if (!rayChoice) {
  console.warn("Unable to determine Ray Choice", { rayChooser, rayChoices });
  return;
}


const save = rayChoice.content.match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);

const ray = await createBaseRay(rayChoice.title, {
  description: rayChoice.content,
  saveAbility: save && save[2] ? save[2].toLowerCase().substr(0, 3) : "",
  saveDC: save ? save[1] : "",
});


return attackWithRay(ray);
