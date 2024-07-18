console.warn("Macro call", args)

const lastArg = args[args.length - 1];
const gameRound = game.combat ? game.combat.round : 0;

const effectData = {
  label: "Zephyr Strike: Speed",
  name: "Zephyr Strike: Speed",
  img: lastArg.itemData.img,
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
  flags: { dae: { specialDuration: ["turnEndSource"] } },
};

ChatMessage.create({ content: `${lastArg.actor.name} gains 30ft of movement until the end of their turn` });

await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: lastArg.actorUuid, effects: [effectData] });
