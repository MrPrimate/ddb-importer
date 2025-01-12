/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Silence extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Within Zone of Silence",
        statuses: ["Deafened"],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(
            "thunder",
            50,
            "system.traits.di.value",
          ),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            "1",
            50,
            "flags.midi-qol.fail.spell.vocal",
          ),
        ],
        options: {
          durationSeconds: 600,
        },
        data: {
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "All",
              radius: 20,
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        flags: {
          limits: {
            sight: {
              hearing: { enabled: true, range: 0 }, // Hearing
            },
            sound: { enabled: true, range: 0 },
          },
          walledtemplates: {
            wallRestriction: "move",
            wallsBlock: "walled",
          },
        },
      },
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "generic",
      name: "activeAuraOnly.js",
      triggerPoints: ["preActiveEffects"],
    };
  }

  get itemMacro() {
    return {
      type: "generic",
      name: "activeAuraOnly.js",
    };
  }

}
