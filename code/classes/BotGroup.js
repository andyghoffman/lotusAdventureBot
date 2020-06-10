class BotGroup
{
	constructor(characterNames, groupBehaviour)
	{
		this.Characters = {};

		for (let c of characterNames)
		{
			this.Characters[c] = new BotCharacter(c, groupBehaviour);
		}

		this.GroupController = this.Characters[character.name];
		this.Behaviour = groupBehaviour;
	}
	
	startGroup()
	{
		//  start controller's bot
		this.GroupController.startCharacter(this.Behaviour);
		
		for(let char in this.Characters)
		{
			//char.startCharacter(this.Behaviour.mainInterval, this.Behaviour.lateInterval);
		}
	}
}