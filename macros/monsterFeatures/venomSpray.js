const damage = (await new CONFIG.Dice.DamageRoll("2d6[slashing]").evaluate()).total;
await MidiQOL.applyTokenDamage(
  [
    {
      damage,
      type: "slashing",
    },
  ],
  damage,
  new Set([token]),
  null,
  null
);
