// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeastsStrike extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          includeBase: true,
          parts: [],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Charge",
          data: {
            damage: {
              includeBase: true,
              parts: [
                DDBEnricherData.basicDamagePart({
                  bonus: "1d6",
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
        name: "Prone",
        activityMatch: "Charge",
        statuses: ["prone"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        "system.damage.base": {
          types: ["bludgeoning", "piercing", "slashing"],
          bonus: "",
        },
      },
    };
  }

}
