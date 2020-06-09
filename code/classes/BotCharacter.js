class BotCharacter
{
	Name = "";
	AutoPlay = FullAuto;
	CraftingOn = CraftingEnabled;
	AloneChecking = false;
	FarmingModeActive = false;
	ReadyChecking = false;
	Traveling = false;
	GoingBackToTown = false;
	Banking = false;
	NoElixirs = false;
	IsStuck = false;
	WhosReady = {leader: false, merchant: false, codeBotOne: false, codeBotTwo: false};
	SentRequests = [];
	MainInterval;
	LateInterval;
	
	constructor(name)
	{
		this.Name = name;
	}
	
	startCharacter(mainInterval, lateInterval)
	{
		this.MainInterval = setInterval(mainInterval, 250);
		this.LateInterval = setInterval(lateInterval, 5000);
	}
	
	stopCharacterProcess()
	{
		clearInterval(this.MainInterval);
		clearInterval(this.LateInterval);
	}
}