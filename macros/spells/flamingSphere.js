const version = "10.0.13";
try {
    if (args[0].tag === "OnUse") {
        const casterToken = await fromUuid(args[0].tokenUuid);
        const caster = casterToken.actor;
        let sphereActor = game.actors.getName("Flaming Sphere");
        if (!sphereActor) {
            const jsonData = JSON.parse('{"name":"Flaming Sphere","type":"npc","img":"icons/magic/fire/orb-vortex.webp","data":{"abilities":{"str":{"value":10,"proficient":0},"dex":{"value":10,"proficient":0},"con":{"value":10,"proficient":0},"int":{"value":10,"proficient":0},"wis":{"value":10,"proficient":0},"cha":{"value":10,"proficient":0}},"attributes":{"ac":{"flat":10,"calc":"natural","formula":""},"hp":{"value":10,"min":0,"max":10,"temp":0,"tempmax":null,"formula":""},"init":{"value":0,"bonus":0},"movement":{"burrow":0,"climb":0,"fly":0,"swim":0,"walk":30,"units":"ft","hover":false},"senses":{"darkvision":0,"blindsight":0,"tremorsense":0,"truesight":0,"units":"ft","special":""},"spellcasting":"int","death":{"success":0,"failure":0}},"details":{"biography":{"value":"","public":""},"alignment":"","race":"","type":{"value":"","subtype":"","swarm":"","custom":""},"environment":"","cr":1,"spellLevel":0,"xp":{"value":10},"source":"","gender":"","age":"","height":"","weight":"","eyes":"","skin":"","hair":"","notes1name":"","notes2name":"","notes3name":"","notes4name":""},"traits":{"size":"med","di":{"value":[],"custom":""},"dr":{"value":[],"custom":""},"dv":{"value":[],"custom":""},"ci":{"value":[],"custom":""},"languages":{"value":[],"custom":""}},"currency":{"pp":0,"gp":0,"ep":0,"sp":0,"cp":0},"skills":{"acr":{"value":0,"ability":"dex"},"ani":{"value":0,"ability":"wis"},"arc":{"value":0,"ability":"int"},"ath":{"value":0,"ability":"str"},"dec":{"value":0,"ability":"cha"},"his":{"value":0,"ability":"int"},"ins":{"value":0,"ability":"wis"},"itm":{"value":0,"ability":"cha"},"inv":{"value":0,"ability":"int"},"med":{"value":0,"ability":"wis"},"nat":{"value":0,"ability":"int"},"prc":{"value":0,"ability":"wis"},"prf":{"value":0,"ability":"cha"},"per":{"value":0,"ability":"cha"},"rel":{"value":0,"ability":"int"},"slt":{"value":0,"ability":"dex"},"ste":{"value":0,"ability":"dex"},"sur":{"value":0,"ability":"wis"}},"spells":{"spell1":{"value":0,"override":null},"spell2":{"value":0,"override":null},"spell3":{"value":0,"override":null},"spell4":{"value":0,"override":null},"spell5":{"value":0,"override":null},"spell6":{"value":0,"override":null},"spell7":{"value":0,"override":null},"spell8":{"value":0,"override":null},"spell9":{"value":0,"override":null},"pact":{"value":0,"override":null}},"bonuses":{"mwak":{"attack":"","damage":""},"rwak":{"attack":"","damage":""},"msak":{"attack":"","damage":""},"rsak":{"attack":"","damage":""},"abilities":{"check":"","save":"","skill":""},"spell":{"dc":""}},"resources":{"legact":{"value":0,"max":0},"legres":{"value":0,"max":0},"lair":{"value":false,"initiative":0}}},"token":{"_id":"wsnEu8ZSbBYL5S9i","name":"Flaming Sphere","displayName":0,"actorId":"WlOopcsUtThmw4gy","actorLink":false,"actorData":{},"img":"icons/magic/fire/orb-vortex.webp","tint":null,"width":1,"height":1,"scale":1,"mirrorX":false,"mirrorY":false,"x":null,"y":null,"elevation":null,"lockRotation":false,"rotation":0,"effects":[],"alpha":1,"hidden":false,"vision":false,"dimSight":0,"brightSight":30,"dimLight":40,"brightLight":20,"sightAngle":0,"lightAngle":0,"lightColor":"#a2642a","lightAlpha":0.4,"lightAnimation":{"speed":5,"intensity":5,"type":"torch"},"disposition":1,"displayBars":0,"bar1":{"attribute":"attributes.hp"},"bar2":{"attribute":""},"flags":{"conditional-visibility":{"invisible":false,"obscured":false,"indarkness":false,"hidden":false,"_ste":null},"tokenmagic":{},"ActiveAuras":false,"monks-tokenbar":{"movement":null}},"tokenId":null,"randomImg":false},"items":[{"_id":"O9ThymNjpRlq26u1","name":"Flaming Sphere Damage","type":"weapon","img":"icons/magic/fire/orb-vortex.webp","data":{"description":{"value":"","chat":"","unidentified":""},"source":"","quantity":1,"weight":0,"price":0,"attunement":0,"equipped":true,"rarity":"","identified":true,"activation":{"type":"special","cost":0,"condition":""},"duration":{"value":null,"units":""},"target":{"value":null,"width":null,"units":"","type":""},"range":{"value":null,"long":null,"units":""},"uses":{"value":0,"max":"0","per":""},"consume":{"type":"","target":"","amount":null},"ability":"","actionType":"save","attackBonus":0,"chatFlavor":"","critical":null,"damage":{"parts":[["2d6","fire"]],"versatile":""},"formula":"","save":{"ability":"dex","dc":15,"scaling":"flat"},"armor":{"value":10},"hp":{"value":0,"max":0,"dt":null,"conditions":""},"type": {"value":"natural"},"properties":{"ada":false,"amm":false,"fin":false,"fir":false,"foc":false,"hvy":false,"lgt":false,"lod":false,"mgc":false,"rch":false,"rel":false,"ret":false,"sil":false,"spc":false,"thr":false,"two":false,"ver":false,"nodam":false,"fulldam":false,"halfdam":true},"proficient":true},"effects":[],"folder":null,"sort":1050000,"permission":{"default":3,"g4WGw0lAZ3nIhapn":3},"flags":{"betterRolls5e":{"critRange":{"type":"String","value":null},"critDamage":{"type":"String","value":""},"quickDesc":{"type":"Boolean","value":false,"altValue":false},"quickAttack":{"type":"Boolean","value":true,"altValue":true},"quickSave":{"type":"Boolean","value":true,"altValue":true},"quickDamage":{"type":"Array","value":[true],"altValue":[true],"context":{"0":""}},"quickVersatile":{"type":"Boolean","value":false,"altValue":false},"quickProperties":{"type":"Boolean","value":true,"altValue":true},"quickCharges":{"type":"Boolean","value":{"quantity":false,"use":false,"resource":true},"altValue":{"quantity":false,"use":true,"resource":true}},"quickTemplate":{"type":"Boolean","value":true,"altValue":true},"quickOther":{"type":"Boolean","value":true,"altValue":true,"context":""},"quickFlavor":{"type":"Boolean","value":true,"altValue":true},"quickPrompt":{"type":"Boolean","value":false,"altValue":false}},"midi-qol":{"onUseMacroName":""},"core":{"sourceId":"Item.os6WBKZ9m8aOjecL"},"magicitems":{"enabled":false,"equipped":false,"attuned":false,"charges":"0","chargeType":"c1","destroy":false,"destroyFlavorText":"reaches 0 charges: it crumbles into ashes and is destroyed.","rechargeable":false,"recharge":"0","rechargeType":"t1","rechargeUnit":"r1","sorting":"l"}}}],"tint":null,"selectedKey":"data.abilities.cha.dc","sort":0,"flags":{"tidy5e-sheet":{"allow-edit":true},"midi-qol":{"flamingSphere":"Scene.xMH6dt9g5Wt35rd3.Token.BLiAIGMjLp2oRc5L"},"exportSource":{"world":"testWorld","system":"dnd5e","coreVersion":"0.8.9","systemVersion":"1.4.3"},"dae":{"damageApplied":6}}}')
            await MidiQOL.socket().executeAsGM("createActor", {actorData: jsonData});
        }
        sphereActor = game.actors.getName("Flaming Sphere");
        if (!sphereActor) {
            console.error("No Flaming Sphere");
            return;
        }
        const changeValue = `turn=end,saveDC=${caster.data.data.attributes.spelldc ?? 10},saveAbility=dex,damageRoll=${args[0].spellLevel}d6,damageType=fire,saveDamage=halfdamage,saveRemove=false,killAnim=true`;
        const updates = {
            Item: {
                "Flaming Sphere Damage": {
                    "data.damage.parts": [[`${args[0].spellLevel}d6`, "fire"]],
                    "data.save.dc": caster.data.data.attributes.spelldc
                }
            },
            ActiveEffect: {
                "Flaming Sphere Damage": {
                    "changes":  [{"key":"flags.midi-qol.OverTime","mode":5,"value": changeValue,"priority":"20"}],
                    "disabled": false,
                    "label": "Flaming Sphere Damage",
                    "name": "Flaming Sphere Damage",
                    "icon": "icons/magic/fire/orb-vortex.webp",
                    "flags": {
                        "ActiveAuras": {
                            "isAura":true,
                            "aura":"All",
                            "radius":7.5,
                            "alignment":"",
                            "type":"",
                            "ignoreSelf":true,
                            "height":true,
                            "hidden":false,
                            "hostile":false,
                            "onlyOnce":false
                        }
                    },
                }
            }
        };
        const summoned = await warpgate.spawn("Flaming Sphere", {embedded: updates}, {}, {});
        if (summoned.length !== 1) return;
        const summonedUuid = canvas.scene.tokens.get(summoned[0]).uuid;
        console.error("uuid is ", summonedUuid);
        await caster.createEmbeddedDocuments("ActiveEffect", [{
            "changes":  [{"key":"flags.dae.deleteUuid","mode":5,"value": summonedUuid,"priority":"30"}],
            "label": "Flaming Sphere Summon",
            "name": "Flaming Sphere Summon",
            "duration": {seconds: 60, rounds: 10},
            "origin": args[0].itemUuid,
            "icon": "icons/magic/fire/orb-vortex.webp",
        }]);
    }
} catch (err) {
    console.error(`${args[0].itemData.name} - Flaming Sphere ${version}`, err);
}
