import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfThorns extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      splitDamage: true,
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
          // the 2024 text limits the save to once per turn; 2014 rolls entering and ending a turn apart
          ...DDBEnricherData.BehaviorHelper.activityPerEvent({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Save to Travel Through Wall",
          }, this.is2014),
        ],
        img: "icons/magic/nature/root-vine-entwined-thorns.webp",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "60",
            width: "5",
            height: "10",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Create Circle",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          img: "icons/magic/nature/trap-spikes-thorns-green.webp",
          partialDamageParts: [0],
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              // "a circle that has a 20-foot diameter and is up to 20 feet high and 5 feet thick"
              type: "ring",
              size: "10",
              height: "20",
              width: "5",
              units: "ft",
            },
            affects: {},
          },
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
              // the 2024 text limits the save to once per turn; 2014 rolls entering and ending a turn apart
              ...DDBEnricherData.BehaviorHelper.activityPerEvent({
                events: ["tokenEnter", "tokenTurnEnd"],
                activityName: "Save to Travel Through Wall",
              }, this.is2014),
            ],
          },
        },
      },
      {
        init: {
          name: "Save to Travel Through Wall",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          img: "icons/magic/nature/root-vine-entangled-humanoid.webp",
          generateTarget: true,
          partialDamageParts: [1],
          noSpellslot: true,
          activationOverride: { type: "special", condition: "Enters the wall's area or ends its turn there" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {},
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      noTemplate: true,
    };
  }

}
