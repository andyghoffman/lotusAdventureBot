//load_file("C:/GitHub/lotusAdventureBot/code/MerchantBot.23.js");

let Deliveries = {};

function startMerchantBot()
{
	game.on("stateChanged", onMerchantStateChanged);
	game.on("codeMessage", onMerchantCM);
	game.on("idle", onMerchantIdle);

	log(character.name + " MerchantBot loaded!");
}

function onMerchantCM(data)
{
	let sender = data.sender;
	data = data.data;
	
	// if (getState("Town") !== true && getState("Idle") !== true)
	// {
	// 	return;
	// }

	switch (data.message)
	{
		case "NeedPotions":
			if(quantity("hpot1") >= Settings["PotionStock"] && quantity("mpot1") >= Settings["PotionStock"])
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

function townInterval()
{
	if ((is_moving(character) || smart.moving) && parent.stand)
	{
		parent.close_merchant();
	} else if (!parent.stand && !(is_moving(character) || smart.moving))
	{
		parent.open_merchant(locate_item("stand0"));
	}

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

	if (!character.q.upgrade && !character.q.compound)
	{
		craftUpgrades();
		craftCompounds();
	}
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
	} else
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

	if (getState("Delivering") && !is_moving(character) && !smart.moving)
	{
		log("Delivering potions...");
		
		if(!target)
		{
			travelTo(data.location.map, {x: data.location.x, y: data.location.y});
		}
		else
		{
			approach(target);

			if (distance(character, target) < 200)
			{
				send_item(sender, locate_item("hpot1"), data.hpots);
				send_item(sender, locate_item("mpot1"), data.mpots);

				setState("Delivering", false);
			}
		}
	} 
	else if(!getState("Delivering") && !is_moving(character) && !smart.moving)
	{
		travelTo(data.location.map, {x: data.location.x, y: data.location.y}, () =>
		{
			setState("Delivering");
		});
	}
}