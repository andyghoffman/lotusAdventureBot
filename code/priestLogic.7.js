///		Priest Settings		///
const PriestHealThreshold = 0.9;
//////

let HealingMode = false;

function priestAuto(target)
{
	autoHeal();
	tauntOffPartyMembers(target);
	useCurse(target);

	if (!HealingMode)
	{
		autoAttack(target);
	}
}

function tauntOffPartyMembers(target)
{
	if (character.mp < G.skills.absorb.mp || !target || !UseAbsorbSins)
	{
		return;
	}

	//	taunt things off of other party members and focus fire them
	for (let e in parent.entities)
	{
		let tauntTarget = parent.entities[e];
		let targetOfTarget = tauntTarget.target;

		if (!is_on_cooldown("absorb") && is_in_range(target, "absorb") && !tauntTarget.player && targetOfTarget && targetOfTarget !== character.name && parent.party_list.includes(targetOfTarget))
		{
			use_skill("absorb", targetOfTarget);
			reduce_cooldown("absorb", character.ping);
			target = tauntTarget;
			break;
		}
	}

	return target;
}

function useCurse(target)
{
	if (character.mp < G.skills.curse.mp || !target)
	{
		return;
	}

	//	cast curse
	if (!is_on_cooldown("curse") && is_in_range(target, "curse") && !target.s.curse && validTargetForSkill(target))
	{
		use_skill("curse", target);
		reduce_cooldown("curse", character.ping);
	}
}

function autoHeal()
{
	let damagedPartyMembers = 0;

	for(let p of parent.party_list)
	{
		let partyMember = parent.entities[p];
		if (p === character.name)
		{
			partyMember = character;
		}

		if (partyMember && !partyMember.rip && partyMember.hp < (partyMember.max_hp * PriestHealThreshold))
		{
			HealingMode = true;
			damagedPartyMembers++;

			if (damagedPartyMembers > 1 && character.mp >= G.skills.partyheal.mp && !is_on_cooldown("partyheal"))
			{
				log("Priest is healing party!");
				use_skill("partyheal");
				reduce_cooldown("partyheal", character.ping);
			}
			else if (!is_on_cooldown("attack"))
			{
				log("Priest is healing " + partyMember.name);
				heal(partyMember);
				reduce_cooldown("heal", character.ping);
			}
		}
	}

	if (damagedPartyMembers === 0 && !is_on_cooldown("attack"))
	{
		HealingMode = false;
	}
}

function priest_on_cm(name, data)
{

}