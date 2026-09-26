import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

const BURNING = "Burning Oil Damage";

/**
 * Oil, dousing a space: pouring the flask spends it and does nothing else until the oil is lit.
 * "Light the Oil" then places the burning 5-foot square where it was poured, for 2 rounds, and its
 * region deals the fire damage to a creature that moves in or ends its turn there (being in the
 * oil as it is lit is not entering). "Douse a Creature" is the thrown flask.
 */
export default class Oil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Douse a Space",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      data: {
        range: {
          override: true,
          value: "5",
          units: "ft",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Light the Oil", {
        template: { type: "square", size: "5" },
        rangeSpecial: "Where the oil was poured",
        activationType: "special",
        activationCondition: "The poured oil is set alight",
        duration: { value: "2", units: "round" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            enterOn: "movement",
            activityName: BURNING,
          }),
        ],
      }),
      {
        init: {
          name: BURNING,
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "Enters the burning oil or ends its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
          rangeOverride: {
            override: true,
            value: null,
            units: "self",
            special: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "5",
              types: ["fire"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Douse a Creature",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: {
            type: "action",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
        overrides: {
          addItemConsume: true,
          data: {
            attack: {
              ability: "dex",
              type: {
                value: "ranged",
                classification: "weapon",
              },
            },
            range: {
              override: true,
              value: "20",
              units: "ft",
            },
          },
        },
      },
    ];
  }

}
