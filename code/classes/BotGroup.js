class BotGroup
{
	Characters = {};
	Behaviour;

	constructor(characterNames, groupBehaviour)
	{
		for (let c of characterNames)
		{
			this.Characters[c] = new BotCharacter(c);
		}

		this.Behaviour = groupBehaviour;
	}
	
	startGroup()
	{
		for(let char in this.Characters)
		{
			char.startCharacter(this.Behaviour.mainInterval, this.Behaviour.lateInterval);
		}
	}
}