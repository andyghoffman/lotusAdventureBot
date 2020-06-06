///		Ranger Settings		///

//////

function rangerAuto(target)
{
	//	cast hunters mark
	useHuntersMark(target);

	//	cast 3shot
	tripleShot(target);
	
	//	cast super shot
	useSuperShot(target);

	//	auto attack
	autoAttack(target);
}

function useHuntersMark(target)
{
	if (character.mp < G.skills.huntersmark.mp || is_on_cooldown("huntersmark") || !is_in_range(target, "huntersmark") || !validTargetForSkill(target) || target.s.huntersmark)
	{
		return;
	}

	use_skill("huntersmark", target);
	reduce_cooldown("huntersmark", character.ping);
}

function useSuperShot(target)
{
	if (character.mp < G.skills.supershot.mp || is_on_cooldown("supershot") || !is_in_range(target, "supershot"))
	{
		return; 
	}
	
	use_skill("supershot", target);
	reduce_cooldown("supershot", character.ping);
}

//	use 3shot
function tripleShot(target)
{
	if (is_on_cooldown("attack") || !UseThreeShot)
	{
		return;
	}

	let count = 1;
	for (let e in parent.entities)
	{
		let t = parent.entities[e];
		if(target.mtype === t.mtype && is_in_range(t, "attack"))
		{
			count++;
		}
	}

	if(count >= 3)
	{
		use_skill("3shot", target);
		reduce_cooldown("3shot", character.ping);		
	}
}

//	poison consumable probably not worth it
function poisonArrowSpam(target)
{
	if (character.mp < G.skills.poisonarrow.mp)
	{
		return;
	}

	if (target && !is_on_cooldown("poisonarrow") && !target.s.poisoned)
	{
		log("Using poison arrow");
		use_skill("poisonarrow", target);
		reduce_cooldown("poisonarrow", character.ping);
		return;
	}

	for (let e in parent.entities)
	{
		let target = parent.entities[e];

		if (!is_on_cooldown("poisonarrow") && !target.s.poisoned && is_in_range(target, "poisonarrow"))
		{
			log("Using poison arrow");
			use_skill("poisonarrow", target);
			reduce_cooldown("poisonarrow", character.ping);
			return;
		}
	}
}

function ranger_on_cm(name, data)
{

}