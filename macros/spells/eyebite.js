if (!game.modules.get("dfreds-convenient-effects")?.active) {
  ui.notifications.error("Please enable the CE module");
  return;
}

const lastArg = args[args.length - 1];

const DAEItem = lastArg.efData.flags.dae.itemData;

// console.warn("Details", {
//   args,
//   lastArg,
//   actor,
//   token,
//   DAEItem
// })

const EFFECT_LOOKUP = {
  "asleep": ["Unconscious"],
  "panicked": ["Frightened"],
  "sickened": ["Poisoned"],
};

async function eyebite(type, dc, targetActor) {
  const flavor = `${CONFIG.DND5E.abilities["wis"].label} DC${dc} ${DAEItem?.name || ""}`;
  const saveRoll = await targetActor.rollAbilitySave("wis", { flavor, fastForward: true });
  if (dc > saveRoll.total) {
    ChatMessage.create({ content: `${targetActor.name} failed the save with a ${saveRoll.total}` });
    const conditions = EFFECT_LOOKUP[type];
    conditions.forEach((condition) => {
      game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: targetActor.uuid, origin: lastArg.origin });
    })
    DAE.setFlag(targetActor, "eyebiteSpell", { conditions, dc, origin: lastArg.origin });
  } else {
    ChatMessage.create({ content: `${targetActor.name} passed the save with a ${saveRoll.total}` });
  }
}

async function eyebiteDialog(userId, dc, targetActor) {
  const type = await DDBImporter.DialogHelper.AskUserButtonDialog(userId, {
    buttons: [
      { label: "Asleep", value: "asleep" },
      { label: "Panicked", value: "panicked" },
      { label: "Sickened", value: "sickened" },
    ],
    title: DAEItem.name ?? "Eyebite",
    content: `<p>Choose effect for ${DAEItem.name} target</p>`,
  },
  'column');

  if (!type) return;

  await eyebite(type, dc, targetActor);
}

async function getTarget(userId, ignoreInitial = false) {
  if (game.users.get(userId).targets.size === 1 && !ignoreInitial) {
    return game.users.get(userId).targets.toObject()[0];
  } else {
    const result = await DDBImporter.DialogHelper.AskUserButtonDialog(userId, {
      buttons: [
        { label: "I have targeted", value: true },
        { label: "Cancel", value: false },
      ],
      title: DAEItem.name ?? "Eyebite",
      content: `<p>Choose a single target for ${DAEItem.name}</p>`,
    },
    'column');
    if (result && game.users.get(userId).targets.size === 1) {
      return game.users.get(userId).targets.toObject()[0];
    } else if (result && getDamageImmunities.targets.size !== 0) {
      return getTarget(userId, ignoreInitial);
    } else {
      return undefined;
    }
  }
}

if (args[0] === "on") {
  const saveData = deepClone(DAEItem.system.save);
  if (saveData.scaling === "spell") {
    const rollData = actor.getRollData();
    saveData.dc = rollData.attributes.spelldc;
  }

  const target = await getTarget(game.userId, false);

  if (!target) return;

  await eyebiteDialog(game.userId, saveData.dc, target.actor);
  ChatMessage.create({ content: `${target.name} is blessed with Eyebite` });

  const options = {
    userId: game.userId,
  };

  DAE.setFlag(actor, "eyebiteSpell", options);
} else if (args[0] === "each") {
  const flag = DAE.getFlag(actor, "eyebiteSpell");
  const userId = flag.userId ?? game.userId;

  const again = await DDBImporter.DialogHelper.AskUserButtonDialog(userId, {
    buttons: [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ],
    title: DAEItem.name ?? "Eyebite",
    content: `<p>Would you like to use your action to use ${DAEItem.name} again?</p>`,
  },
  'column');

  if (!again) return;
  const target = await getTarget(userId, true);
  if (!target) return;

  await eyebiteDialog(userId, flag.dc, target.actor);
}

else if (args[0] === "off") {
  game.canvas.tokens.placeables.forEach((t) => {
    const effects = DDBImporter.EffectHelper.getActorEffects(t.actor)
      .filter((e => e.origin === lastArg.origin));
    if (effects.length > 0) {
      const flag = DAE.getFlag(t.actor, "eyebiteSpell") ?? { conditions: [] };
      flag.conditions.forEach((condition) => {
        if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, t.actor)) {
          game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: t.actor.uuid });
        }
      });
      DAE.unsetFlag(actor, "eyebiteSpell");
    }
  });
  await DAE.unsetFlag(actor, "eyebiteSpell");
}


// game.canvas.tokens.placeables.forEach((t) => {
//   const effects = DDBImporter.EffectHelper.getActorEffects(t.actor)
//     .filter((e => e.origin === "Scene.UhmG3IpACRTbmGYN.Token.0Gv1q5oVLBVGtrDY.Actor.Cm0OMSdwV96NTOi7.Item.zDjWKeq9XeN91mMc"));
//   console.warn(effects)
//   effects.forEach(effect => {
//     const flag = DAE.getFlag(t.actor, "eyebiteSpell") ?? { conditions: [] };
//     console.warn(flag);
//     console.warn(t.actor.uuid)
//     flag.conditions.forEach((condition) => {
//       const check = DDBImporter.EffectHelper.isEffectConditionEffectAppliedAndActive(condition,effect);
//       console.warn(check)
//       if (check) {
//           console.warn("removing")
//         game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: t.actor.uuid });
//       }
//     });
//   });
// });
