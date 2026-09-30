import _VestigeCompanionForm from "./_VestigeCompanionForm";

/**
 * Vestige Patron (AU 2024) companion stat block. Vestige's Strike is a melee (reach 5 feet) or
 * ranged (60 feet) attack with the summoner's spell attack modifier (the summon matches attacks),
 * hitting for 1d6 + 3 of the form's damage type. The summoner's Charisma modifier on top is the
 * Vestige Companion summon's attack damage bonus.
 */
export default class VestigesStrike extends _VestigeCompanionForm {

  get damageType(): string | null {
    const form = this.form;
    return form ? _VestigeCompanionForm.DAMAGE_TYPES[form] : null;
  }

  override get type(): IDDBActivityType | null {
    return _VestigeCompanionForm.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    const damageType = this.damageType;
    return {
      name: "Melee",
      targetType: "creature",
      data: {
        attack: { type: { value: "melee", classification: "weapon" } },
        range: { value: "5", units: "ft" },
        // the companion's strike is a feature, so the damage sits on the activity, not a weapon base
        damage: {
          includeBase: false,
          parts: [
            _VestigeCompanionForm.basicDamagePart({
              number: 1,
              denomination: 6,
              bonus: "3",
              types: damageType ? [damageType] : Object.values(_VestigeCompanionForm.DAMAGE_TYPES),
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Ranged",
          data: {
            attack: { type: { value: "ranged", classification: "weapon" } },
            range: { value: "60", units: "ft" },
          },
        },
      },
    ];
  }

}
