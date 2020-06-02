///		Ranger Settings		///

//////

function rangerAuto(target)
{
	//	cast hunters mark
	useHuntersMark(target);

	//	cast super shot
	if(character.mp >= G.skills.supershot.mp && !is_on_cooldown("supershot") && is_in_range("supershot", target) && validTargetForSkill(target))
	{
		use_skill("supershot", target);
		reduce_cooldown("supershot", character.ping);
	}

	//	auto attack
	autoAttack(target);
}

function useHuntersMark(target)
{
	if(character.mp < G.skills.huntersmark.mp || is_on_cooldown("huntersmark"))
	{
		return;
	}

	//	shoot current target
	if(is_in_range(target, "huntersmark") && !target.s.huntersmark && validTargetForSkill(target))
	{
		use_skill("huntersmark", target);
		reduce_cooldown("huntersmark", character.ping);
		return;
	}

	//	pull a new target if current target was skipped
	for(let e in parent.entities)
	{
		if(e.type == target.mtype && is_in_range(target, "huntersmark") && !target.s.huntersmark && validTargetForSkill(target))
		{
			use_skill("huntersmark", e);
			reduce_cooldown("huntersmark", character.ping);
			return;
		}
	}
}

//	poison consumable probably not worth it
function poisonArrowSpam(target)
{
	if(character.mp < G.skills.poisonarrow.mp)
	{
		return;
	}

	if(target && !is_on_cooldown("poisonarrow") && !target.s.poisoned)
	{
		log("Using poison arrow");
		use_skill("poisonarrow", target);
		reduce_cooldown("poisonarrow", character.ping);
		return;
	}

	for(let e in parent.entities)
	{
		if(!is_on_cooldown("poisonarrow") && !e.s.poisoned && is_in_range(e, "poisonarrow"))
		{
			log("Using poison arrow");
			use_skill("poisonarrow", e);
			reduce_cooldown("poisonarrow", character.ping);
			return;
		}
	}
}

function ranger_on_cm(name, data)
{

}