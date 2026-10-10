import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 1. A Bonus Action marks a creature until the end of the magus's next turn: the
 * magus's spell attacks against it have Advantage and it has Disadvantage on saves against the
 * magus's spells. AC5e can scope both to the magus; midi cannot, so its twins are unconditional
 * (and the midi grant covers every spell attack).
 */
export default class EsotericEye extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Observe Creature",
      activationType: "bonus",
      targetType: "creature",
      targetCount: 1,
      addItemConsume: true,
      data: {
        range: { units: "spec", special: "A creature you can see" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Esoteric Eye",
        activityMatch: "Observe Creature",
        options: {
          expiry: "sourceEnd",
          description: "The magus has Advantage on spell attacks against this creature, and it has Disadvantage on saving throws against the magus's spells, until the end of the magus's next turn.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "isSpell && effectOriginTokenId === tokenId",
            20,
            "flags.automated-conditions-5e.grants.attack.advantage",
          ),
          DDBEnricherData.ChangeHelper.ac5eChange(
            "isSpell && effectOriginTokenId === opponentId",
            20,
            "flags.automated-conditions-5e.save.disadvantage",
          ),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.msak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.rsak"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: this._getSpentValue("class", "Esoteric Eye") ?? 0,
        max: "max(1, @abilities.int.mod)",
        recovery: [
          { period: "lr", type: "recoverAll", formula: undefined },
          { period: "sr", type: "formula", formula: "1" },
        ],
      },
    };
  }

}
