//load_file("C:/GitHub/lotusAdventureBot/code/BotComms.21.js");

const SentMessages = {};
const RecievedMessages = {};
let commsInterval;

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
			log(character.name + " recieved unexpected cm format from " + sender);
			show_json(data);
			return;
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
	
	send_cm(recipient, data);
	
	if(!SentMessages[recipient])
	{
		SentMessages[recipient] = [data];
	}
	else
	{
		SentMessages[recipient].push(data);
	}
}

function initBotComms()
{
	commsInterval = setInterval(commsLoop, 1000);
}

function commsLoop()
{
	checkSentMessages();
	checkRecievedMessages();
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