import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

type TJewelStage = "dormant" | "awakened" | "exalted";

/**
 * The Jewel of Three Prayers is a Vestige of Divergence: DDB ships one item definition per stage
 * plus an unsuffixed base, and each stage's description repeats every lower stage. Charges are
 * resolved per stage by the parser (src/parser/item/Vestige.ts); this adds the automation for the
 * properties DDB carries as prose only.
 */
export default class JewelOfThreePrayers extends DDBEnricherData {

  static LIGHT_EFFECT_ID = utils.namedIDStub("jewelLight", { prefix: "ddb", postfix: "ef" });

  get stage(): TJewelStage {
    const match = (/\((Dormant|Awakened|Exalted)\)\s*$/i).exec(this.name);
    return match ? (match[1].toLowerCase() as TJewelStage) : "dormant";
  }

  get isAwakened(): boolean {
    return ["awakened", "exalted"].includes(this.stage);
  }

  get isExalted(): boolean {
    return this.stage === "exalted";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Emit Light",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateRange: false,
          generateTarget: false,
        },
        overrides: {
          activationType: "action",
          targetSelf: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            effects: [{
              _id: JewelOfThreePrayers.LIGHT_EFFECT_ID,
              level: { min: null, max: null },
              riders: { activity: [], effect: [], item: [] },
            }],
          },
        },
      },
    ];

    if (this.isAwakened) {
      activities.push(
        {
          init: {
            name: "End Grappled, Paralyzed, or Restrained",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            generateConsumption: false,
            generateRange: false,
            generateTarget: false,
          },
          overrides: {
            activationType: "special",
            targetSelf: true,
            noTemplate: true,
            addItemConsume: true,
            itemConsumeValue: 1,
            noeffect: true,
          },
        },
        {
          init: {
            name: "Reroll Saving Throw",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            generateConsumption: false,
            generateRange: false,
            generateTarget: false,
          },
          overrides: {
            activationType: "reaction",
            activationCondition: "Another creature you can see within 60 feet of you fails a saving throw",
            rangeType: "ft",
            rangeValue: 60,
            targetType: "creature",
            targetCount: 1,
            noTemplate: true,
            addItemConsume: true,
            itemConsumeValue: 1,
            noeffect: true,
          },
        },
      );
    }

    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Jewel of Three Prayers: Light",
        activityMatch: "Emit Light",
        data: {
          _id: JewelOfThreePrayers.LIGHT_EFFECT_ID,
        },
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("15", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffd700", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.3", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
        ],
      },
    ];

    if (this.isExalted) {
      effects.push({
        name: "Jewel of Three Prayers: Waters of the Arch Heart",
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "30",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.swim"),
        ],
        options: {
          transfer: true,
        },
      });
    }

    return effects;
  }

}
