export function entangleEffect(document) {

  document.effect[0].changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "You can take an action to break free by rolling a Strength Ability Check",
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `turn=end, rollType=check, actionSave=true, saveAbility=str, saveDC=@attributes.spelldc, label=Restrained by ${document.name}`,
      priority: "20",
    },
  );

  foundry.utils.setProperty(document.effect[0], "duration.seconds", 60);
  foundry.utils.setProperty(document.effect[0], "duration.rounds", 10);
  foundry.utils.setProperty(document.effect[0], "flags.dae.stackable", "noneName");

  return document;
}
