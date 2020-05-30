var defaultEnergizeTarget = "LotusRanger"

function mageAuto(target)
{
	if(!is_on_cooldown("energize"))
	{
		let energizeTarget = parent.entities[defaultEnergizeTarget];

		parent.party_list.forEach(function(partyPlayer)
		{
			let partyMember = parent.entities[partyPlayer];

			if(partyMember && partyMember.name != character.name && partyMember.mp < partyMember.max_mp*0.5)
			{
				energizeTarget = partyMember;
				break;
			}
		});

		if(!energizeTarget.s.energized && is_in_range(energizeTarget, "energize"))
		{
			use_skill("energize", energizeTarget);
			reduce_cooldown("energize", character.ping);
		}
	}

	if(target)
	{
		autoAttack(target);
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