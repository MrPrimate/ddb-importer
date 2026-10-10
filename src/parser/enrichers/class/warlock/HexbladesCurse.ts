import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Hexblade: a bonus action curses a creature for a minute. Attacks against it crit on 19-20 and
 * deal extra damage equal to the warlock's proficiency bonus; AC5e scopes both to the curse's own
 * caster, midi's grants threshold applies to every attacker. When the cursed target dies the
 * warlock heals warlock level + Charisma modifier (minimum 1).
 */
export default class HexbladesCurse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Curse",
      activationType: "bonus",
      targetType: "creature",
      targetCount: 1,
      addItemConsume: true,
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
        },
        duration: {
          override: true,
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cursed Target Dies",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "The cursed target dies",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "max(1, @classes.warlock.levels + @abilities.cha.mod)",
            types: ["healing"],
          }),
        },
        overrides: {
          targetSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hexblade's Curse: Cursed",
        statuses: ["Marked"],
        activityMatch: "Curse",
        options: {
          durationSeconds: 60,
          description: "The Hexblade adds their proficiency bonus to damage rolls against this creature, and their attack rolls against it score a critical hit on a roll of 19 or 20.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("19", 20, "flags.midi-qol.grants.criticalThreshold"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("set=19; effectOriginTokenId === tokenId", 20, "flags.automated-conditions-5e.grants.attack.criticalThreshold"),
          DDBEnricherData.ChangeHelper.ac5eChange("bonus=rollingActor.attributes.prof; effectOriginTokenId === tokenId;", 20, "flags.automated-conditions-5e.grants.damage.bonus"),
        ],
      },
    ];
  }

}
