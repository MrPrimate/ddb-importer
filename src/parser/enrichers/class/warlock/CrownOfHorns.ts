import DDBEnricherData from "../../data/DDBEnricherData";
import { areaTrigger, emanation } from "../../data/AreaBuilders";

export default class CrownOfHorns extends DDBEnricherData {
  // DDB lists the Horned King form under both "Crown of Horns" and its
  // "Dark Heart" benefit with identical text; only the primary name builds
  // anything so a character carrying both entries gets one set of activities
  get isPrimary(): boolean {
    return this.name === "Crown of Horns";
  }

  override get type(): IDDBActivityType | null {
    if (!this.isPrimary) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isPrimary) return null;
    return {
      name: "Manifest Crown of Horns",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        target: emanation("20", "self"),
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.isPrimary) return [];
    return [
      ...["Enticement", "Wickedness", "Terror"].map((choice) => {
        const trigger = areaTrigger(`King of All: ${choice}`, {
          condition:
            "On activation, and at the start of each of your turns, choose a creature you can see in the 20 foot aura",
          save: { ability: ["cha"], calculation: "spellcasting" },
        });
        return {
          ...trigger,
          build: {
            ...trigger.build,
            targetOverride: {
              override: true,
              affects: { type: "creature" as const, count: "1", choice: true },
              template: {},
            },
          },
        };
      }),
      {
        init: {
          name: "Spend Pact Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "attribute",
                value: "1",
                target: "spells.pact.value",
              },
            ],
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return this.isPrimary;
  }

  override get override(): IDDBOverrideData | null {
    if (!this.isPrimary) return null;
    return {
      uses: {
        spent: 0,
        recovery: [
          {
            period: "lr",
            type: "recoverAll",
          },
        ],
        max: "1",
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbCrownOfHorns">
<p><strong>Implementation Details</strong></p>
<p>Choose a creature and one King of All save. Each save applies only its named effect.</p>
</section>`,
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isPrimary) return [];
    return [
      {
        name: "Crown of Horns: Dark Heart",
        activityMatch: "Manifest Crown of Horns",
        options: {
          durationSeconds: 60,
          description: "Once on each of your turns when you damage a creature, it takes an extra 1d8 Necrotic damage.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d8[necrotic]; oncePerTurn",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
      {
        name: "King of All: Enticement",
        activityMatch: "King of All: Enticement",
        statuses: ["Charmed"],
        options: {
          expiry: "sourceStart",
          description: "Charmed until the start of the origin's next turn.",
        },
      },
      {
        name: "King of All: Wickedness",
        activityMatch: "King of All: Wickedness",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls and ability checks until the start of the origin's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.check.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.check.disadvantage"),
        ],
      },
      {
        name: "King of All: Terror",
        activityMatch: "King of All: Terror",
        statuses: ["Frightened"],
        options: {
          expiry: "sourceStart",
          description:
            "Frightened until the start of the origin's next turn; it must move away from the origin by the safest route on its turn.",
        },
      },
    ];
  }
}
