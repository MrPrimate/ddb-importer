if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  return;
}

try {
  if (!["mwak"].includes(args[0].item.system.actionType)) return {};
  if (args[0].hitTargetUuids.length === 0) return {}; // did not hit anyone
  for (let tokenUuid of args[0].hitTargetUuids) {
    const target = await fromUuid(tokenUuid);
    const targetActor = target.actor;
    if (!targetActor) continue;
    const spellDC = actor.flags["midi-qol"].thunderousSmite.dc;
    ChatMessage.create({ content: `${targetActor.name} needs to make a ${CONFIG.DND5E.abilities["str"].label} DC${spellDC} vs Thunderous Smite Stagger.` });

    const saveRollData =  {
      request: "save",
      targetUuid: target.actor.uuid,
      ability: "str",
      options: {
        chatMessage: true,
        flavor: `${CONFIG.DND5E.abilities["str"].label} DC${spellDC} vs Thunderous Smite Stagger`,
      },
    };

    // const saveRoll = await targetActor.rollAbilitySave("str", { flavor });
    const saveRoll = await MidiQOL.socket().executeAsGM("rollAbility", saveRollData);

    if (saveRoll.total < spellDC) {
      await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Prone", actor: targetActor });
      ChatMessage.create({ content: `${targetActor.name} has failed the save and is pushed back 10ft and knocked prone.` });
    }
  }
  Hooks.once("midi-qol.RollComplete", (workflow) => {
    console.log("Deleting concentration");
    const effect = MidiQOL.getConcentrationEffect(actor);
    if (effect) effect.delete();
    return true;
  });
  const workflow = args[0].workflow;
  const rollOptions = {
    critical: workflow.isCritical,
    criticalMultiplier: workflow.damageRoll?.options?.criticalMultiplier,
    powerfulCritical: workflow.damageRoll?.options?.powerfulCritical,
    multiplyNumeric: workflow.damageRoll?.options?.multiplyNumeric,
  };
  const damageFormula = new CONFIG.Dice.DamageRoll(`2d6[thunder]`, {}, rollOptions);
  return { damageRoll: damageFormula.formula, flavor: "Thunderous Smite" };
} catch (err) {
  console.error(`${args[0].itemData.name} - Thunderous Smite`, err);
}


