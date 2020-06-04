///		Ranger Settings		///

//////

function rangerAuto(target)
{
	//	cast 3shot
	//tripleShot(target);

	//	cast hunters mark
	useHuntersMark(target);

	//	cast super shot
	if (character.mp >= G.skills.supershot.mp && !is_on_cooldown("supershot") && is_in_range("supershot", target) && validTargetForSkill(target))
	{
		use_skill("supershot", target);
		reduce_cooldown("supershot", character.ping);
	}

	//	auto attack
	autoAttack(target);
}

function useHuntersMark(target)
{
	if (character.mp < G.skills.huntersmark.mp || is_on_cooldown("huntersmark"))
	{
		return;
	}

	//	shoot current target
	if (is_in_range(target, "huntersmark") && !target.s.huntersmark && validTargetForSkill(target))
	{
		use_skill("huntersmark", target);
		reduce_cooldown("huntersmark", character.ping);
	}
}

//	use 3shot
function tripleShot(target)
{
	if (is_on_cooldown("3shot"))
	{
		return;
	}

	// use_skill("3shot", target);
	// reduce_cooldown("3shot", character.ping);
	// return;

	let count = 1;
	for (let e in parent.entities)
	{
		let t = parent.entities[e];

		if (target.mtype === t.mtype && is_in_range(t, "supershot"))
		{
			count++;
		}
	}

	if (count <= 3)
	{
		log("3 Shot!");
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