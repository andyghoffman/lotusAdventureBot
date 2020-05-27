var manaToReserve = 0.2;
var energizeTarget = "LotusRanger"

function mageAuto(target)
{	
	//if(character.mp < character.maxmp * manaToReserve)
	//	return;
	
	if(!is_on_cooldown("energize"))
	{
		parent.party_list.forEach(function(otherPlayerName)
		{
			let partyMember = parent.entities[otherPlayerName];

			if(partyMember && partyMember.id === energizeTarget)
			{
				if(!partyMember.s.energized && !is_on_cooldown("energize") &&
				   is_in_range(partyMember, "energize"))
				{
					change_target(partyMember);
					use_skill("energize", partyMember);
					reduce_cooldown("energize", character.ping);
					change_target(target);					
				}
			}
		});
	}
	
	if(target)
	{	
		autoFight(target);
	}
}

function mage_on_cm(name, data)
{
	if(data.message == "test")
	{
		log(data.content);
		return;
	}
	
	if(data.message == "magiPort")
	{
		log("Recieved MagiPort request from " + name);
		use_skill("magiport", name);
	}
}