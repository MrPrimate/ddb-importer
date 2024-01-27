const lastArg = args[args.length - 1];

async function updateActor(kind, targetActor) {
  DAE.setFlag(targetActor, 'enhanceAbility', { name: kind });
  // const effectName = lastArg.efData.name ?? lastArg.efData.label;
  const effectName = lastArg.itemData.effects[0].name;
  const effect = DDBImporter.EffectHelper.findEffect(targetActor, effectName);

  // console.warn("update actor", {
  //   kind,
  //   effectName,
  //   effect,
  //   targetActor,
  // })
  let changes = [];
  switch (kind) {
    case "bear": {
      changes = [{
        key: "flags.midi-qol.advantage.ability.save.con",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      }];
      ChatMessage.create({ content: `${targetActor.name} has advantage on Constitution checks` });
      const amount = await new CONFIG.Dice.DamageRoll("2d6").evaluate({ async: true });
      console.warn(amount);
      if (
        !Number.isInteger(targetActor.system.attributes.hp.temp)
        || amount.total > targetActor.system.attributes.hp.temp
      ) {
        console.log(`${targetActor.name} gains ${amount.total} temp Hp`, amount);
        ChatMessage.create({ content: `${targetActor.name} gains ${amount.total} temp Hp` });
        await targetActor.update({ "system.attributes.hp.temp": amount.total });
      }
      break;
    }
    case "bull": {
      changes = [{
        key: "flags.dnd5e.powerfulBuild",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      },
      {
        key: "flags.midi-qol.advantage.ability.check.str",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      }];
      ChatMessage.create({ content: `${targetActor.name}'s encumbrance is doubled` });
      ChatMessage.create({ content: `${targetActor.name} has advantage on Strength checks` });
      break;
    }
    case "cat": {
      changes = [{
        key: "flags.midi-qol.advantage.ability.check.dex",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      }];
      ChatMessage.create({
        content: `${targetActor.name} doesn't take damage from falling 20 feet or less if it isn't incapacitated.`,
      });
      ChatMessage.create({ content: `${targetActor.name} has advantage on Dexterity checks` });
      break;
    }
    case "eagle": {
      changes = [{
        key: "flags.midi-qol.advantage.ability.check.cha",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      }];
      ChatMessage.create({ content: `${targetActor.name} has advantage on Charisma checks` });
      break;
    }
    case "fox": {
      changes = [{
        key: "flags.midi-qol.advantage.ability.check.int",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      }];
      ChatMessage.create({ content: `${targetActor.name} has advantage on Intelligence checks` });
      break;
    }
    case "owl": {
      changes = [{
        key: "flags.midi-qol.advantage.ability.check.wis",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
        value: "1",
      }];
      ChatMessage.create({ content: `${targetActor.name} has advantage on Wisdom checks` });
      break;
    }
  }
  if (changes.length > 0) {
    console.log(`Applying ${kind} changes to ${targetActor.name}`, changes);
    await effect.update({ changes: changes.concat(effect.changes) });
  }

}

/**
 * For each target select the effect (GM selection)
 */
if (lastArg.tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {
  if (lastArg.targets.length < 1) {
    ui.notifications.error("Enhance Ability: No target selected: unable to automate effect.");
    return;
  }
  for (const target of lastArg.targets) {
    await new Dialog({
      title: "Choose Enhance Ability option for " + target.name,
      content: "<p>Choose option</p>",
      buttons: {
        one: {
          label: "Bear's Endurance",
          callback: async () => await updateActor("bear", target.actor),
        },
        two: {
          label: "Bull's Strength",
          callback: async () => await updateActor("bull", target.actor),
        },
        three: {
          label: "Cat's Grace",
          callback: async () => await updateActor("cat", target.actor),
        },
        four: {
          label: "Eagle's Splendor",
          callback: async () => await updateActor("eagle", target.actor),
        },
        five: {
          label: "Fox's Cunning",
          callback: async () => await updateActor("fox", target.actor),
        },
        six: {
          label: "Owl's Wisdom",
          callback: async () => await updateActor("owl", target.actor),
        },
      },
    }).render(true);
  }
}

if (args[0] === "off") {
  // console.warn("off called", { args, scope })
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const flag = await DAE.getFlag(targetActor, 'enhanceAbility');
  if (flag.name === "bear") {
    await targetActor.update({ "system.attributes.hp.temp": "" });
    await DAE.unsetFlag(targetActor, "enhanceAbility");
  }
  ChatMessage.create({ content: "Enhance Ability has expired" });
}
