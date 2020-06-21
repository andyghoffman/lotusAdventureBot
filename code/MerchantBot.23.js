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
		if(character.rip)
		{
			return;
		}
		
		if (!checkMluck(character))
		{
			use_skill("mluck", character);
		}

		for (let e in parent.entities)
		{
			let entity = parent.entities[e];
			if (entity && entity.player && !entity.npc && !checkMluck(entity) && is_in_range(entity, "mluck"))
			{
				log("Mlucking " + entity.name);
				use_skill("mluck", entity);
			}
		}
		
	}, 250);

	log(character.name + " MerchantBot loaded!");
}

function onMerchantCM(data)
{
	if(character.rip)
	{
		return;
	}
	
	let sender = data.sender;
	data = data.data;
	
	switch (data.message)
	{
		case "NeedElixir":
			if (getState("Delivering") || getElixirInventorySlot(data.elixir) == null)
			{
				break;
			}
			deliverElixir(sender, data);
		case "NeedPotions":
			if(getState("Delivering"))
			{
				break;
			}
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
		case "Dead":
			if(Intervals["Deliver"])
			{
				Flags["DeliverTarget"] = null;
				clearInterval(Intervals["Deliver"]);				
			}
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
	if (is_moving(character) || smart.moving)
	{
		parent.close_merchant();
	} 
	else if (!parent.stand && !is_moving(character) && !smart.moving)
	{
		parent.open_merchant(locate_item("stand0"));
	}
	
	if(!isInTown())
	{
		return;
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
		travelTo(Settings["HomeMap"], null,() =>
		{
			setState("Town");
		});
	} 
	else
	{
		if (!isInTown())
		{
			use_skill("use_town");
			setTimeout(() =>
			{
				enterTownMode();
			}, 7500);
		} 
		else
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
	deliverTo(sender, data, ()=>
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
	});
}

function deliverElixir(deliverToName, data)
{
	deliverTo(deliverToName, data, ()=>
	{
		writeToLog("Delivering " + data.elixir + " to " + deliverToName);
		send_item(deliverToName, getElixirInventorySlot(data.elixir), 1);
	});
}

function deliverTo(deliverToName, data, deliverFunction)
{
	if (getState("Delivering") || getState("NeedPotions") || is_moving(character) || smart.moving || Intervals["Deliver"] != null)
	{
		return;
	}

	travelTo(data.location.map, data.location.position, () =>
	{
		if (!get_player(deliverToName))
		{
			deliverPotions(deliverToName, data);
			return;
		}

		writeToLog("Delivering to " + deliverToName);
		Flags["DeliverTarget"] = deliverToName;
		setState("Delivering");

		Intervals["Deliver"] = setInterval(() =>
		{
			let target = get_player(deliverToName);

			if (!target)
			{
				Flags["DeliverTarget"] = null;
				setState("Delivering", false);
				clearInterval(Intervals["Deliver"]);
				Intervals["Deliver"] = null;
				return;
			}

			approach(target);
			
			if (target && distance(character, target) < 100)
			{
				deliverFunction();
				
				Flags["DeliverTarget"] = null;
				setState("Delivering", false);
				clearInterval(Intervals["Deliver"]);
				Intervals["Deliver"] = null;
				return;
			}

			if (!is_moving(character) && !smart.moving && !target)
			{
				stop();
				travelTo(data.location.map, data.location.position);
			}

		}, 1000);
	});
}