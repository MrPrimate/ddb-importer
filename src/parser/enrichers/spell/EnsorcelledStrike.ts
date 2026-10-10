import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. Cast as part of a weapon or Unarmed Strike attack: a hit ensorcels the target
 * until the end of the caster's next turn (Disadvantage on saves against spells, spell attacks
 * against it have Advantage, ending when it fails such a save or is hit by a spell attack), and an
 * upcast adds 1d6 Force per slot level above 1.
 */
export default class EnsorcelledStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Ensorcel Target",
      targetType: "creature",
      targetCount: 1,
      activationCondition: "Make an Unarmed Strike or weapon attack against a creature as part of the casting; apply on a hit",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Upcast Force Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          activationOverride: { type: "special", value: null, condition: "The attack hits and the spell used a level 2+ slot" },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@item.level - 1)d6",
              types: ["force"],
              scalingMode: "none",
            }),
          ],
        },
        overrides: {
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ensorcelled",
        activityMatch: "Ensorcel Target",
        options: {
          expiry: "sourceEnd",
          description: "Disadvantage on saving throws against spells, and spell attacks against this creature have Advantage. Ends early when it fails a save against a spell or is hit by a spell attack.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.save.disadvantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.grants.attack.advantage"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.msak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.rsak"),
        ],
      },
    ];
  }

}
