import { DICTIONARY } from "../../../config/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class Guidance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
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

  get effects2014(): IDDBEffectHint[] {
    return [
      {
        name: `Guidance`,
        options: {
          durationSeconds: 60,
        },
      },
      {
        noCreate: true,
        midiNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.ability.check.bonus"),
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

  get effects2024(): IDDBEffectHint[] {
    return DICTIONARY.actor.skills.map((skill) => {
      return {
        name: `${skill.label} Guidance`,
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1d4", 100, `system.skills.${skill.name}.roll.bonus`),
        ],
        daeSpecialDurations: [`isSkill.${skill.name}` as TDAESpecialDuration],
      };
    });
  }

  override get effects(): IDDBEffectHint[] {
    return this.is2014 ? this.effects2014 : this.effects2024;
  }

}
