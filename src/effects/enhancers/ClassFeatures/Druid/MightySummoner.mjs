import { logger } from "../../../../lib/_module.mjs";

/* eslint-disable require-atomic-updates */
export default class MightySummoner {

  static dnd5ePreSummonTokenHook(activity, _profile, tokenUpdateData, _options) {
    if (!activity.actor.classes?.druid) return;
    if (activity.actor.classes?.druid?.subclass?.identifier !== "shepherd") return;
    if (activity.actor.classes.druid.subclass.system.source.rules !== "2014") return;
    const hasMightySummoner = activity.actor.items.find((i) => i.name === "Mighty Summoner");
    if (!hasMightySummoner) return;

    if (!["beast", "fey"].includes(tokenUpdateData.actor.system.details.type?.value)) {
      logger.debug("Mighty Summoner Enhancer skipped for non-beast/fey summon", {
        activity, _profile, _options, tokenUpdateData,
      });
      return;
    }

    const hpBonus = tokenUpdateData.actor.system.attributes.hd.max * 2;

    // If non-zero hp bonus, apply as needed for this actor.
    // Note: Only unlinked actors will have their current HP set to their new max HP
    if (hpBonus && hpBonus > 0) {

      // Helper function for modifying max HP ('bonuses.overall' or 'max')
      const maxHpEffect = (hpField) => {
        return (new ActiveEffect({
          _id: dnd5e.utils.staticID("dnd5eHPBonus"),
          changes: [{
            key: `system.attributes.hp.${hpField}`,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: hpBonus.total,
          }],
          disabled: false,
          icon: "icons/magic/life/heart-glowing-red.webp",
          name: game.i18n.localize("DND5E.SUMMON.FIELDS.bonuses.hp.label"),
        })).toObject();
      };

      if (!foundry.utils.isEmpty(tokenUpdateData.actor.classes) && !tokenUpdateData.actor._source.system.attributes.hp.max) {
        // Actor has classes without a hard-coded max -- apply bonuses to 'overall'
        tokenUpdateData.actorUpdates.effects.push(maxHpEffect("bonuses.overall"));
      } else if (tokenUpdateData.actor.prototypeToken.actorLink) {
        // Otherwise, linked actors boost HP via 'max' AE
        tokenUpdateData.actorUpdates.effects.push(maxHpEffect("max"));
      } else {
        // Unlinked actors assumed to always be "fresh" copies with bonus HP added to both
        // Max HP and Current HP
        const currentMax = tokenUpdateData.actorUpdates["system.attributes.hp.max"] ?? tokenUpdateData.actor.system.attributes.hp.max ?? 0;
        tokenUpdateData.actorUpdates["system.attributes.hp.max"] = currentMax + hpBonus;
        const currentValue = tokenUpdateData.actorUpdates["system.attributes.hp.value"] ?? tokenUpdateData.actor.system.attributes.hp.value ?? 0;
        tokenUpdateData.actorUpdates["system.attributes.hp.value"] = currentValue + hpBonus;
      }
    }

    logger.debug("Mighty Summoner Enhancer applied to summon", {
      activity, _profile, _options, tokenUpdateData,
      hpBonus: hpBonus,
    });

  }
}
