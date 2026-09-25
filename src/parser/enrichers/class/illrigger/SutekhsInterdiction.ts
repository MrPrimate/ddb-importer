import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * Foul Interchange keeps DDB's action with the interdict DC; the condition it moves is chosen at
 * the table. Sanguine Gift and Blood for Blood are rebuilt as a heal and a damage roll.
 */
export default class SutekhsInterdiction extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Foul Interchange", type: "class" },
        overrides: {
          ..._Illrigger.sealConsume(),
          data: {
            save: {
              ability: ["con"],
              dc: _Illrigger.INTERDICT_DC,
            },
          },
        },
      },
      {
        init: {
          name: "Sanguine Gift",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When a creature you can see within 30 feet regains hit points (no action required)",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: _Illrigger.ILLRIGGER_LEVEL,
            types: ["healing"],
          }),
        },
        overrides: {
          ..._Illrigger.sealConsume(),
          targetType: "creature",
          targetCount: 1,
          rangeType: "ft",
          rangeValue: 30,
        },
      },
      {
        init: {
          name: "Blood for Blood",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Whenever an ally takes damage from an interdicted creature",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@prof",
              types: ["necrotic"],
            }),
          ],
        },
        overrides: {
          // passive: no seal is expended
          noConsumeTargets: true,
          targetType: "creature",
          targetCount: 1,
        },
      },
    ];
  }

}
