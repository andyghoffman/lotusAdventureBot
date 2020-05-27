var manaToReserve = 0.25;

function rangerAuto(target)
{
	if(character.mp < character.maxmp * manaToReserve)
		return;
	
	if(target)
	{	
		if(character.mp >= G.skills.huntersmark.mp && !is_on_cooldown("huntersmark")
		  && !target.s.huntersmark && target.hp > target.max_hp*0.5)
		{
			use_skill("huntersmark");
			reduce_cooldown("huntersmark", character.ping);
		}
		
		if(character.mp >= G.skills.supershot.mp && !is_on_cooldown("supershot")
		  && target.hp > target.max_hp*0.5)
		{
			//log("Supershot");
			use_skill("supershot");
			reduce_cooldown("supershot", character.ping);
		}
		
		//useSkillOnTarget("huntersmark", target);
		//useSkillOnTarget("supershot", target);

		autoAttack(target);
	}
}

function ranger_on_cm(name, data)
{
	
}