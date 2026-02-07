/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class InvincibleConqueror extends Generic {

  get effects() {
    const damageChanges = Generic.allDamageTypes().map((damage) => {
      return Generic.ChangeHelper.unsignedAddChange(damage, 20, "system.traits.dr.value");
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
