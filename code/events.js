// 	reference:
//	https://adventure.land/docs/code/game/events

//	Level Up Event
game.on("level_up", (data) =>
{
	writeToLog(data.name + " is now level " + data.level + "!");
});

//	Action Event (character is the source of the action)
game.on("action", (data) =>
{

});

//	On Hit Event (character was hit by something)
game.on("hit", (data) =>
{

});

//	On Death Event
game.on("death", (data) =>
{
	if (partyList.includes(data.id))
	{
		writeToLog(data.id + " died");
	}
});

//	Server shutdown Event
game.on("shutdown", (data) =>
{
	writeToLog("Server shutting down");
});

//	API Response
game.on("api_response", (data) =>
{

});