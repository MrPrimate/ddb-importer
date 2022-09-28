const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const targetType = targetActor.data.type === "npc" ? targetActor.system.details?.type?.value : targetActor.system.details?.race;
const isUndead = targetType.toLowerCase().includes("undead");

if (isUndead) {
  // I decided not to include this macro as not sure how to automate the `against you` part
  // const changes = [
  //   {
  //     key: "flags.midi-qol.disadvantage.attack.all",
  //     mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
  //     priority: 20,
  //     value: "1",
  //   },

  // ];
  // const effect = targetActor.effects.find((e) => e.label === lastArg.efData.label);
  // await effect.update({ changes: changes.concat(effect.changes) });
  ChatMessage.create({ content: `${targetActor.name} is undead and has disadvantage on attack rolls against you until the start of your next turn` });

}

