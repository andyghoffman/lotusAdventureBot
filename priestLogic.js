var healThreshold = 0.8;
var manaReserve = 0.5;

function priestAuto(target)
{
	autoHeal();

	//	cast curse
	if(character.mp >= G.skills.curse.mp && !is_on_cooldown("curse") && !target.s.curse && validTargetForSkill(target))
	{
		use_skill("curse", target);
		reduce_cooldown("curse", character.ping);
	}

	//	taunt things off of other party members and focus fire them
	for(let e in parent.entities)
	{
		let tauntTarget = parent.entities[e];
		let targetOfTarget = tauntTarget.target;

		if(!tauntTarget.player && targetOfTarget && targetOfTarget != character.name && parent.party_list.includes(targetOfTarget) && character.mp >= G.skills.absorb.mp && !is_on_cooldown("absorb"))
		{
			change_target(targetOfTarget);
			use_skill("absorb", targetOfTarget);
			reduce_cooldown("absorb", character.ping);
			change_target(tauntTarget);
			broadCastTarget(tauntTarget);
			target = tauntTarget;
			break;
		}
	}

	//	auto attack, but hold back mana for healing
	if(character.mp > (character.max_mp * manaReserve))
	{
		if(target)
		{
			autoAttack(target);
		}
	}
}

function autoHeal()
{
	let damagedPartyMembers = 0;
	parent.party_list.forEach(function(partyMemberName)
	{
		let partyMember = parent.entities[partyMemberName];

		if(partyMember && !partyMember.rip)
		{
			if(partyMember.hp < (partyMember.max_hp * healThreshold))
			{
				damagedPartyMembers++;

				if(damagedPartyMembers > 1 && character.mp >= G.skills.partyheal.mp && !is_on_cooldown("partyheal"))
				{
					use_skill("partyheal");
                    reduce_cooldown("partyheal", character.ping);

                    log("Priest is healing party!");

					return;
				}
				else if(!is_on_cooldown("heal") && character.mp >= G.skills.heal.mp)
				{
					log("Priest is healing " + partyMember.name);

					reduce_cooldown("heal", character.ping);
					heal(partyMember).then((message) =>
					{

					}).catch((message) =>
					{
						log(character.name + " Heal failed: " + message.reason);
					});
				}
			}
		}
    });
}

function priest_on_cm(name, data)
{

}