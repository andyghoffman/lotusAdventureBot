var healThreshold = 0.75;
var manaReserve = 0.5;

function priestAuto(target)
{
	let damagedPartyMembers = 0;
	
	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];
		
		if(partyMember && !partyMember.rip)
		{
			if(character.hp < character.max_hp * healThreshold && !character.rip)
				damagedPartyMembers++;

			if(partyMember.hp < (partyMember.max_hp * healThreshold) && !partyMember.rip)
			{
				if(!is_in_range(partyMember, "heal"))
				{
					smart_move(
						character.x + (partyMember.x - character.x) * 0.3,
						character.y + (partyMember.y - character.y) * 0.3
					);
					
					return;
				}

				damagedPartyMembers++;
				
				if(damagedPartyMembers > 1 && character.mp >= G.skills.partyheal.mp && !is_on_cooldown("partyheal") && !is_on_cooldown("heal"))
				{
					use_skill("partyheal");
                    reduce_cooldown("partyheal", character.ping);
                    
                    log("Priest is healing party!");
                    					
					return;
				}
				else if(!is_on_cooldown("heal") && !is_on_cooldown("partyheal") && character.mp >= G.skills.heal.mp)
				{
                    log("Priest is healing " + partyMember.name);

                    reduce_cooldown("heal", character.ping);
					heal(partyMember).then((message) =>
					{
                        
					}).catch((message) =>
					{
						log(character.name + " Heal failed: " + message.reason);
                    });
                    
                    return;
				}
			}
		}
    });
    
    if(character.hp < (character.max_hp * healThreshold) && !is_on_cooldown("heal") && !is_on_cooldown("partyheal"))
	{
        heal(character);
        game_log("Priest is healing herself.");
		return;
    }
	
	if(character.mp >= G.skills.curse.mp && !is_on_cooldown("curse") && !target.s.curse && target.hp > target.max_hp*0.5)
	{
		use_skill("curse");
		reduce_cooldown("curse", character.ping);
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