/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Guidance extends DDBEnricherData {

  get activity() {
    const midiProperties = this.is2014
      ? {}
      : {
        chooseEffects: true,
      };
    return {
      targetType: "creature",
      data: {
        // roll: {
        //   prompt: false,
        //   visible: true,
        //   formula: "1d4",
        //   name: "Guidance Roll",
        // },
        midiProperties,
      },
    };
  }

  get effects2014() {
    return [
      {
        name: `Guidance`,
        options: {
          durationSeconds: 60,
        },
      },
      {
        noCreate: true,
        noMidi: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.abilities.check"),
        ],
      },
      {
        noCreate: true,
        name: `Guidance`,
        midiOnly: true,
        midiOptionalChanges: [
          {
            name: "guidance",
            data: {
              label: "Guidance",
              "check.all": "1d4",
              "skill.all": "1d4",
              "init.bonus": "1d4",
            },
          },
        ],
        daeSpecialDurations: ["isInitiative"],
      },
    ];
  }

  get effects2024() {
    return DICTIONARY.actor.skills.map((skill) => {
      return {
        name: `${skill.label} Guidance`,
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1d4", 100, `system.skills.${skill.name}.bonuses.check`),
        ],
        daeSpecialDurations: [`isSkill.${skill.name}`],
      };
    });
  }

  get effects() {
    return this.is2014 ? this.effects2014 : this.effects2024;
  }

}
