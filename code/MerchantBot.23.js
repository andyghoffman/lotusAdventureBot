//load_file("C:/GitHub/lotusAdventureBot/code/MerchantBot.23.js");

function startMerchantBot()
{
	Settings["PotionStock"] = 5000;
	Settings["LowPotions"] = 1000;
	
	game.on("stateChanged", onMerchantStateChanged);
	game.on("codeMessage", onMerchantCM);
	game.on("idle", onMerchantIdle);
	
	Intervals["Mluck"] = setInterval(()=>
	{
		if (!checkMluck(character))
		{
			use_skill("mluck", character);
		}

		for (let e in parent.entities)
		{
			let entity = get_player(e);
			if (entity && !checkMluck(entity) && is_in_range(entity, "mluck"))
			{
				use_skill("mluck", entity);
			}
		}
		
	}, 250);

	log(character.name + " MerchantBot loaded!");
}

function onMerchantCM(data)
{
	let sender = data.sender;
	data = data.data;
	
	switch (data.message)
	{
		case "NeedPotions":
			if(quantity("hpot1") >= Settings["LowPotions"] && quantity("mpot1") >= Settings["LowPotions"])
			{
				deliverPotions(sender, data);
			}
			else if(!getState("NeedPotions"))
			{
				setState("NeedPotions");	
			}
			break;
	}
}

function onMerchantStateChanged(newState)
{
	stopTownInterval();
	parent.close_merchant();
	
	switch (newState)
	{
		case "Town":
			enterTownMode();
			break;
	}
}

function onMerchantIdle()
{
	if(isInTown())
	{
		setState("Town");		
	}
}


function sellVendorTrash()
{
	for (let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if (item && Settings["VendorTrash"].includes(item.name) && !isShiny(item))
		{
			log("Selling " + item.name + " to vendor.");
			sell(i, item.q);
		}
	}
}

function townInterval()
{
	if ((is_moving(character) || smart.moving) && parent.stand)
	{
		parent.close_merchant();
	} 
	else if (!parent.stand && !(is_moving(character) && smart.moving))
	{
		parent.open_merchant(locate_item("stand0"));
	}

	if (!character.q.upgrade && !character.q.compound)
	{
		craftUpgrades();
		craftCompounds();
	}
	
	sellVendorTrash();
}

function checkMluck(target)
{
	let mLuckDuration = 3600000;
	return /*(target.s.mluck && target.s.mluck.f === ) ||*/ (target.s.mluck && target.s.mluck.ms > mLuckDuration * 0.25);
}

function enterTownMode()
{
	if (character.map !== Settings["HomeMap"])
	{
		travelTo(Settings["HomeMap"], () =>
		{
			setState("Town");
		});
	} 
	else
	{
		if (distance(character, Settings["HomeCoords"]) > 200)
		{
			use_skill("use_town");
			setTimeout(() =>
			{
				enterTownMode();
			}, 7500);
		} else
		{
			smart_move(Settings["HomeCoords"], () =>
			{
				log("Starting town interval.");
				Intervals["TownInterval"] = setInterval(townInterval, 250);
			});
		}
	}
}

function stopTownInterval()
{
	if (!Intervals["TownInterval"])
	{
		return;
	}

	clearInterval(Intervals["TownInterval"]);
	Intervals["TownInterval"] = null;
}

function deliverPotions(sender, data)
{
	let target = get_player(sender);

	if (getState("Delivering") && Flags["DeliverTarget"] === sender && !is_moving(character) && !smart.moving)
	{
		writeToLog("Delivering potions to " + sender);
		
		if(!target)
		{
			travelTo(data.location.map, data.location.position);
		}
		else
		{
			stop();
			approach(target);
		}
	} 
	else if(!getState("Delivering") && !getState("NeedPotions") && !is_moving(character) && !smart.moving)
	{
		travelTo(data.location.map, {x: data.location.x, y: data.location.y}, () =>
		{
			setState("Delivering");
			Flags["DeliverTarget"] = sender;
		});
	}

	if (target && distance(character, target) < 100)
	{
		if (data.hpots > 0)
		{
			writeToLog("Delivering " + data.hpots + " health potions to " + sender);
			send_item(sender, locate_item("hpot1"), data.hpots);
		}

		if (data.mpots > 0)
		{
			writeToLog("Delivering " + data.mpots + " mana potions to " + sender);
			send_item(sender, locate_item("mpot1"), data.mpots);
		}

		Flags["DeliverTarget"] = null;
		setState("Delivery", false);
	}
}