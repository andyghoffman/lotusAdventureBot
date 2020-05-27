var healThreshold = 0.75;
var manaReserve = 0.5;

function priestAuto(target)
{
	let damagedPartyMembers = 0;
	
	if(character.hp < (character.max_hp * healThreshold) && !is_on_cooldown("heal"))
	{
        heal(character);
        game_log("Priest is healing herself.");
		return;
    }
	
	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];
		
		if(partyMember)
		{
			if(character.hp < character.max_hp * healThreshold)
				damagedPartyMembers++;

			if(partyMember.hp < (partyMember.max_hp * healThreshold) &&
			   !partyMember.rip && is_in_range(partyMember, "heal"))
			{
				damagedPartyMembers++;
				
				if(damagedPartyMembers > 1 && character.mp >= 
				   G.skills.partyheal.mp && !is_on_cooldown("partyheal"))
				{
					use_skill("partyheal");
					reduce_cooldown("partyheal", character.ping);
					game_log("Priest is healing Party");					
					return;
				}
				else if(!is_on_cooldown("heal"))
				{
					heal(partyMember).then((message) =>
					{
						reduce_cooldown("heal", character.ping);
                    	game_log("Priest is healing " + partyMember.name);
					}).catch((message) =>
					{
						log(character.name + " Heal failed: " + message.reason);
					});
				}
			}
		}
	});
	
	if(character.mp >= G.skills.partyheal.mp && !is_on_cooldown("curse") &&
	   !target.s.curse && target.hp > target.max_hp*0.5)
	{
		use_skill("curse");
		reduce_cooldown("curse", character.ping);
	}
	
	if(character.mp > (character.max_mp * manaReserve))
	{
		if(target)
		{
			autoFight(target);
		}
	}
}

function priest_on_cm(name, data)
{
	
}