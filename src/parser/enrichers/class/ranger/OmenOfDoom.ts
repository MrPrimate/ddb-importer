import DDBEnricherData from "../../data/DDBEnricherData";

export default class OmenOfDoom extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Activate Omen of Doom",
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        action: {
          name: "Omen of Doom",
          type: "class",
          rename: ["Omen of Doom: Bonus Damage"],
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Doomed",
        activityMatch: "Activate Omen of Doom",
        options: {
          durationSeconds: 3600,
        },
      },
    ];
  }

  get override(): IDDBOverrideData {

    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Omen of Doom - Limited Use",
      max: "@abilities.wis.mod",
      period: "sr",
    });

    return {
      uses,
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbOmenOfDoom">
<p><strong>Implementation Details</strong></p>
<p>See the Grim feature to summon your Grim.</p>
</section>`,
    };
  }

}
