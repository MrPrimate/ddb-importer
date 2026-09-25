if (args[0] === "each") {

  const lastArg = args[args.length - 1];
  const effectData = {
    system: {
      changes: [
        {
          key: "flags.midi-qol.grants.disadvantage.attack.all",
          type: "add",
          value: 1,
          priority: 20,
        },
      ],
    },
    origin: lastArg.origin,
    disabled: false,
    img: lastArg.efData.img,
    name: `Cloak of Displacement - Enforced Disadvantage`,
    // "until the start of your next turn" - native sourceStart expiry; isDamaged stays DAE-only
    duration: {
      value: null,
      expiry: "sourceStart",
    },
  };
  foundry.utils.setProperty(effectData, "flags.dae.specialDuration", ["isDamaged", "turnStartSource"]);
  foundry.utils.setProperty(effectData, "flags.dae.showIcon", true);
  await lastArg.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

}
