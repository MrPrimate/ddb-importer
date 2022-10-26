export function moonSickleEffect(document) {
  document.effects[0].changes.push(
    {
      key: "system.bonuses.heal.damage",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+ d4",
      priority: "20",
    },
  );

  return document;
}
