import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuardianOfTheDead extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Guardian of the Dead",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "bonus",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Guardian of the Dead",
      options: {
        durationSeconds: 3600,
        description: "While within 10 feet of a creature reduced to 0 Hit Points, the paladin has Advantage on attack rolls and on saving throws against spells and effects that inflict the Charmed or Frightened condition (Immunity to Charmed once Aura of Courage is gained). When a creature casts a spell to create Undead or restore a creature to life, the paladin can take a Reaction to move up to half their Speed and attack the caster.",
      },
    }];
  }

}
