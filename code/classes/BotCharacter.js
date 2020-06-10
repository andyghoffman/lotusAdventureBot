class BotCharacter
{
	constructor(name, behaviour)
	{
		this.Name = name;
		this.Behaviour = behaviour;
	}
	
	startCharacter()
	{
		this.Behaviour.startBehaviour();
	}
	
	stopCharacterProcess()
	{
		// clearInterval(this.MainInterval);
		// clearInterval(this.LateInterval);
	}
}