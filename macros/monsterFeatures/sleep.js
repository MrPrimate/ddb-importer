const lastArg = args[args.length - 1];
const gameRound = game.combat ? game.combat.round : 0;

for (const target of lastArg.targets) {

  const targetRaceOrType = DDBImporter.EffectHelper.getRaceOrType(target.actor);
  const immuneType = ["undead", "construct", "elf", "half-elf"].some((race) => targetRaceOrType.includes(race));
  const immuneCI = target.actor.system.traits.ci.custom.includes("Sleep");
  if (immuneType || immuneCI) return;

  const effectData = {
    label: "Sleep Ray",
    name: "Sleep Ray",
    img: "icons/svg/sleep.svg",
    origin: args[0].uuid,
    disabled: false,
    duration: { rounds: 10, seconds: 60, startRound: gameRound, startTime: game.time.worldTime },
    flags: { dae: { specialDuration: ["isDamaged"] } },
    changes: [
      DDBImporter.EffectHelper.generateStatusEffectChange("Unconscious", 20),
    ]
  };

  await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });

}
