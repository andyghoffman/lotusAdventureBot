//load_file("C:/GitHub/lotusAdventureBot/code/StandardBot.22.js");

let Settings = 
	{
		
	};

let State = {};
let Intervals = {};

function startStandardBot(settings)
{
	game.on("stateChanged", onStateChanged);

	initBotComms();
	loadSettings(settings);
	
	log(character.name + " standardBot loaded.");
	
	setState("Idle");
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
			autoAttack(target);
		}
		
	}, 250);
}

function autoAttack(target)
{
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
			log(character.name + " attack failed: " + message.reason);
		});
	}
}

function approach(target)
{
	let coords = {x:character.x, y:character.y};
	let adjustment = {x:0, y:0};
	
	if(target.x && target.y)
	{
		adjustment.x = character.x + (target.x - character.x) * 0.3;
		adjustment.y = character.y + (target.y - character.y) * 0.3;
		
		if(distance(character, adjustment) < 100)
		{
			move(adjustment);
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
	
	if(!target)
	{
		target = get_nearest_monster({type: mtype, target: character.name});
	}
	
	if(!target)
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
	
	if(!target)
	{
		target = get_nearest_monster({type: mtype, no_target: true});
	}
	
	return target;
}

function beginFarming()
{
	log("Traveling to farming location.");
	setState("Traveling");
	
	let coords = {x: 0, y: 0};

	let monster = G.maps[Settings["FarmMap"]].monsters.find((x) => { if (x.type === Settings["FarmMonster"] && x.count === Settings["FarmSpawn"]) return x; });
	
	coords.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
	coords.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);
	
	if(character.map !== Settings["FarmMap"])
	{
		smart_move(Settings["FarmMap"], ()=>
		{
			smart_move(coords, () =>
			{
				setState("Farming");
			});
		});
	}
	else
	{
		smart_move(coords, () =>
		{
			setState("Farming");
		});
	}
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