import DDBEnricherData from "../data/DDBEnricherData";

export default class WrapsOfDyamak extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  static STATE_BONUS: Record<string, number> = {
    dormant: 1,
    awakened: 2,
    exalted: 3,
  };

  get bonus(): number {
    const state = this.name.match(/\((Dormant|Awakened|Exalted)\)/i)?.[1]?.toLowerCase();
    return (state ? WrapsOfDyamak.STATE_BONUS[state] : undefined) ?? WrapsOfDyamak.STATE_BONUS["exalted"];
  }

  override get effects(): IDDBEffectHint[] {
    const bonus = this.bonus;
    return [
      {
        name: "Wraps of Dyamak",
        options: {
          transfer: true,
          description: `+${bonus} bonus to attack and damage rolls made with your unarmed strike.`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("attack", `${bonus}`, {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", `${bonus}`, {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
        ],
      },
    ];
  }

}
