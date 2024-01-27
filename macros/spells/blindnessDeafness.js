if (!game.modules.get("dfreds-convenient-effects")?.active) {
  ui.notifications.error("Please enable the CE module");
  return;
}

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
            game.dfreds.effectInterface.addEffect({ effectName: "Blinded", uuid: targetActor.uuid });
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
            game.dfreds.effectInterface.addEffect({ effectName: "Deafened", uuid: targetActor.uuid });
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
    if (DDBImporter.EffectHelper.effectConditionAppliedAndActive("Blinded", targetActor))
      game.dfreds.effectInterface.removeEffect({ effectName: "Blinded", uuid: targetActor.uuid });
  } else if (flag === "deaf") {
    if (DDBImporter.EffectHelper.effectConditionAppliedAndActive("Deafened", targetActor))
      game.dfreds.effectInterface.removeEffect({ effectName: "Deafened", uuid: targetActor.uuid });
  }
  DAE.unsetFlag(targetActor, "DAEBlind");
}
