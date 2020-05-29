var healThreshold = 0.75;
var manaReserve = 0.5;

function priestAuto(target)
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
					/*if(!is_in_range(partyMember, "heal"))
					{
						smart_move(
							character.x + (partyMember.x - character.x) * 0.3,
							character.y + (partyMember.y - character.y) * 0.3
						);

						return;
					}
					else
					{

					}*/

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

	if(character.mp >= G.skills.curse.mp && !is_on_cooldown("curse") && !target.s.curse && target.hp > target.max_hp*0.5)
	{
		use_skill("curse", target);
		reduce_cooldown("curse", character.ping);
	}

	if(target && target.target && target.target != character.id && character.mp >= G.skills.absorb.mp && !is_on_cooldown("absorb"))
	{
		change_target(target.target);
		use_skill("absorb", target.target);
		reduce_cooldown("absorb", character.ping);
	}

	if(character.mp > (character.max_mp * manaReserve))
	{
		if(target)
		{
			autoAttack(target);
		}
	}
}

function priest_on_cm(name, data)
{

}