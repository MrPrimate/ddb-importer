
// console.warn("Warding Bond", { args, targetActor, item, actor, tokenOrActor, scope });

async function wardingBondCasterEffect(caster, targetActor, spell) {
  const effectData = {
    name: `${spell.name}: ${targetActor.name}`,
    {
      WardingBondOrigin: spell.uuid,
    },
    duration: {
      seconds: 3600,
    },
    origin: spell.uuid,
    img: spell.img,
  };
  // console.warn("wardingBondCasterEffect", { caster, targetActor, spell, effectData });
  const effects = await caster.createEmbeddedDocuments("ActiveEffect", [effectData]);
  return effects;
}

async function onCast({
  targetActor,
  item,
} = {}) {
  await DDBImporter.EffectHelper.setFlag(targetActor, "WardingBondIds", {
    targetID: targetActor.id,
    targetUuid: targetActor.uuid,
    casterID: item.parent.id,
    casterUuid: item.parent.uuid,
    originUuid: item.uuid,
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
}

async function transferEffect({
  targetActor, effects,
} = {}) {
  console.warn("transferEffect", { targetActor, effects });
  await globalThis.DDBImporter.socket.executeAsGM("createEffects", {
    actorUuid: targetActor.uuid,
    effects,
  });
}

async function unsetFlags({ targetActor, casterActor } = {}) {
  await DDBImporter.EffectHelper.unsetFlag(targetActor, "WardingBondIds");
  await DDBImporter.EffectHelper.unsetFlag(casterActor, "WardingBondTargets");
}

async function checkForExistingBond({ targetActor, casterActor } = {}) {
  const casterFlag = await DDBImporter.EffectHelper.getFlag(casterActor, "WardingBondTargets");

  if (casterFlag) {
    await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
      effectsToDelete: casterFlag.casterEffectUuids ?? [],
    });

    // remove old target effects
    const target = await fromUuid(casterFlag.targetUuid);
    if (target) {
      const targetEffects = target.effects.filter((e) => e.origin === casterFlag.originUuid);

      // console.warn("checkForExistingBond", { target, targetEffects });

      await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
        effectsToDelete: targetEffects.map((e) => e.uuid),
      });
    }
  }

  await unsetFlags({ targetActor, casterActor });

}

if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  console.warn({scope, origin, item, token, actor});

  if (!scope.targetUuids.length === 0) {
    ui.notifications.error("You must have a token targeted.");
    return;
  }

  const target = await fromUuid(scope.targetUuids[0]);

  await checkForExistingBond({ targetActor: target.actor, casterActor: item.parent });

  await transferEffect({
    targetActor: target.actor,
    effects: origin.applicableEffects.map((e) => {
      const ef = e.toObject()
      ef.origin = item.uuid;
      return ef;
    }),
  });

  await onCast({
    targetActor: target.actor,
    item,
  });
}
