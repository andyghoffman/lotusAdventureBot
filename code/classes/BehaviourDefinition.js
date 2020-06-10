class BehaviourDefinition
{
	constructor(name = "")
	{
		this.Name = name;
		this.Intervals = {};
		this.runningIntervals = [];
	}

	startBehaviour()
	{
		// for(let i in this.Intervals)
		// {
		// 	let intervalID = setInterval(i, this.Intervals[i]);
		// 	this.runningIntervals.push(intervalID);
		// }
		
		setInterval(this.mainInterval, 250);

		// for(let interval in this.Intervals)
		// {
		// 	setInterval(interval, this.Intervals[interval]);
		// }
	}
	
	stopBehaviour()
	{
		for (let i of this.runningIntervals)
		{
			clearInterval(i);
		}
		
		this.runningIntervals = [];
	}
	
	classRoutine(target)
	{
		if (character.ctype === "merchant")
		{
			merchantAuto(target);
		}
		else if (character.ctype === "priest")
		{
			priestAuto(target);
		}
		else if (character.ctype === "mage")
		{
			mageAuto(target);
		} 
		else if (character.ctype === "ranger")
		{
			rangerAuto(target);
		}
	}
}