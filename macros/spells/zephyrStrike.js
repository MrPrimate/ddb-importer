const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const gameRound = game.combat ? game.combat.round : 0;

const effectData = {
  label: "Zephyr Strike: Speed",
  icon: lastArg.itemData.img,
  origin: lastArg.uuid,
  disabled: false,
  duration: { round: 1, startRound: gameRound, startTime: game.time.worldTime },
  changes: [
    {
      key: "system.attributes.movement.all",
      value: "+ 30",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  ],
};

ChatMessage.create({ content: `${targetActor.name} gains 30ft of movement until the end of their turn` });

await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
