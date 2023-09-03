if (!game.modules.get("dfreds-convenient-effects")?.active) {
  ui.notifications.error("Please enable the CE module");
  return;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;

function effectAppliedAndActive(conditionName) {
  return targetActor.effects.some(
    (activeEffect) =>
      activeEffect?.flags?.isConvenient &&
      (activeEffect?.name ?? activeEffect?.label) == conditionName &&
      !activeEffect?.disabled
  );
}

async function eyebite(type, dc) {
  for (let t of game.user.targets) {
    const flavor = `${CONFIG.DND5E.abilities["wis"].label} DC${dc} ${DAEItem?.name || ""}`;
    const saveRoll = await targetActor.rollAbilitySave("wis", { flavor, fastFoward: true });
    if (saveRoll.total < dc) {
      ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll.total}` });
      switch (type) {
        case "asleep":
          game.dfreds.effectInterface.addEffect({ effectName: "Unconscious", uuid: t.actor.uuid });
          break;
        case "panicked":
          game.dfreds.effectInterface.addEffect({ effectName: "Frightened", uuid: t.actor.uuid });
          break;
        case "sickened":
          game.dfreds.effectInterface.addEffect({ effectName: "Poisoned", uuid: t.actor.uuid });
          break;
        // no default
      }
      DAE.setFlag(targetActor, "eyebiteSpell", { type, dc });
    } else {
      ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll.total}` });
    }
  }
}

function eyebiteDialog(dc) {
  new Dialog({
    title: "Eyebite options",
    content: "<p>Target a token and select the effect</p>",
    buttons: {
      one: {
        label: "Asleep",
        callback: async () => await eyebite("asleep", dc),
      },
      two: {
        label: "Panicked",
        callback: async () => await eyebite("panicked", dc),
      },
      three: {
        label: "Sickened",
        callback: async () => await eyebite("sickened", dc),
      },
    },
  }).render(true);
}

if (args[0] === "on") {
  const saveData = DAEItem.system.save;
  if (saveData.scaling === "spell") {
    const rollData = actor.getRollData();
    saveData.dc = rollData.attributes.spelldc;
  }
  eyebiteDialog(saveData.dc);
  ChatMessage.create({ content: `${targetActor.name} is blessed with Eyebite` });
}

if (args[0] === "each") {
  const flag = DAE.getFlag(targetActor, "eyebiteSpell");
  eyebiteDialog(flag.dc);
}

if (args[0] === "off") {
  const flag = await DAE.getFlag(targetActor, "eyebiteSpell");
  if (flag) {
    if (effectAppliedAndActive(flag.type, targetActor)) game.dfreds.effectInterface.removeEffect({ effectName: flag.type, uuid: targetActor.uuid });
    await DAE.unsetFlag(targetActor, "eyebiteSpell");
  }
}
