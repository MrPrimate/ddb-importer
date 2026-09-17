import DDBEnricherData from "../../data/DDBEnricherData";

export default class SunlightSensitivity extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // Sunlight Weakness applies to all D20 Tests (attacks, checks and saves), the
    // sensitivity variants only to attack rolls and ability checks. The actor-level
    // check key also covers skills, tools and initiative, the same rolls AC5e's check
    // scope reached.
    const allD20 = this.name === "Sunlight Weakness";
    const changes = [
      DDBEnricherData.ChangeHelper.disadvantageAttackChange(),
      DDBEnricherData.ChangeHelper.allChecksRollModeChange(DDBEnricherData.ChangeHelper.DISADVANTAGE),
    ];
    if (allD20) changes.push(DDBEnricherData.ChangeHelper.allSavesRollModeChange(DDBEnricherData.ChangeHelper.DISADVANTAGE));
    return [
      {
        options: {
          transfer: true,
          disabled: true,
          description: "Enable this effect while the creature is in sunlight. No module can detect sunlight, only ambient light level.",
        },
        name: this.name,
        changes,
      },
    ];
  }

}
