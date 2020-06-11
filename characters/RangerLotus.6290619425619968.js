//load_file("C:/GitHub/lotusAdventureBot/characters/RangerLotus.6290619425619968.js");

function loadCharacter()
{
	let settings = 
	{
		"FarmMap":"main",
		"FarmMonster":"armadillo",
		"FarmSpawn":6,
		"TetherRadius":100
	};
	
	startStandardBot(settings);
	beginFarming();
}

function characterCombat(target)
{
	if(useThreeShot(target))
	{
		return true;
	}
	
	if(useSuperShot(target))
	{
		return true;
	}
	
	return false;
}

function useSuperShot(target)
{
	if (character.mp < G.skills.supershot.mp || is_on_cooldown("supershot") || !is_in_range(target, "supershot") || !target)
	{
		return;
	}

	use_skill("supershot", target);
	reduce_cooldown("supershot", character.ping);
	
	return true;
}

function useThreeShot(target, avoidTargets = [])
{
	if (character.mp < G.skills["3shot"].mp || is_on_cooldown("attack") || !target || character.level < 60)
	{
		return false;
	}

	let targets = [];
	for (let e in parent.entities)
	{
		let t = parent.entities[e];
		if (target.mtype === t.mtype && is_in_range(t, "attack"))
		{
			targets.push(t);
		} 
		else if (avoidTargets.includes(t.mtype) && is_in_range(t, "attack"))
		{
			return false;
		}
	}

	if (targets.length >= 2)
	{
		use_skill("3shot", targets);
		reduce_cooldown("3shot", character.ping);
		return true;
	}
	
	return false;
}