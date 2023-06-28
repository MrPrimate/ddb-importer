const active = (module) => game.modules.get(module)?.active;

if ( !(active('sequencer') && active('warpgate')) ) return;
if ( !(active('jb2a_patreon') || active('JB2A_DnD5e')) ) return;

if ( args[ 0 ] === "off" ) {
  const imgs = await game.actors.getName("Skeleton").getTokenImages()
  await Promise.all(imgs.map(i => loadTexture(i)));
  for(let i = 0; i < 12; i++){
    const [spawn] = await warpgate.spawn("Skeleton");
    new Sequence().effect().file("jb2a.misty_step.01.blue").atLocation(spawn).play()
  }
}
