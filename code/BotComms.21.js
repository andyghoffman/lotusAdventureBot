//load_file("C:/GitHub/lotusAdventureBot/code/BotComms.21.js");

const SentMessages = {};
const RecievedMessages = {};
const WhiteList = [];
let commsInterval;

function initBotComms()
{
	parent.X.characters.forEach((x)=>
	{
		WhiteList.push(x.name);
	});
	
	commsInterval = setInterval(commsLoop, 1000);
	sendPartyInvites();
}

function commsLoop()
{
	checkSentMessages();
	checkRecievedMessages();
}

function on_cm(sender, data)
{
	if (!WhiteList.includes(sender))
	{
		log(character.name + " recieved unexpected cm from " + sender);
		show_json(data);
		return;
	}
	else if (!data.message)
	{
		log(character.name + " recieved unexpected cm format from " + sender);
		show_json(data);
		return;
	}

	game.trigger("codeMessage", {sender:sender, data:data});
	
	// if (!RecievedMessages[sender])
	// {
	// 	RecievedMessages[sender] = [data];
	// } 
	// else
	// {
	// 	RecievedMessages[sender].push(data);
	// }
	
	switch (data.message)
	{
		case "party":
			if(parent.party_list.length > 1)
			{
				send_party_invite(sender);
			}
	}
}

function on_party_invite(inviter)
{
	log(character.name + " recieved party invite from " + inviter);

	if (WhiteList.includes(inviter))
	{
		if(parent.party_list.length <= 1)
		{
			accept_party_invite(inviter);
		}
		else if(Settings["Party"].includes(inviter))
		{
			send_party_invite(inviter);
		}
	}
}

function sendCodeMessage(recipient, data)
{
	if (!data.message || recipient === character.name)
	{
		log(character.name + " tried to send unexpected cm format to " + recipient);
		show_json(data);
		return;
	}
	
	if(!data.location)
	{
		data.location = 
			{
				map: character.map,
				position: {x: character.x, y: character.y}
			}
	}
	
	send_cm(recipient, data);

	// if(!SentMessages[recipient])
	// {
	// 	SentMessages[recipient] = [data];
	// }
	// else
	// {
	// 	SentMessages[recipient].push(data);
	// }
}

function checkIfMessageSent(recipient, message)
{
	if(SentMessages[recipient])
	{
		for (let data of SentMessages[recipient])
		{
			if (data.message === message)
			{
				return true;
			}
		}		
	}
	
	return false;
}

function checkIfMessageRecieved(message)
{
	for (let sender in RecievedMessages)
	{
		for (let data of sender)
		{
			if(data.message === message)
			{
				return true;
			}
		}
	}

	return false;
}


function checkSentMessages()
{
	for(let recipient in SentMessages)
	{
		for(let data of recipient)
		{
			
		}
	}
}

function checkRecievedMessages()
{
	for(let sender in RecievedMessages)
	{
		for (let data of sender)
		{

		}
	}
}

function getOnlineCharacters()
{
	return parent.X.characters.filter((x) => { return x.online > 0; });
}

function getOnlineMerchant()
{
	let merchants = parent.X.characters.filter((x) =>
	{
		return x.type === "merchant" && x.online > 0;
	});
	
	if(merchants.length > 0)
	{
		return merchants[0];
	}
	else
	{
		return false;
	}
}

function getOnlineMage()
{
	return parent.X.characters.filter((x) =>
	{
		return x.type === "mage" && x.online > 0;
	})[0];
}

function requestMerchant(message)
{
	let merchant = getOnlineMerchant();
	
	if(merchant)
	{
		sendCodeMessage(merchant.name, message);		
		return true;
	}
	else
	{
		return false;
	}

}

function sendPartyInvites()
{
	for(let index in Settings["Party"])
	{
		let name = Settings["Party"][index];
		if(name === character.name)
		{
			continue;
		}
		
		let cm = {message:"party"};
		send_party_invite(name);
		sendCodeMessage(name, cm);
	}
}

function reloadCharacters()
{
	for (let i = 0; i < parent.X.characters.length; i++)
	{
		let name = parent.X.characters[i].name;
		if (name !== character.name && get_active_characters()[name])
		{
			reloadCharacter(name);
		}
	}

	setTimeout(() =>
	{
		reloadCharacter(character.name);
	}, 1000);
}

function reloadCharacter(name)
{
	if(!name)
	{
		name = character.name;
	}
	
	if (name === character.name)
	{
		say("/pure_eval setTimeout(()=>{parent.start_runner()}, 500)");
		parent.stop_runner();
	} 
	else
	{
		command_character(name, "say(\"/pure_eval setTimeout(()=>{start_runner()}, 500)\")");
		command_character(name, "say(\"/pure_eval stop_runner();\")");
	}
}

function stopRunners()
{
	for (let i = 0; i < parent.X.characters.length; i++)
	{
		let name = parent.X.characters[i].name;
		if (name !== character.name && get_active_characters()[name])
		{
			stop_character(name);
		}
	}
}

function loadAllRunners()
{
	for (let i = 0; i < Settings["Party"].length; i++)
	{
		let name = Settings["Party"][i];
		let online = parent.X.characters.filter((x) => { return x.name === name && x.online > 0; }).length > 0;
		if (name !== character.name && !get_active_characters()[name] && !online)
		{
			log("Loading " + name + " as code runner");
			start_character(name, "Start");
		}
	}
}

function xpReport()
{
	let output = []

	for (let p of parent.X.characters)
	{
		let player = get_player(p);

		if (player)
		{
			let percent = (player.xp / G.levels[player.level]) * 100;
			output.push(player.name + ": L" + player.level + " with " + percent.toLocaleString(undefined, {maximumFractionDigits: 2}) + "%");
		}
	}

	show_json(output);
}