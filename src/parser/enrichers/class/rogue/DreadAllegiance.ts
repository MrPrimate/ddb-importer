import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadAllegiance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const results = [
      {
        init: {
          name: "Choose Bane",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateUtility: true,
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        init: {
          name: "Choose Bhaal",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateUtility: true,
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        init: {
          name: "Choose Myrkul",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateUtility: true,
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        init: {
          name: "Minor Illusion (Bane)",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Minor Illusion",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
      {
        init: {
          name: "Blade Ward (Bhaal)",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Blade Ward",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
      {
        init: {
          name: "Chill Touch (Myrkul)",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Chill Touch",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },

    ];

    return results;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dread Allegiance to Bane (Psychic)",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("psychic", 1),
        ],
        activityMatch: "Choose Bane",
      },
      {
        name: "Dread Allegiance to Bhaal (Poison)",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("poison", 1),
        ],
        activityMatch: "Choose Bhaal",
      },
      {
        name: "Dread Allegiance to Myrkul (Necrotic)",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic", 1),
        ],
        activityMatch: "Choose Myrkul",
      },
    ];
  }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbDreadAllegiance">
<p><strong>Implementation Details</strong></p>
<p>Make a daily choice and apply the appropriate effect.</p>
</section>`,
    };
  }

}
