import DDBEnricherData from "../../data/DDBEnricherData";

export default class SunlightSensitivity extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // Sunlight Weakness applies to all D20 Tests (attacks, checks and saves), the
    // sensitivity variants only to attack rolls and ability checks
    const allD20 = this.name === "Sunlight Weakness";
    const ac5eChanges = allD20
      ? [
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.d20.disadvantage"),
      ]
      : [
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.check.disadvantage"),
      ];
    return [
      {
        options: {
          transfer: true,
          disabled: true,
          description: "Enable this effect while the creature is in sunlight. AC5e cannot detect sunlight, only ambient light level.",
        },
        name: this.name,
        ac5eOnly: true,
        ac5eChanges,
      },
    ];
  }

}
