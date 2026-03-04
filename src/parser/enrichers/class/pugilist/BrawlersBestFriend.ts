import DDBEnricherData from "../../data/DDBEnricherData";

export default class BrawlersBestFriend extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get activity() {
    return {
      id: "summonHound11111",
      name: "Summon After Long Rest",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      activationType: "action",
      addActivityConsume: true,
      noeffects: true,
      data: {
        uses: {
          spent: null,
          max: "1",
          override: true,
          recovery: [
            { period: "lr", type: "recoverAll", formula: undefined },
          ],
        },
        bonuses: {
          ac: "@abilities.con.mod",
          hd: "@classes.pugilist.levels",
          hp: "@classes.pugilist.levels * 5",
          attackDamage: "@abilities.con.mod",
        },
        match: {
          proficiency: true,
          attacks: true,
          saves: true,
          ability: "con",
          disposition: true,
        },
      },
    };
  }

  get override() {
    return {
      uses: {
        max: "",
        recovery: [],
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Hound With Moxie",
          type: DDBEnricherData.ACTIVITY_TYPES.FORWARD,
        },
        build: {
        },
        overrides: {
          activationType: "action",
          addItemConsume: true,
          itemConsumeTargetName: "Moxie",
          itemConsumeTargetValue: 2,
          data: {
            activity: {
              id: "restoreHound1111",
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

  get parseAllChoiceFeatures() {
    return true;
  }

  get clearAutoEffects() {
    return true;
  }

}
