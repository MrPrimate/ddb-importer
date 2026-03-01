import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationRadiantSoul extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Activate",
      addItemConsume: true,
      activationType: "action",
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              type: "radiant",
            }),
          ],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Radiant Soul",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
        midiOptionalChanges: [
          {
            name: "radiantSoul",
            data: {
              label: `Radiant Soul Bonus Damage`,
              count: "each-round",
              "damage.all": "@prof[radiant]",
            },
          },
        ],
      },
    ];
  }

}
