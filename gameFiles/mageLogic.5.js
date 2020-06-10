///		Mage Settings		///
const defaultEnergizeTarget = "LotusRanger";
const defaultReflectionTarget = "LotusPriest";
//////

function mageAuto(target)
{
	castEnergize();
	castReflection();
	autoAttack(target);
}

function castEnergize()
{
	if (is_on_cooldown("energize"))
	{
		return;
	}

	let energizeTarget = parent.entities[defaultEnergizeTarget];

	parent.party_list.forEach((partyPlayer)=>
	{
		let partyMember = parent.entities[partyPlayer];

		if (partyMember && partyMember.name !== character.name && partyMember.mp < partyMember.max_mp * 0.5)
		{
			energizeTarget = partyMember;
		}
	});

	if (energizeTarget && !energizeTarget.s.energized && is_in_range(energizeTarget, "energize"))
	{
		use_skill("energize", energizeTarget);
		reduce_cooldown("energize", character.ping);
	}
}

function castReflection()
{
	if (is_on_cooldown("reflection") || !UseReflection)
	{
		return;
	}

	let reflectionTarget = parent.entities[defaultReflectionTarget];

	parent.party_list.forEach((partyPlayer)=>
	{
		let partyMember = parent.entities[partyPlayer];
		if(partyPlayer === character.name)
		{
			partyMember = character;
		}
		
		if (partyMember && partyMember.hp < partyMember.max_hp * 0.75)
		{
			reflectionTarget = partyMember;
		}
	});

	if (reflectionTarget && !reflectionTarget.s.reflection && is_in_range(reflectionTarget, "reflection"))
	{
		use_skill("reflection", reflectionTarget);
		reduce_cooldown("reflection", character.ping);
	}
}

function mage_on_cm(name, data)
{
	if (data.message === "magiPort")
	{
		log("Recieved MagiPort request from " + name);
		use_skill("magiport", name);
	}
	
	// if(data.message === "mageRequested")
	// {
	// 	if(data.map === character.map)
	// 	{
	// 		let sender = get_player(name);
	// 		if(sender && distance())
	// 		log("Mage blinking to " + name);
	// 		use_skill("blink", data.coords);
	// 	}
	// }
}