async function targetCheck(result, num) {
  if (result && game.user.targets.size <= num) {
    return true;
  } else {
    const newResult = await Dialog.prompt({
      title: "Too Many Targets!!!",
      content: `Select up to ${num} targets. Use shift + t to target multiple creatures.`,
      label: "Done",
      rejectClose: false,
    });
    return targetCheck(newResult, num);
  }
}

if (args[0].macroPass === "preTargeting") {
  const num = actor.getRollData().abilities.cha.mod;
  if (args[0].targets.length > num) ui.notifications.warn(`You can target up to ${num} creatures`);
  const result = await Dialog.prompt({
    title: `Target up to ${num} creatures`,
    content: `Target up to ${num} creatures. Use shift + t to target multiple creatures.`,
    label: "Done",
    rejectClose: false,
  });
  return targetCheck(result, num);
}
