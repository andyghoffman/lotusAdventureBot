//load_file("C:/GitHub/lotusAdventureBot/code/StandardBot.22.js");

let Settings = {};
let State = {};
let Intervals = {};

function startBotCore(settings)
{
	game.on("stateChanged", onStateChanged);

	initBotComms();
	loadSettings(settings);
	
	Intervals["Loot"] = setInterval(()=>
	{
		loot();
	}, 100);

	Intervals["Potions"] = setInterval(() =>
	{
		usePotions();
	}, 100);
	
	log(character.name + " standardBot loaded!");
	
	setState("Idle");
}

function usePotions()
{
	if (character.rip)
	{
		return;
	}

	let hPotRecovery = 500;//G.items[Potions[0]].gives.hp;
	let mPotRecovery = 500;//G.items[Potions[1]].gives.mp;

	if ((character.hp <= (character.max_hp - hPotRecovery) || character.mp <= (character.max_mp - mPotRecovery)) || getState("Idle") )
	{
		use_hp_or_mp();
	}
}

function startCombatInterval()
{
	if(Intervals["Combat"])
	{
		log("Combat interval already started!");
		return;
	}
	
	log("Combat interval starting.");

	Intervals["Combat"] = setInterval(() =>
	{
		let target = findTarget(Settings["FarmMonster"]);
		
		if(target)
		{
			if(characterCombat(target))
			{
				return;
			}

			autoAttack(target);
		}
		
	}, 50);
}

function stopCombatInterval()
{
	clearInterval(Intervals["Combat"]);
	Intervals["Combat"] = null;
}

function autoAttack(target)
{
	if(!target || character.mp < character.mp_cost)
	{
		return false;
	}
	
	if (!is_in_range(target, "attack"))
	{
		approach(target);
	}
	else if (!is_on_cooldown("attack"))
	{
		reduce_cooldown("attack", character.ping);
		
		attack(target).then((message) =>
		{

		}).catch((message) =>
		{
			//log(character.name + " attack failed: " + message.reason);
		});
		
		return true;
	}
	
	return false;
}

function approach(target)
{
	if(is_moving(character) || smart.moving)
	{
		return;
	}
	
	let adjustment = {x:0, y:0};
	
	if(target.x && target.y)
	{
		adjustment.x = character.x + (target.x - character.x) * 0.3;
		adjustment.y = character.y + (target.y - character.y) * 0.3;
		
		if(distance(character, adjustment) < character.range)
		{
			move(adjustment.x, adjustment.y);
		}
		else
		{
			smart_move(adjustment);
		}
	}
}

function findTarget(mtype)
{
	let target = get_targeted_monster();
	
	if(!target || target.rip)
	{
		target = get_nearest_monster({type: mtype, target: character.name});
	}
	
	if(!target || target.rip)
	{
		for (let p of parent.party_list)
		{
			if (p !== character.name)
			{
				target = get_nearest_monster({target: p});
				break;
			}
		}
	}
	
	if(!target || target.rip)
	{
		target = get_nearest_monster({type: mtype, no_target: true});
	}
	
	change_target(target);
	return target;
}

function beginFarming()
{
	log("Traveling to farming location.");
	travelTo(Settings["FarmMap"], getFarmLocation(), ()=>
	{
		setState("Farming"); 
	});
}

function travelTo(map, coords=null, onComplete=()=>{})
{
	setState("Traveling");
	
	if (character.map !== map)
	{
		smart_move(map, () =>
		{
			if(coords != null)
			{
				smart_move(coords, () =>
				{
					setState("Traveling", false);
					onComplete();
				});		
			}
			else
			{
				setState("Traveling", false);
				onComplete();
			}
		});
	} 
	else
	{
		smart_move(coords, () =>
		{
			setState("Traveling", false);
			onComplete();
		});
	}	
}

function getFarmLocation()
{
	let coords = {x: 0, y: 0};

	let monster = G.maps[Settings["FarmMap"]].monsters.find((x) =>
	{
		if (x.type === Settings["FarmMonster"] && x.count === Settings["FarmSpawn"]) return x;
	});

	coords.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
	coords.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);
	
	return coords;
}

function onStateChanged(newState)
{
	log("State changed to: " + newState);
	
	switch (newState)
	{
		case "Farming":
			startCombatInterval();
			break;
	}
}

function setState(state, isTrue=true)
{
	if(isTrue)
	{
		for (let s in State)
		{
			State[s] = false;
		}

		game.trigger("stateChanged", state);
	}
	
	State[state] = isTrue;
}

function getState(state)
{
	if(!state)
	{
		for (let s in State)
		{
			if(State[s])
			{
				return s;
			}
		}
	}
	else
	{
		return State[state];
	}
}

function loadSettings(settings)
{
	for (let s in settings)
	{
		Settings[s] = settings[s];

		log(s + ": " + Settings[s]);

		switch (s)
		{
			case "":
				break;
		}
	}	
}