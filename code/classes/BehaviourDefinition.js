class BehaviourDefinition
{
	FarmSpawn = {map:"", name:"", number:0};
	FarmMonsters = [];
	FarmTetherRadius = 100;
	SpecialMonsters = [];
	AvoidMonsters = [];
	
	constructor(farmSpawn, farmMonsters, farmTetherRadius, specialMonsters, avoidMonsters)
	{
	}
	
	mainInterval()
	{
		log("Undefined definition interval.");
	}
	
	lateInterval()
	{
		log("Undefined definition late interval.");	
	}
}