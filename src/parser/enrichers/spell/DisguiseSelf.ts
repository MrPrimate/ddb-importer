import DDBEnricherData from "../data/DDBEnricherData";

export default class DisguiseSelf extends DDBEnricherData {

  // the parser's Study Check comes from "takes the Study action to examine", which this text does not use
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Study Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          checkOverride: {
            associated: ["inv"],
            ability: "",
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            override: true,
            condition: this.is2014 ? "Action to inspect your appearance" : "Study Action to Investigate",
          },
          rangeOverride: {
            units: "any",
            override: true,
          },
          targetOverride: {
            affects: {
              type: "self",
            },
            override: true,
          },
          durationOverride: {
            units: "inst",
            override: true,
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Disguised"],
      },
    ];
  }

}
