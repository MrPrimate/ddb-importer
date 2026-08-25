import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfConquest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage",
      noeffect: true,
      targetType: "creature",
      data: {
        sort: 2,
        range: {
          value: "@scale.conquest.aura-of-conquest",
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@classes.paladin.levels",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Place Aura",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            condition: "While the aura is active",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "enemy",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "@scale.conquest.aura-of-conquest",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            sort: 0,
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({
                effects: "Aura of Conquest",
                auraeffectsNever: true,
              }),
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenTurnStart"],
                activityName: "Damage",
              }),
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Conquest",
        standalone: true,
        auraeffectsNever: true,
        options: {
          description: "In the Aura of Conquest: a creature frightened of the paladin has speed 0 and takes psychic damage equal to half the paladin's level at the start of its turns (ignore the fired damage card for creatures that are not frightened).",
        },
      },
      {
        name: "Aura of Conquest",
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.conquest.aura-of-conquest",
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
        },
        options: {
          transfer: true,
        },
      },
    ];
  }

}
