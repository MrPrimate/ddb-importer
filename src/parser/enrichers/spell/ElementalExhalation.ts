import DDBEnricherData from "../data/DDBEnricherData";

export default class ElementalExhalation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  _damagePart(type: string) {
    return DDBEnricherData.basicDamagePart({
      number: 5,
      denomination: 6,
      types: [type],
      scalingMode: "whole",
      scalingNumber: 1,
    });
  }

  get activity(): IDDBActivityData {
    return {
      name: "Air",
      targetType: "creature",
      activationType: "action",
      data: {
        damage: {
          parts: [
            this._damagePart("thunder"),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          id: "ddbEEColdfire012",
          name: "Coldfire",
          data: {
            damage: {
              parts: [
                this._damagePart("cold"),
              ],
            },
          },
        },
      },
      {
        duplicate: true,
        overrides: {
          id: "ddbEEEarth012345",
          name: "Earth",
          data: {
            damage: {
              parts: [
                this._damagePart("bludgeoning"),
              ],
            },
          },
        },
      },
      {
        duplicate: true,
        overrides: {
          id: "ddbEEFire0123456",
          name: "Fire",
          data: {
            damage: {
              parts: [
                this._damagePart("fire"),
              ],
            },
          },
        },
      },
      {
        duplicate: true,
        overrides: {
          id: "ddbEEWater012345",
          name: "Water",
          data: {
            damage: {
              parts: [
                this._damagePart("acid"),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Engulfed Fire Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        overrides: {
          activationType: "special",
          noConsumeTargets: true,
          noSpellslot: true,
          targetType: "creature",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 6,
                  types: ["fire"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Coldfire Fear",
        options: {
          durationSeconds: 6,
          expire: "turnStart",
        },
        daeSpecialDurations: ["turnStartSource"],
        activityMatch: "Coldfire",
      },
      {
        name: "Earth Slowed",
        options: {
          durationSeconds: 6,
          expire: "turnEnd",
        },
        daeSpecialDurations: ["turnEnd"],
        activityMatch: "Earth",
      },
      {
        name: "Fire Engulfed",
        options: {
          durationSeconds: 6,
          expire: "turnEnd",
        },
        daeSpecialDurations: ["turnEnd"],
        activityMatch: "Fire",
      },
      {
        name: "Knocked Prone",
        statuses: ["Prone"],
        activityMatch: "Water",
      },
    ];
  }

}
