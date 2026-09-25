import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * Red Cant keeps DDB's action. Slippery Ploy (13th level) is a Charisma save DDB ships as a plain
 * utility, so it is rebuilt and hidden until the illrigger reaches 13th level. Incontrovertible
 * (18th level) is passive; BalefulInterdict adds its save disadvantage to the Interdict Seal.
 */
export default class MolochsInterdiction extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Red Cant", type: "class" },
        overrides: {
          ..._Illrigger.sealConsume(),
          activationType: "special",
          activationCondition: "When you make a Charisma check: treat a d20 roll of 9 or lower as a 10",
          targetType: "self",
        },
      },
      {
        init: {
          name: "Slippery Ploy",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateSave: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "When a creature targets you with an attack, spell, or other magical effect. Place a seal on it; on a failure it must choose a new target or lose the attack or effect.",
          },
          saveOverride: {
            ability: ["cha"],
            dc: _Illrigger.INTERDICT_DC,
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          data: _Illrigger.boonVisibility(13),
        },
      },
    ];
  }

}
