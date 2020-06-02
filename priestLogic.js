///		Priest Settings		///
const healThreshold = 0.9;
const manaReserve = 0.25;
//////

var healMode = false;

function priestAuto(target)
{
	//	heal
	autoHeal();

	//	save mana for healing if low
	if(character.mp < (character.max_mp * manaReserve))
	{
		return;
	}

	//	cast curse
	if(target && character.mp >= G.skills.curse.mp && !is_on_cooldown("curse") && !target.s.curse && validTargetForSkill(target))
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

	if(target && !healMode)
	{
		autoAttack(target);
	}
}

function autoHeal()
{
	let damagedPartyMembers = 0;

	parent.party_list.forEach(function(partyMemberName)
	{
		let partyMember = parent.entities[partyMemberName];
		if(partyMemberName == character.name)
		{
			partyMember = character;
		}

		if(partyMember && !partyMember.rip && partyMember.hp < (partyMember.max_hp * healThreshold))
		{
			healMode = true;
			damagedPartyMembers++;

			if(damagedPartyMembers > 1 && character.mp >= G.skills.partyheal.mp && !is_on_cooldown("partyheal"))
			{
				log("Priest is healing party!");
				use_skill("partyheal");
				reduce_cooldown("partyheal", character.ping);
				return;
			}
			else if(!is_on_cooldown("heal"))
			{
				log("Priest is healing " + partyMember.name);
				heal(partyMember);
				reduce_cooldown("heal", character.ping);
			}
		}
	});

	if(damagedPartyMembers == 0 && !is_on_cooldown("heal"))
	{
		healMode = false;
	}
}

function priest_on_cm(name, data)
{

}