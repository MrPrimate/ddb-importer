const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

console.warn("Warding Bond", { args, targetActor, item, actor, tokenOrActor, scope });


async function setWardingBondHook(targetActor) {
  const hookId = Hooks.on("preUpdateActor", async (actor, update, options, b) => {
    console.warn("preUpdateActor", { actor, update, hpInUpdate: !(update.system?.attributes?.hp?.value ?? false), options, b });
    if (!(update.system?.attributes?.hp?.value ?? false)) return;
    const targetFlag = DDBImporter.EffectHelper.getFlag(actor, "WardingBondIds");
    const casterFlag = DDBImporter.EffectHelper.getFlag(actor, "WardingBondTargets");

    if (!targetFlag && !casterFlag) return;
    if (targetFlag && targetFlag.targetID !== actor.id) {
      if (!casterFlag || casterFlag.casterID !== actor.id) return;
    }
    if (casterFlag && casterFlag.casterID !== actor.id) {
      if (!targetFlag) return;
    }

    const oldHP = options.dnd5e.hp.value ?? 0 + options.dnd5e.hp.temp ?? 0;
    const newHP = foundry.utils.getProperty(update, "system.attributes.hp.value") ?? 0
      + foundry.utils.getProperty(update, "system.attributes.hp.temp") ?? 0;
    const hpChange = oldHP - newHP;

    // damage applied to caster, evaluate if warding bond remains in effect
    if (casterFlag && actor.id === casterFlag.casterID && newHP <= 0) {
      const targetActor = await fromUuid(casterFlag.targetUuid);
      const effectsToDelete = actor.effects.filter((e) => e.origin === casterFlag.itemUuid).map((t) => t.uuid)
        .concat(targetActor.effects.filter((e) => e.origin === casterFlag.itemUuid).map((t) => t.uuid));
      await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
        effectsToDelete,
      });

      return;
    }

    // damage applied to target, roll against caster
    if (targetFlag && Number.isInteger(hpChange) && hpChange > 0) {
      const caster = await fromUuid(targetFlag.casterUuid);
      await caster.applyDamage(hpChange);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: caster }),
        content: `${caster.name} took ${hpChange} damage from Warding Bond with ${actor.name}`,
      });
    }
  });
  await DDBImporter.EffectHelper.setFlag(targetActor, "WardingBondHook", hookId);
  console.warn("setWardingBondHook", { targetActor, hookId });
}


async function wardingBondCasterEffect(caster, targetActor, spell) {
  const effectData = {
    name: `${spell.name}: ${targetActor.name}`,
    flags: {
      WardingBondOrigin: spell.uuid,
    },
    duration: {
      seconds: 3600,
    },
    origin: spell.uuid,
    img: spell.img,
  };
  console.warn("wardingBondCasterEffect", { caster, targetActor, spell, effectData });
  const effects = await caster.createEmbeddedDocuments("ActiveEffect", [effectData]);
  return effects;
}


if (args[0] === "on") {
  await DDBImporter.EffectHelper.setFlag(targetActor, "WardingBondIds", {
    targetID: targetActor.id,
    targetUuid: targetActor.uuid,
    casterID: item.parent.id,
    casterUuid: item.parent.uuid,
    itemUuid: item.uuid,
  });

  const casterEffects = await wardingBondCasterEffect(item.parent, targetActor, item);
  await DDBImporter.EffectHelper.setFlag(item.parent, "WardingBondTargets", {
    targetID: targetActor.id,
    targetUuid: targetActor.uuid,
    casterID: item.parent.id,
    casterUuid: item.parent.uuid,
    originUuid: item.uuid,
    casterEffectUuids: casterEffects.map((e) => e.uuid),
  });
  // setWardingBondHook(targetActor);
}

if (args[0] === "off") {
  const hookFlag = await DDBImporter.EffectHelper.getFlag(targetActor, "WardingBondHook");
  if (hookFlag) await Hooks.off("preUpdateActor", hookFlag);

  const casterFlag = await DDBImporter.EffectHelper.getFlag(item.parent, "WardingBondTargets");
  await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
    effectsToDelete: casterFlag.casterEffectUuids,
  });
  await DDBImporter.EffectHelper.unsetFlag(targetActor, "WardingBondHook");
  await DDBImporter.EffectHelper.unsetFlag(targetActor, "WardingBondIds");
  await DDBImporter.EffectHelper.unsetFlag(item.parent, "WardingBondTargets");
  console.log("Warding Bond removed");
}
