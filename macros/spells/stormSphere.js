const lastArg = args[args.length - 1];

console.warn(lastArg);

if (!game.modules.get("advanced-macros")?.active) { ui.notifications.error("Advanced Macros is not enabled"); return }
if(args[0].tag === "OnUse"){
AAhelpers.applyTemplate(args)
}


// TODO: add bonus action attack thing
