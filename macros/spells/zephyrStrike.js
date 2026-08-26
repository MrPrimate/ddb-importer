console.warn("Macro call", args)

const lastArg = args[args.length - 1];

const effectData = {
  name: "Zephyr Strike: Speed",
  img: lastArg.itemData.img,
  origin: lastArg.uuid,
  disabled: false,
  duration: { value: null, expiry: "sourceEnd" },
  system: {
    changes: [
      {
        key: "system.attributes.movement.bonus",
        value: "30",
        type: "add",
        priority: 20,
      },
    ],
  },
  flags: { dae: { specialDuration: ["turnEndSource"] } },
};

ChatMessage.create({ content: `${lastArg.actor.name} gains 30ft of movement until the end of their turn` });

await DDBImporter.socket.executeAsGM("createEffects", { actorUuid: lastArg.actorUuid, effects: [effectData] });
