const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const DAEItem = lastArg.efData.flags.dae.itemData;

console.warn("2024", {
  item,
  scope,
  args,
});

/**
 * Generates the GM client dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
 */
async function applyContagion() {
  if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Poisoned", targetActor))
    DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Poisoned", actor: targetActor });


  const buttons = {};

  for (const [key, data] of Object.entries(CONFIG.DND5e.abilities)) {
    buttons[key] = {
      label: data.label,
      callback: async () => {
        let effect = {
          changes: [
            {
              key: `flags.midi-qol.disadvantage.ability.save.${key}`,
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 20,
              value: "1",
            },
          ],
          img: data.icon,
          name: data.label,
          _id: lastArg.effectId,
        };
        targetActor.updateEmbeddedDocuments("ActiveEffect", [effect]);
      },
    };
  }

  new Dialog({
    title: "Contagion options",
    content: "<p>Select the effect</p>",
    buttons,
  }).render(true);
}

/**
 * Execute contagion effects, update flag counts or remove effect
 */
async function contagionSave() {
  const flag = DAE.getFlag(targetActor, "ContagionSpell");
  const flavor = `${CONFIG.DND5E.abilities["con"].label} DC${flag.saveDC} ${item?.name || ""}`;
  const saveRoll = await targetActor.rollAbilitySave("con", { flavor });

  if (saveRoll.total < flag.saveDC) {
    if (flag.count === 2) {
      ChatMessage.create({ content: `Contagion on ${targetActor.name} is complete` });
      applyContagion();
    } else {
      const contagionCount = flag.count + 1;
      DAE.setFlag(targetActor, "ContagionSpell", { count: contagionCount });
      console.log(`Contagion increased to ${contagionCount}`);
    }
  } else if (saveRoll.total >= flag.saveDC) {
    targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
  }
}

if (args[0] === "on") {
  console.warn({
    args,
    scope,
    DAEItem,
  });
  const saveData = DAEItem.system.save;
  if (saveData.scaling === "spell") {
    const rollData = actor.getRollData();
    saveData.dc = rollData.attributes.spelldc;
  }
  // Save the hook data for later access.
  DAE.setFlag(targetActor, "ContagionSpell", { count: 0, saveDC: saveData.dc });
}

if (args[0] === "off") {
  // When off, clean up hooks and flags.
  DAE.unsetFlag(targetActor, "ContagionSpell");
}

if (args[0] === "each") {
  let contagion = lastArg.efData;
  if (contagion.name === "Contagion") contagionSave();
}
