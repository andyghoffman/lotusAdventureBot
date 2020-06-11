//load_file("C:/GitHub/lotusAdventureBot/code/StandardBot.22.js");

let Settings = {};

let State = 
{
	"Idle":true,
	"Traveling":false,
	"Farming":false
}

function startStandardBot(settings)
{
	loadSettings(settings);
}

function setState(state, isTrue)
{
	if(isTrue)
	{
		for (let s in State)
		{
			State[s] = false;
		}		
	}
	
	State[state] = isTrue;
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