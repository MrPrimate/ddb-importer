import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineSmite extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : null;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2024) return null;
    return {
      targetType: "creature",
      activationType: "special",
      addConsumptionScalingMax: "5",
      midiUseCondition: `!["fiend", "undead"].includes(raceOrType)`,
      data: {
        consumption: {
          targets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
              scaling: {
                mode: "level",
                formula: "",
              },
            },
          ],
          spellSlot: true,
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2024) return [];
    return [
      {
        duplicate: true,
        overrides: {
          name: "vs Fiends or Undead",
          midiUseCondition: `["fiend", "undead"].includes(raceOrType)`,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 8,
                  types: ["radiant"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }

  /**
   * AC5e damage opt-in on melee weapon hits: the roll dialog offers the actor's spell and Pact
   * slots (1st to 4th, the 5d8 cap), spends the chosen one and scales the dice from its level.
   */
  override get effects(): IDDBEffectHint[] {
    if (this.is2024) return [];
    return [
      {
        name: "Divine Smite (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional extra radiant damage on a melee weapon hit, expending a spell slot of your choice. Needs Automated Conditions 5e 14.605.2 or later.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=((opponentActor.creatureType.includes('fiend') || opponentActor.creatureType.includes('undead')) ? (2 + optinScale) : (1 + optinScale))d8[radiant]; usesCount=spell[slot,pact],{min:1,max:4,step:1}; name=Divine Smite; optinId=divine-smite; optin; actionType.mwak && !unarmed",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}
