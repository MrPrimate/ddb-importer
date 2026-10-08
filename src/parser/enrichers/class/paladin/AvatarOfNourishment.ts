import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Becoming the avatar is a self-enchantment whose riders are its Restoration, Temp HP and
 * Protection activities, so they only appear for the minute it lasts.
 */
export default class AvatarOfNourishment extends DDBEnricherData {

  static RESTORATION_ID = "ddbAvatarNourRes";

  static TEMP_HP_ID = "ddbAvatarNourTmp";

  static PROTECTION_ID = "ddbAvatarNourPro";

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Avatar of Nourishment",
      useActivitySnippet: true,
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
      noTemplate: true,
      data: {
        range: { value: "30", units: "ft", special: "" },
        duration: { value: "1", units: "minute", special: "" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Avatar of Nourishment",
        type: "enchant",
        activityMatch: "Avatar of Nourishment",
        changes: toggleOffChanges("End Avatar of Nourishment"),
        data: {
          flags: {
            ddbimporter: riders({
              activities: [AvatarOfNourishment.RESTORATION_ID, AvatarOfNourishment.TEMP_HP_ID, AvatarOfNourishment.PROTECTION_ID],
            }),
          },
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Avatar of Nourishment: Restoration",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the start of each of your turns",
          },
          rangeOverride: {
            value: "30",
            units: "ft",
            special: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "max(@abilities.cha.mod, 1)",
            type: "healing",
          }),
        },
        overrides: {
          id: AvatarOfNourishment.RESTORATION_ID,
          useActivitySnippet: true,
        },
      },
      {
        init: {
          name: "Avatar of Nourishment: Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the start of each of your turns",
          },
          rangeOverride: {
            value: "30",
            units: "ft",
            special: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "max(@abilities.cha.mod, 1)",
            types: ["temphp"],
          }),
        },
        overrides: {
          id: AvatarOfNourishment.TEMP_HP_ID,
          useActivitySnippet: { name: "Avatar of Nourishment: Restoration" },
        },
      },
      {
        init: {
          name: "Avatar of Nourishment: Protection",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Grant the creature resistance to that damage.",
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "When a creature within 30 feet of you takes damage",
          },
          rangeOverride: {
            value: "30",
            units: "ft",
            special: "",
          },
        },
        overrides: {
          id: AvatarOfNourishment.PROTECTION_ID,
          useActivitySnippet: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Avatar of Nourishment",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
