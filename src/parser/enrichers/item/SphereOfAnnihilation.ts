import DDBEnricherData from "../data/DDBEnricherData";


export default class SphereOfAnnihilation extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  /** The 2024 reprint doubled the sphere's damage; the DC moved with it. */
  get touchDamage(): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      number: this.is2014 ? 4 : 8,
      denomination: 10,
      type: "force",
    });
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Touched by the Sphere",
      activationCondition: "A creature's space the sphere enters",
      noTemplate: true,
      targetType: "creature",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Engulfed",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          includeBaseDamage: false,
          damageParts: [this.touchDamage],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Touching the sphere without being wholly engulfed",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "any",
          rangeSelf: true,
          data: {
            damage: {
              critical: { allow: false },
            },
          },
        },
      },
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
          rangeOverride: {
            override: true,
            value: "60",
            units: "ft",
            special: "",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "self",
        },
      },
    ];
  }

}
