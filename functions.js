var whosReady = {priest:false,mage:false,ranger:false,merchant:false};
var traveling = false;
var sentRequests = [];

const healthPotionsToHave = 1000;
const manaPotionsToHave = 1000;
const lowPotions = 100;
const spaceToKeep = 10;
const whiteList = ["LotusPriest", "LotusMage", "LotusRanger", "LotusMerch"];

function loadCharacters()
{
    log("Loading Characters...");

	start_character(mageName, "main");
	start_character(rangerName, "main");
}

function initParty()
{
	partyMembers = parent.party_list;

	if(!partyMembers.includes(priestName))
		send_party_invite(priestName);

	if(!partyMembers.includes(merchantName))
		send_party_invite(merchantName);

	if(!partyMembers.includes(mageName))
		send_party_invite(mageName);

	if(!partyMembers.includes(rangerName))
		send_party_invite(rangerName);

	log("Party Invites sent!");
}

function stopCharacters()
{
	stop_character(mageName);
    stop_character(rangerName);

	stopFarmMode();

    autoPlay = false;

	log("Characters stopped!");
}

function stopFarmMode()
{
	if(is_moving(character) || smart.moving)
	{
		stop("move");
	}

    farmingModeActive = false;
    whosReady = {priest:false,mage:false,ranger:false,merchant:false};
}

function on_cm(sender, data)
{
	//log(character.name + " recieved cm from " + name);

	if(!whiteList.includes(sender))
	{
		log(character.name + " recieved unexpected cm from " + sender);
		return;
	}
	else if(!data.message)
	{
		log(character.name + " recieved unexpected cm format from " + sender);
		return;
	}

	if(data.message == "target")
	{
        target = get_entity(data.targetId);

        if(target)
        {
            change_target(target, true);
        }

        return;
	}
	else if(data.message == "readycheck")
	{
		log(character.name + " recieved readycheck from " + sender);

		stopFarmMode();

		let ready, buffs, pots = false;

		if(character.name == merchantName)
		{
			ready = parent.party_list.includes(partyLeader);
		}
		else
		{
			buffs = checkBuffs();
			pots = checkPotionInventory();
			ready = buffs & pots;
		}

		if(sender == priestName)
			whosReady.priest = data.isReady;
		else if(sender == mageName)
			whosReady.mage = data.isReady;
		else if(sender == rangerName)
			whosReady.ranger = data.isReady;
		else if(sender == merchantName)
			whosReady.merchant = data.isReady;

		if(character.name == priestName)
			whosReady.priest = ready;
		else if(character.name == mageName)
			whosReady.mage = ready;
		else if(character.name == rangerName)
			whosReady.ranger = ready;
		else if(character.name == merchantName)
			whosReady.merchant = ready;

		send_cm(sender, {message:"readyreply",isReady:ready,hasBuffs:buffs,hasPots:pots});
		return;
	}
	else if(data.message == "readyreply")
	{
		let reason = character.name + " recieved readyreply from " + sender + ". " + sender + " is " + (data.isReady?"ready!":"not ready.")

		if(sender != merchantName)
		{
			if(!data.hasBuffs)
				reason += sender + " is missing buffs. ";
			if(!data.hasPots)
				reason += sender + " is missing pots. ";
		}

		log(reason);

		if(sender == priestName)
			whosReady.priest = data.isReady;
		else if(sender == mageName)
			whosReady.mage = data.isReady;
		else if(sender == rangerName)
			whosReady.ranger = data.isReady;
		else if(sender == merchantName)
			whosReady.merchant = data.isReady;

		return;
	}
	else if(data.message == "letsgo")
	{
        log("Let's go!");
        whosReady = {priest:true,mage:true,ranger:true,merchant:true};
        farmingModeActive = true;
		return;
    }
    else if(data.message == "autoToggle")
    {
        autoPlay = data.auto;
        log("autoPlay: " + autoPlay);
        return;
    }

	if(character.ctype === "merchant")
	{
		merchant_on_cm(sender, data);
	}
	else if(character.ctype === "mage")
	{
		mage_on_cm(sender, data);
	}
	else if(character.ctype === "priest")
	{
		priest_on_cm(sender, data);
	}
	else if(character.ctpye === "ranger")
	{
		ranger_on_cm(sender, data);
	}
}

function on_party_invite(name)
{
    if (whiteList.includes(name) && parent.party_list.length == 0)
	{
		accept_party_invite(name);
	}
}

function on_magiport(name)
{
	if(name == mageName)
	{
		if(character.ctype === "merchant")
		{
			merchant_on_magiport(name);
		}
	}
}

function readyCheck()
{
	stopFarmMode();

	let buffs = checkBuffs();
	let pots = checkPotionInventory();
	let ready = buffs && pots;

	if(character.ctype === "priest")
		whosReady.priest = ready;
	if(character.ctype === "mage")
		whosReady.mage = ready;
	if(character.ctype === "ranger")
		whosReady.ranger = ready;
	if(character.ctype === "merchant")
		whosReady.merchant = ready;

	if(ready)
	{
		log(character.name + " is ready!");

		if(!readyToGo())
		{
			parent.party_list.forEach(function(otherPlayerName)
			{
				let partyMember = parent.entities[otherPlayerName];
				if(partyMember)
				{
					send_cm(partyMember.name, {message:"readycheck",isready:ready});
				}
			});
		}
	}
	else if(!ready)
	{
		let reason = character.name + " is not ready! ";
		if(!buffs)
			reason += character.name + " is missing buffs. ";
		if(!pots)
			reason += character.name + " is missing pots. ";

		log(reason);

		if(!isInTown())
		{
            if(!get_targeted_monster())
                use("use_town");
            else
                goTo("main");
		}
	}
}

function readyToGo()
{
	return (whosReady.priest && whosReady.mage && whosReady.ranger);
}

function personalSpace()
{
    target = get_nearest_monster();

    if(target)
    {
        if(distance(character, target) < spaceToKeep*2)
        {
            let right = 0;
            let up = 0

            if(target.x < character.x)
                right = -spaceToKeep * 1.5;
            else
                right = spaceToKeep * 1.5;

			if(target.y < character.y)
                up = spaceToKeep * 1.5;
            else
				up = -spaceToKeep * 1.5;

			adjustment = {x:character.x+right, y:character.y+up};

			if(character.name != partyLeader)
			{
				let leader = parent.entities[get_player(partyLeader)];

				//	make sure you dont run away from party
				if(leader && distance(adjustment, leader) < spaceToKeep*2)
				{
					smart_move(adjustment);
					return;
				}
				else if(leader)
				{
					followLeader();
					return;
				}
			}

			smart_move(adjustment);
        }
    }
}

function tetherToLeader()
{
	if(character.name == partyLeader)
		return;

    leader = get_player(partyLeader);

    if(leader && distance(character, leader) > spaceToKeep*2)
    {
        followLeader();
    }
}

function isInTown()
{
	return (character.map === merchantStandMap && distance(character,{x:merchantStand_X,y:merchantStand_Y}) < 200);
}

function partyPresent()
{
	if(parent.party_list.length < 4)
		return false;

	return (parent.entities[priestName] || character.name === priestName) &&
			(parent.entities[mageName] || character.name === mageName) &&
			(parent.entities[rangerName] || character.name === rangerName);
}

function requestMluck()
{
	if(sentRequests.find(x=>x.message=="mluck"))
	{
		log(character.name + " waiting for Mluck...");
		return;
	}

	log(character.name + " requesting Mluck");

	let merchReq = {message:"mluck",name:character.name};
	send_cm(merchantName, merchReq);

	sentRequests.push({message:"mluck",name:merchantName});
}

function requestMagiPort()
{
	log(character.name + " requesting MagiPort");

	let magiReq = {message:"magiPort",name:character.name};
	send_cm(mageName, magiReq);
}

function checkSentRequests()
{
	if(sentRequests.length > 0)
	{
		for(let i = sentRequests.length-1; i >= 0; i--)
		{
			if(sentRequests[i].message == "mluck")
			{
				if(character.s.mluck)
				{
					log("Mluck recieved. Thank you!");
					send_cm(sentRequests[i].name, {message:"thanks",request:"mluck"});
					sentRequests.splice(i);
				}
			}
			else if(sentRequests[i].message == "potions")
			{
				if(checkPotionInventory())
				{
					log("Potions recieved. Thank you!");
					send_cm(sentRequests[i].name, {message:"thanks",request:"potions"});
					sentRequests.splice(i);
				}
			}
		}
	}
}

function usePotions(healthPotThreshold = 0.9, manaPotThreshold = 0.9)
{
    if(!character.rip && (character.hp < (character.max_hp * healthPotThreshold) || character.mp < (character.max_mp * manaPotThreshold)))
	{
		use_hp_or_mp();
	}
}

function checkBuffs()
{
	if(!character.s.mluck)
	{
		requestMluck();
		return false;
	}
	else
	{
		return true;
	}
}

function checkPotionInventory()
{
	let	hPotions = quantity("hpot0");
	let mPotions = quantity("mpot0");

	if(mPotions < lowPotions || hPotions < lowPotions)
	{
		if(sentRequests.find(x=>x.message=="potions"))
		{
			log(character.name + " waiting for potions...");
			return;
		}

		let healthPotsNeeded = healthPotionsToHave - hPotions;
		let manaPotsNeeded = manaPotionsToHave - mPotions;
		let potsList = {message:"buyPots", hPots:healthPotsNeeded, mPots:manaPotsNeeded};
		send_cm(merchantName, potsList);

		log(character.name + " sending request for potions");
		sentRequests.push({message:"potions",name:merchantName});

		return false;
	}
	else
	{
		return true;
	}
}

function transferAllToMerchant()
{
	if(character.ctype === "merchant")
		return;

	let merchant = get_player(merchantName);
	let exclude = ["hpot0","mpot0"];

    if(character.ctype !== "merchant" && merchant && merchant.owner === character.owner && distance(character, merchant) < 400)
	{
		send_gold(merchant, character.gold)

        for(let i = 0; i < character.items.length; i++)
		{
			if(character.items[i] && !exclude.includes(character.items[i]))
			{
				send_item(merchant, i, quantity(character.items[i]));
			}
		}

        log(character.name + " sent gold & items to merchant.");
	}
}

function followLeader()
{
	if(character.ctype === "merchant" || character.name == partyLeader)
		return;

	var leader = get_player(partyLeader);

	if(leader)
	{
		if (distance(character, leader) > spaceToKeep*2)
		{
        	move
			(
            	character.real_x+(leader.x-character.real_x) / 2,
            	character.real_y+(leader.y-character.real_y) / 2
        	);
		}

		return true;
	}
	else
	{
		return false;
	}
}

function broadCastTarget(broadCastTarget)
{
    broadCastTarget = get_targeted_monster();
    parent.party_list.forEach(function(otherPlayerName)
    {
        if(otherPlayerName != character.name)
        {
            let partyMember = parent.entities[otherPlayerName];

            if(partyMember && partyMember.name != merchantName && partyMember.name != broadCastTarget.name)
            {
                send_cm(partyMember.name, {message:"target",targetId:broadCastTarget.id});
            }
        }
    });
}

function getMonsterFarmTarget(farmTarget)
{
    let target = get_targeted_monster();

	//	if already have target, keep it
    if(target)
    {
        return target;
	}
	//	find a target
	else if(!target)
	{
		//	party leader checks for nearest monster to itself
        if(character.name == partyLeader)
        {
			target = get_nearest_monster
			({
				target:character.name
			});

			if(target)
			{
				return target;
			}
		}
		//	other party members check if leader has a target
		else
		{
			let leader = get_player(parent.entities[partyLeader]);
			if(leader && leader.target != null)
			{
				target = leader.targetId;
				change_target(target, true);
				return target;
			}
		}

		//	target a monster that is targeting another party member
		if(!target)
		{
			parent.party_list.forEach(partyMemberName =>
			{
					target = get_nearest_monster({target:partyMemberName});
					if(target)
					{
						change_target(target, true);
						return target;
					}
			});
		}

		//	target nearest monster to yourself that is targeting you
		target = get_nearest_monster
		({
			target:character.name
        });

		//	target nearest monster that has no target
		if(!target)
		{
			target = get_nearest_monster
			({
				type:farmTarget,
				no_target:true
			});
		}

		if(target)
		{
			change_target(target, true);
			return target;
		}
	}
}

function autoAttack(target)
{
    if(!is_in_range(target, "attack"))
	{
        smart_move(
            character.x + (target.x - character.x) * 0.3,
            character.y + (target.y - character.y) * 0.3
        );
    }
    else if (!is_on_cooldown("attack"))
	{
        attack(target).then((message) =>
		{
            reduce_cooldown("attack", character.ping);
        }).catch((message) =>
		{
            //log(character.name + " attack failed: " + message.reason);
        });
    }
}

function goTo(mapName = "main", coords = {x:0,y:0} , oncomplete = null)
{
	traveling = true;

	if(character.map != mapName)
	{
		if(oncomplete != null)
		{
			smart_move(mapName, ()=>{oncomplete(); traveling = false;});
		}
		else
		{
			smart_move(mapName, ()=>{traveling = false;});
		}
	}
	else
	{
		if(oncomplete != null)
		{
			smart_move(coords, ()=>{oncomplete(); traveling = false;});
		}
		else
		{
			smart_move(coords, ()=>{traveling = false;});
		}
	}
}