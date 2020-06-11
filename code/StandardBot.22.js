//load_file("C:/GitHub/lotusAdventureBot/code/StandardBot.22.js");

let Settings = {};
let State = {};

function startStandardBot(settings)
{
	game.on("stateChanged", onStateChanged);

	initBotComms();
	loadSettings(settings);
	
	log(character.name + " standardBot loaded.");
	
	setState("Idle");
}

function beginFarming()
{
	log("Traveling to farming location.");
	
	let coords = {x: 0, y: 0};

	let monster = G.maps[Settings["FarmMap"]].monsters.find((x) => { if (x.type === Settings["FarmMonster"] && x.count === Settings["FarmSpawn"]) return x; });
	
	coords.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
	coords.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);
	
	if(character.map !== Settings["FarmMap"])
	{
		setState("Traveling");

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