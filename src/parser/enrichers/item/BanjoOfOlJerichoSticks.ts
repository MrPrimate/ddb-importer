import DDBEnricherData from "../data/DDBEnricherData";

export default class BanjoOfOlJerichoSticks extends DDBEnricherData {

  /** the spell-save-dc bonus values DDB grants this record, ascending */
  get bonuses(): number[] {
    const modifiers = (foundry.utils.getProperty(this.ddbParser.ddbDefinition, "grantedModifiers") as IDDBModifier[] | undefined) ?? [];
    const values = modifiers
      .filter((mod) => mod.type === "bonus" && mod.subType === "spell-save-dc" && Number.isInteger(mod.value))
      .map((mod) => Number(mod.value));
    return [...new Set(values)].sort((a, b) => a - b);
  }

  get bonus(): number {
    return this.bonuses[0] ?? 1;
  }

  get isLegendary(): boolean {
    return this.bonuses.includes(3);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fiendish Lure",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "One Fiend or Humanoid you can see",
      addActivityConsume: true,
      noTemplate: true,
      data: {
        range: {
          override: true,
          value: "60",
          units: "ft",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: `${16 + this.bonus}`,
          },
        },
        uses: {
          spent: 0,
          max: "1",
          recovery: [{ period: "dusk", type: "recoverAll" }],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Scarecrow's Dance",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "Take the Disengage action; audible within 120 feet",
          },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
        },
      },
    ];
    if (this.isLegendary) {
      activities.push({
        init: {
          name: "Birdcage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "A creature you have Charmed; the banjo holds one creature for up to 24 hours",
          },
          saveOverride: {
            ability: ["cha"],
            dc: {
              calculation: "",
              formula: "19",
            },
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noTemplate: true,
        },
      });
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed (Fiendish Lure)",
        activityMatch: "Fiendish Lure",
        statuses: ["Charmed"],
        options: {
          // a wondrous item's effects transfer by default, and a transferring effect never links to an activity
          transfer: false,
          durationSeconds: 60,
          description: "Charmed by the banjo's music for 1 minute; ends if the wielder or their allies damage you or force you to make a saving throw.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    if (this.bonuses.length < 2) return {};
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbBanjo">
<p><strong>Implementation Details</strong></p>
<p>This is the "Varies" record, so Fiendish Lure is built at the Rare tier (DC ${16 + this.bonus}). Raise the save DC by one per rarity tier above Rare.</p>
</section>`,
    };
  }

}
