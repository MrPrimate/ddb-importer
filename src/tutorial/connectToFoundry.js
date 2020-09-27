export default async () => {
  const EXIT_BUTTON = "Exit Tutorial";
  const NEXT_BUTTON = "Next";
  let result;
  /**
   * STEP 1
   */
  let text = `<h1>What is "Native App"?</h1>You probably know that Foundry VTT consists of two components:</p>
    <ol>
        <li>A <b>server</b> that is managing all the data and handles</li>
        <li>one or multiple <b>clients</b>, which connect to the server in order to play together</li>
    </ol>
    <p>When you run Foundry VTT by clicking on the Foundry executable, you are starting both components at the same time. This is what I call <b>Native App mode</b>.</p>
    <p>The server is hidden from you and all you see is <b>Native Client component</b> that enables to login and to manage your world.</p>
    <hr />`;
  // Welcome - hidden on "Next"
  result = await window.ddbimporter.hint.show(text, {
    align: "CENTER",
    buttons: [EXIT_BUTTON, NEXT_BUTTON],
    width: window.innerWidth * 0.5,
  });

  if (result === EXIT_BUTTON) return;

  /**
   * STEP 2
   */
  text = `<h1>The Chrome extension</h1><p><b>Preface</b>: I gather that you already visited the <a href="https://chrome.google.com/webstore/detail/vttassets-dd-beyond-found/mhbmahbbdgmmhbbfjbojneimkbkamoji" target="_blank">Chrome Webstore</a>
  to install the VTTAssets: D&D Beyond & Foundry VTT Bridge extension.</p>
  <p>Eager to import your first monsters and scenes, you installed the extension and found the extension's popup menu which has a nice green button: <b>Connect to Foundry</b>. You click on it and nothing happens.</p>
  <h2>Why is that?</h2>
  <p>
    Foundry and Chrome are running in seperate processes and are unable to communicate. Let's change that.</p>

  </p>
    <hr />`;
  // Welcome - hidden on "Next"
  result = await window.ddbimporter.hint.show(text, {
    align: "CENTER",
    buttons: [EXIT_BUTTON, NEXT_BUTTON],
    width: window.innerWidth * 0.5,
  });

  if (result === EXIT_BUTTON) return;

  /**
   * STEP 3
   */
  text = `<h1>Bridging the Gap</h1>
  <p>
    Instead of using the <b>Native App</b> as a <b>Client</b>, we are using the Client the extension lives in: Your Web browser. Just as your players will, you will use your web browser to connect to your server as a <b>client</b> and now everything is able to communicate: The dndbeyond page with the extension, and the extension with the installed <b>ddb-importer</b> module residing in your Foundry server.</p>
  </p>
  <p>Please note: Starting the <b>native App</b> is still required, because we still need a server - we are just replacing the client component of the Native App.</p>
  </p>
  <h2>I'm ready. Let's do this.</h2>
  <p>Four easy steps:</p>
  <ol>
     <li>Restart your server and launch your world, but <b>do not log in</b>.</li>
     <li>Open Chrome and head to <a href="${game.data.addresses.local}">${game.data.addresses.local}</a>.</li>
     <li>Login using your GM account. You can now do everything as by using the Native App as a client.</li>
     <li>With the Chrome tab now showing your Foundry server, you start communication by
     <ol>
     <li>opening the Chrome extension's popup menu by clicking at the tiny VTTA icon (<img style="position: relative; top: 9px; border: none" src="modules/ddb-importer/img/vtta-icon.png" width="24" height="24" />) in the top right.</li>
     <li>Click on the green <b>Connect to Foundry</b> button</li>
     <li>Enjoy your success</li>
     </ol>
     </li>
  </ol>
    <hr />`;
  // Welcome - hidden on "Next"
  result = await window.ddbimporter.hint.show(text, {
    align: "CENTER",
    buttons: [EXIT_BUTTON, NEXT_BUTTON],
    width: window.innerWidth * 0.5,
  });

  /**
   * STEP 4
   */
  text = `<h1>Did you know?</h1>
  <p>
    You can find the Invitation Link I used in the previous panel by openening the <b><i class="fas fa-cogs"></i> Game Settings</b>. You will find the <b>Game Invitation Links</b> at the very bottom.
  </p>
  <p>Use the
  <ul><li>
  <b>Local Network</b> link when you are connecting to yourself from the computer that runs the Foundry server</li>
  <li><b>Internet</b> link to send to your friends.</li>
  </p>
  <p>You can find more information on that on the <a href="https://foundryvtt.com/article/installation/" target="_blank">official Foundry VTT knowledge base</a>.</p>
   <hr />`;
  // Welcome - hidden on "Next"
  result = await window.ddbimporter.hint.show(text, {
    element: $("#sidebar"),
    align: "LEFT",
    buttons: [EXIT_BUTTON],
    width: window.innerWidth * 0.25,
  });
};
