if (args[0] === "each") {

  const lastArg = args[args.length - 1];
  const effectData = {
    changes: [
      {
        key: "flags.midi-qol.grants.disadvantage.attack.all ",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: 1,
        priority: 20,
      },
    ],
    origin: lastArg.origin,
    disabled: false,
    img: lastArg.efData.icon,
    label: `Cloak of Displacement - Enforced Disadvantage`,
    name: `Cloak of Displacement - Enforced Disadvantage`,
  };
  foundry.utils.setProperty(effectData, "flags.dae.specialDuration", ["isDamaged", "turnStartSource"]);
  foundry.utils.setProperty(effectData, "flags.dae.showIcon", true);
  await lastArg.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

}
