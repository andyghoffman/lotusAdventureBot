var manaToReserve = 0.25;

function rangerAuto(target)
{
	if(character.mp < character.maxmp * manaToReserve)
		return;

	if(target)
	{
		if(character.mp >= G.skills.huntersmark.mp && !is_on_cooldown("huntersmark") && !target.s.huntersmark && validTargetForSkill(target))
		{
			use_skill("huntersmark");
			reduce_cooldown("huntersmark", character.ping);
		}

		if(character.mp >= G.skills.supershot.mp && !is_on_cooldown("supershot") && validTargetForSkill(target))
		{
			use_skill("supershot");
			reduce_cooldown("supershot", character.ping);
		}

		autoAttack(target);
	}
}

function ranger_on_cm(name, data)
{

}