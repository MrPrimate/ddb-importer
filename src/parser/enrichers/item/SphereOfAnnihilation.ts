import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Two rolls, one of which the parse cannot see: the Dexterity save for a
 * creature the sphere passes through (which DDB parses correctly, including
 * the 2014 4d10 at DC 13 and the 2024 8d10 at DC 19), and the DC 25
 * Intelligence (Arcana) check to take control of it. Both printings use the
 * same control DC, so only the save is left to the parser.
 *
 * The contested check against another controller, and the d100 planar-portal
 * table, stay in the description.
 */
export default class SphereOfAnnihilation extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Touched by the Sphere",
      activationCondition: "A creature's space the sphere enters",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Control the Sphere",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            type: "action",
            condition: "While within 60 feet of the sphere",
          },
          checkOverride: {
            ability: "int",
            associated: ["arc"],
            dc: {
              calculation: "",
              formula: "25",
            },
            visible: true,
          },
        },
        overrides: {
          targetType: "self",
        },
      },
    ];
  }

}
