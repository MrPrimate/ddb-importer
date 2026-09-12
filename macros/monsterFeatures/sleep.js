const lastArg = args[args.length - 1];

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
    duration: { value: 60, units: "seconds", expiry: "turnStart" },
    flags: { dae: { specialDuration: ["isDamaged"] } },
    statuses: ["unconscious"],
  };

  await DDBImporter.socket.executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });

}
