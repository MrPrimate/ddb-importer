import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Archfey Patron (2024) level 3: Misty Step can be cast without a spell slot a number of times
 * equal to the Charisma modifier (minimum of once) per Long Rest, and each cast carries one of two
 * riders. The free cast is the main activity; DDB only attaches the slot-less copy of the spell,
 * which FEATURE_SPELLS_IGNORE drops. Refreshing Step and Taunting Step are the riders.
 */
export default class StepsOfTheFey extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Misty Step",
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          expiry: "sourceStart",
          description:
            "Disadvantage on attack rolls against creatures other than caster until the start of the casters next turn",
        },
        name: "Taunted",
        activityMatch: "Taunting Step",
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Refreshing Step",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Immediately after you cast Misty Step",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 10,
            types: ["temphp"],
          }),
        },
      },
      {
        init: {
          name: "Taunting Step",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Immediately after you cast Misty Step",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        ...this._getSpellUsesWithSpent({
          type: "class",
          name: "Steps of the Fey",
          period: "lr",
        }),
        max: "max(1, @abilities.cha.mod)",
      },
    };
  }

}
