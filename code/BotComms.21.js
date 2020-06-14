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
	
	if (!RecievedMessages[sender])
	{
		RecievedMessages[sender] = [data];
	} 
	else
	{
		RecievedMessages[sender].push(data);
	}
	
	switch (data.message)
	{
		default:
			// log(character.name + " recieved unexpected cm format from " + sender);
			// show_json(data);
			return;
	}
}

function sendCodeMessage(recipient, data, storeMessage = true)
{
	if (!data.message || recipient === character.name)
	{
		log(character.name + " tried to send unexpected cm format to " + recipient);
		show_json(data);
		return;
	}
	
	send_cm(recipient, data);
	
	if(!storeMessage)
	{
		return;
	}
	
	if(!SentMessages[recipient])
	{
		SentMessages[recipient] = [data];
	}
	else
	{
		SentMessages[recipient].push(data);
	}
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
	return parent.X.characters.filter((x) =>
	{
		return x.type === "merchant" && x.online > 0;
	})[0];
}