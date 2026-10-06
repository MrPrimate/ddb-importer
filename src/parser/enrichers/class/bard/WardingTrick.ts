import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class WardingTrick extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "The ward lasts for as long as you maintain Concentration, up to 10 minutes.",
        },
        range: {
          value: 60,
          units: "ft",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `${travelersTrickDie(this.ddbEnricher.isClass2014("Bard"))} + max(1, @abilities.wis.mod)`,
          types: ["temphp"],
        }),
      },
    };
  }

  // 6th level: a creature that damages the warded ally saves (Wisdom, the bard's save DC) or takes Radiant damage
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ward Retaliation",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateSave: true,
          generateDamage: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } },
          damageParts: [DDBEnricherData.basicDamagePart({
            customFormula: travelersTrickDie(this.ddbEnricher.isClass2014("Bard")),
            types: ["radiant"],
          })],
          activationOverride: { type: "special", value: 1, condition: "A creature damages the ally while the ward's Temporary Hit Points remain" },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noTemplate: true,
          data: { damage: { onSave: "none" }, visibility: { identifier: "bard", level: { min: 6, max: null } } },
        },
      },
    ];
  }

}
