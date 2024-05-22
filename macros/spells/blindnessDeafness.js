const lastArg = args[args.length - 1];

if (lastArg.tag === "OnUse") {
  if (lastArg.targets.length < 1) {
    ui.notifications.error("Blindness/Deafness: No target selected: unable to automate effect.");
    return;
  }
  new Dialog({
    title: "Choose an Effect",
    buttons: {
      blind: {
        label: "Blindness",
        callback: () => {
          lastArg.targets.forEach((targetToken) => {
            const targetActor = targetToken.actor;
            DAE.setFlag(targetActor, "DAEBlind", "blind");
            globalThis.DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Blinded", actor: targetActor });
            const changes = [
              {
                key: "ATL.sight.range",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 99,
                value: "0",
              },
            ];
            const effectName = lastArg.itemData.effects[0].name;
            const effect = DDBImporter.EffectHelper.findEffect(targetActor, effectName);
            // console.warn("effect", {effect, effectName});
            effect.update({ changes: changes.concat(effect.changes) });
          });
        },
      },
      deaf: {
        label: "Deafness",
        callback: () => {
          lastArg.targets.forEach((targetToken) => {
            const targetActor = targetToken.actor;
            DAE.setFlag(targetActor, "DAEBlind", "deaf");
            globalThis.DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Deafened", actor: targetActor });
          });
        },
      },
    },
  }).render(true);
}

if (args[0] === "off") {
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  let flag = DAE.getFlag(targetActor, "DAEBlind");
  if (flag === "blind") {
    if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Blinded", targetActor))
      globalThis.DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Blinded", actor: targetActor });
  } else if (flag === "deaf") {
    if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Deafened", targetActor))
      globalThis.DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Deafened", actor: targetActor });
  }
  DAE.unsetFlag(targetActor, "DAEBlind");
}
