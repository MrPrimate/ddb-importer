try {
    if (args[0].itemData.type !== "spell") return;
    // no healing done?
    if (!(args[0].damageList.some(li => li.oldHP < li.newHP))) return;
    // only targets self?
    if (!(args[0].hitTargetUuids.some(uuid => uuid !== args[0].tokenUuid))) return;

    const targetActor = await fromUuid(args[0].actorUuid);
    const spellLevel = args[0].spellLevel;
    const currentHP = targetActor.system.attributes.hp.value;
    const newHP = Math.min(targetActor.system.attributes.hp.max, currentHP + 2 + spellLevel);
    ChatMessage.create({content: `${targetActor.name} cures ${newHP - currentHP} HP of bonus healing`})
    return targetActor.update({"system.attributes.hp.value": newHP});
} catch (err) {
    console.error(`${args[0].itemData.name} - Blessed Healer`, err);
}
