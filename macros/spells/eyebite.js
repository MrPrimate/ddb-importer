if (!game.modules.get("dfreds-convenient-effects")?.active) {
  ui.notifications.error("Please enable the CE module");
  return;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;

function effectAppliedAndActive(conditionName) {
  return targetActor.effects.some(
    (activeEffect) =>
      activeEffect?.flags?.isConvenient &&
      activeEffect?.label == conditionName &&
      !activeEffect?.disabled
  );
}

async function eyebite(type) {
  for (let t of game.user.targets) {
    const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${saveData.dc} ${DAEItem?.name || ""}`;
    const saveRoll = await targetActor.rollAbilitySave("wis", { flavor, fastFoward: true });
    if (saveRoll.total < saveData.dc) {
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
      DAE.setFlag(targetActor, "eyebiteSpell", type);
    } else {
      ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll.total}` });
    }
  }
}

function eyebiteDialog() {
  new Dialog({
    title: "Eyebite options",
    content: "<p>Target a token and select the effect</p>",
    buttons: {
      one: {
        label: "Asleep",
        callback: async () => await eyebite("asleep"),
      },
      two: {
        label: "Panicked",
        callback: async () => await eyebite("panicked"),
      },
      three: {
        label: "Sickened",
        callback: async () => await eyebite("sickened"),
      },
    },
  }).render(true);
}

if (args[0] === "on") {
  eyebiteDialog();
  ChatMessage.create({ content: `${targetActor.name} is blessed with Eyebite` });
}

if (args[0] === "each") {
  eyebiteDialog();
}

if (args[0] === "off") {
  const flag = await DAE.getFlag(targetActor, "eyebiteSpell");
  if (flag) {
    if (effectAppliedAndActive(flag, targetActor)) game.dfreds.effectInterface.removeEffect({ effectName: flag, uuid: targetActor.uuid });
    await DAE.unsetFlag(targetActor, "eyebiteSpell");
  }
}
