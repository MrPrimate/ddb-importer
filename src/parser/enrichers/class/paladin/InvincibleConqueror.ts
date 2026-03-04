import Generic from "../Generic";

export default class InvincibleConqueror extends Generic {

  get effects(): IDDBEffectHint[] {
    const damageChanges = Generic.allDamageTypes().map((damage) => {
      return Generic.ChangeHelper.damageResistanceChange(damage);
    });
    return [
      {
        changes: [
          Generic.ChangeHelper.downgradeChange("19", 20, "flags.dnd5e.weaponCriticalThreshold"),
          ...damageChanges,
        ],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
