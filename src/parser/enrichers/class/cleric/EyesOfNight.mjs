/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EyesOfNight extends DDBEnricherData {

  get type() {
    return this.isAction ? "none" : "utility";
  }

  get activity() {
    return {
      name: "Activate",
      id: "activateEyesOfNi",
      addItemConsume: true,
      targetType: "creature",
      targetCount: "max(1, @attributes.wis.mod)",
      targetChoice: true,
      rangeSelf: true,
      data: {
        target: {
          template: {
            size: "10",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Activate With Spell Slot",
          type: "forward",
        },
        build: {
        },
        overrides: {
          activationType: "action",
          data: {
            activity: {
              id: "activateEyesOfNi",
            },
            consumption: {
              targets: [
                {
                  type: "spellSlots",
                  value: "1",
                  target: "1",
                  scaling: {},
                },
              ],
              scaling: {
                allowed: true,
                max: "",
              },
              spellSlot: true,
            },
            uses: { spent: null, max: "" },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },
    ];

  }

  get effects() {
    return [
      {
        name: "Eyes of Night - Darkvision",
        activityNameMatch: "Activate",
        img: "icons/magic/perception/silhouette-stealth-shadow.webp",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("300", 20, "system.attributes.senses.darkvision"),
        ],
        options: {
          durationSeconds: 3600,
          transfer: false,
        },
      },
    ];
  }
}
