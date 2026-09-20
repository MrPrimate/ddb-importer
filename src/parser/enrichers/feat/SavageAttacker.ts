import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Savage Attacker: once per turn, roll a weapon's damage dice twice and use either total.
 *
 * This is an optional, once per turn reroll of a whole damage roll, so it cannot be persisted as a
 * `DamageData.modifiers` entry on the character's weapons the way Great Weapon Fighting is: a baked
 * modifier would apply to every roll.
 *
 * AC5e's `modifier=adv` is not used either. dnd5e's `adv` die modifier keeps the best set PER DICE
 * TERM, and AC5e appends it to every dice term in the base damage roll, so any dice bonus riding in
 * that roll picks its own best result: two rolls totalling 10 and 13 can come out as 20, and the
 * bonus dice are not the weapon's dice to begin with. midi offers the reroll as an opt-in; without
 * it the 2024 activity tracks the once per turn use and the reroll is manual.
 */
export default class SavageAttacker extends DDBEnricherData {

  get type() {
    if (this.is2014) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    if (this.is2014) return null;
    return {
      activationType: "special",
      name: "Savage Attacker - Reroll Weapon Damage",
      addItemConsume: true,
    };
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [
          {
            name: "savagAttacker",
            data: {
              label: "Savage Attacker - Weapon Damage Reroll?",
              count: "turn",
              "damage.mwak": "reroll-kh",
            },
          },
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        spent: 0,
        recovery: [{ period: "lr", type: "turn", formula: undefined }],
      },
    };
  }

}
