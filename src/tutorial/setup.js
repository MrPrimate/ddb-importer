export default async () => {
  // // see if we should actually run the tutorial
  // let tutorialStep = 0; //game.settings.get("ddb-importer", "tutorial-step");
  // // Do not play the tutorial if it was completed already
  // if (tutorialStep === -1) return;
  // // Do not play the tutorial of the current user did not start the setup process
  // if (tutorialStep > 0 && game.user.data._id !== game.settings.get("ddb-importer", "tutorial-user")) return;
  // let hint;
  // if (tutorialStep === 0) {
  //   let gms = game.users.entities
  //     .filter((user) => user.isGM && user.active)
  //     .map((user) => ({ _id: user.data._id, name: user.data.name }));
  //   let text = `<h1>Welcome to DDB Importer!</h1><p>Let's go through some easy setup steps together in order to get you started.</p>
  //   <hr />`;
  //   if (gms.length > 1) {
  //     text = `<h1>Welcome to DDB Importer!</h1><p>Let's go through some easy setup steps together in order to get you started.</p>
  //     <p><b>Note</b>: There are ${gms.length} Gamemasters (${gms
  //       .map((gm) => gm.name)
  //       .join(", ")}) logged in right now and only one can go through the steps.
  //     The Gamemaster that clicks <b>Next</b> below will continue the setup process and the other's will be benched.</p>
  //     <hr />`;
  //   }
  //   // Welcome - hidden on "Next"
  //   hint = await window.ddbimporter.hint.show(text, {
  //     align: "CENTER",
  //     next: true,
  //     width: window.innerWidth * 0.5,
  //   });
  //   // the first one will continue, the rest will not
  //   if (
  //     game.settings.get("ddb-importer", "tutorial-user") === "" ||
  //     game.settings.get("ddb-importer", "tutorial-user") === game.user.data._id
  //   ) {
  //     game.settings.get("ddb-importer", "tutorial-user", game.user.data._id);
  //     tutorialStep++;
  //     game.settings.set("ddb-importer", "tutorial-step", tutorialStep);
  //   } else {
  //     return;
  //   }
  // }
  // if (tutorialStep === 1) {
  //   // Sidebar - hidden when Compendium is clicked.
  //   hint = await window.ddbimporter.hint.show(
  //     `<h1>Sidebar</h1>
  //      <p>This sidebar is your main administrational area. Along the <b><i class="fas fa-comments"></i> Chat Log</b> and
  //        <b><i class="fas fa-fist-raised"></i> Combat Tracker</b>, you will find the content-related sections you will be using
  //        quite a bit as the Gamemaster, especially with: </p>
  //     <ul>
  //     <li><b><i class="fas fa-map"></i> Scenes Directory</b>: Battlemaps</li>
  //     <li><b><i class="fas fa-users"></i> Actors Directory</b>: Monsters, NPCs and Player characters</li>
  //     <li><b><i class="fas fa-suitcase"></i> Items Directory</b>: Items like Equipment, but also
  //       Spells, Tools, Weapons. Items is a very broad category in Foundry VTT</li>
  //     <li><b><i class="fas fa-book-open"></i> Journal Entries</b>: Descriptions, Session logs, everything text and images </li>
  //     <li><b><i class="fas fa-th-list"></i> Rollable Tables</b>: Spice up your games by adding a pint of randomness into it</li>
  //     <li><b><i class="fas fa-atlas"></i> Compendium Packs</b>: Think of those as large dictionaries. You can store the items above in these</li>
  //     <li><b><i class="fas fa-cogs"></i> Game Settings</b></li>
  //     </ul>
  //     <hr />
  //     <p>Let's head over to the Compendiums first. Click on the compendium icon <b><i class="fas fa-atlas"></i> Compendium Packs</b> in the sidebar to continue.</p>
  //    `,
  //     {
  //       element: $("#sidebar"),
  //       align: "LEFT",
  //       hide: {
  //         selector: '#sidebar-tabs a[data-tab="compendium"]',
  //         event: "click",
  //       },
  //       width: 400,
  //     }
  //   );
  //   tutorialStep++;
  //   game.settings.set("ddb-importer", "tutorial-step", tutorialStep);
  // }
  // if (tutorialStep === 2) {
  //   // next step is triggered when the sidebar compendium entry is clicked
  //   hint = await window.ddbimporter.hint.show(
  //     `<h1>Compendium Packs</h1>
  //     <p>Compendiums are like big dictionaries, specialized in keeping one type of entity in them. You can create compendium to store all helpful people your party might have met on their journey,
  //     all the wondrous items they gathered (and lost again), all scenes you have used or plan to use in the future. Or a collection of monsters that will go hard on your group (I know you like that idea).</p>
  //     <p>You can see that there two larger sections within the Sidebar: <b>Actor</b> and <b>Item</b> which both are <b>entity types</b> known to Foundry and while there are others, these are the ones you will mostly use.</p>
  //     <p>For ddb-importer, we do need three compendiums reflecting the three categories of content we can import from D&amp;D Beyond: Monsters. Spells. Items.</p>
  //     <p>Let's create the three corresponding compendiums:</p>
  //         <ul>
  //         <li>one Compendium containing the entity type <b>Actor</b> for the imported Monsters,</li>
  //         <li>one Compendium containing the entity type <b>Item</b> for the imported Items and</li>
  //         <li>one Compendium containing the entity type <b>Item</b> for the imported Spells</li>
  //         </ul>
  //         <p><i>"What, no entity type 'Spell'?</i>" No, that's not a typo. Almost everything in Foundry is an item.</p>
  //         <p><b>Naming</b> - You can name the compendiums however you want, it's only important that it speaks to you.</p>
  //         <hr />
  //         <p>Click on the <b><i class="fas fa-atlas"></i></b> Compendium Packs</b> button at the bottom of the sidebar to continue.</p>
  //        `,
  //     {
  //       element: $("#sidebar"),
  //       align: "LEFT",
  //       hide: {
  //         selector: '#sidebar section[data-tab="compendium"] footer.directory-footer button[type="submit"]',
  //         event: "click",
  //       },
  //       width: 400,
  //     }
  //   );
  //   tutorialStep++;
  //   game.settings.set("ddb-importer", "tutorial-step", tutorialStep);
  // }
  // CONFIG.debug.hooks = true;
  // if (tutorialStep === 3) {
  //   // next step is triggered when the create compendium dialog is appearing
  //   console.log("Waiting for dialog");
  //   await wait(10);
  //   //let dialog = await waitForDialog("compendium-create");
  //   console.log("Dialog shown");
  //   hint = await window.ddbimporter.hint.show(
  //     `<h1>Monster Compendium</h1>
  //     <p>Let's create the monster compendium first:</p>
  //     <ul>
  //       <li>Find a suitable name, e.g. <b>My DDB Monsters</b>, <b>Monster Import</b> or <b>Bloody Hell!</b></li>
  //       <li>Leave the <b>Entity Type</b> on it's default <b>Actor</b></li>
  //     </ul>
  //     <p>Press <b><i class="fas fa-check"></i> Create Compendium</b> to continue.</p>
  //        `,
  //     {
  //       element: $("#compendium-create").parent().parent().parent(),
  //       align: "LEFT",
  //       hide: {
  //         selector: $('#compendium-create button[data-button="create"]'),
  //         event: "click",
  //       },
  //       buttons: {
  //         next: "Next",
  //       },
  //     }
  //   );
  //   tutorialStep++;
  //   game.settings.set("ddb-importer", "tutorial-step", tutorialStep);
  // }
};
