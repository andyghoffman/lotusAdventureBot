function initParty()
{
	partyMembers = parent.party_list;

	if(partyMembers.length == 4)
	{
		return;
	}

	if(!partyMembers.includes(priestName))
	{
		send_party_invite(priestName);
	}
	if(characterOffline(priestName))
	{
		start_character(priestName, 0);
	}

	if(!partyMembers.includes(merchantName))
	{
		send_party_invite(merchantName);
	}
	if(characterOffline(merchantName))
	{
		start_character(merchantName, 0);
	}

	if(!partyMembers.includes(mageName))
	{
		send_party_invite(mageName);
	}
	if(characterOffline(mageName))
	{
		start_character(mageName, 0);
	}

	if(!partyMembers.includes(rangerName))
	{
		send_party_invite(rangerName);
	}
	if(characterOffline(rangerName))
	{
		start_character(rangerName, 0);
	}

	log("Initializing Party...");
}


//  check if you are separated from the party, and attempt to regroup in town if you are.
//  returns true if the character is alone, false if not
function aloneCheck(msToWait = 15000)
{
    if(is_moving(character) || smart.moving)
    {
        return false;
    }

    if(!partyPresent() && !aloneChecking)
    {
        if(character.name != partyLeader)
        {
            if(parent.entities[partyLeader])
            {
                followLeader();
                return false;
            }
        }

        aloneChecking = true;
        log(character.name + " is checking if they are lost...");

        setTimeout(function()
        {
            if(character.name != partyLeader && parent.entities[partyLeader])
            {
                aloneChecking = false;
                followLeader();
                return false;
            }

            if(!isInTown() && !partyPresent() && aloneChecking)
            {
                log(character.name + " is lost & returning to town.");

                stopFarmMode();
                returnToTown();
            }

            aloneChecking = false;

        }, msToWait);

        return true;
    }

    if(!partyPresent() || aloneChecking)
    {
        return true;
    }
    else
    {
        return false;
    }
}

function letsGo()
{
	log("Let's go!");

	send_cm(mageName, {message:"letsgo"});
	send_cm(rangerName, {message:"letsgo"});

	farmingModeActive = true;
}

function toggleAutoPlay()
{
    autoPlay = !autoPlay;

    if(!autoPlay)
    {
        farmingModeActive = false;
    }

    if(character.name == partyLeader)
    {
        send_cm(mageName, {message:"autoToggle",auto:autoPlay});
        send_cm(rangerName, {message:"autoToggle",auto:autoPlay});

        log("sending autoPlayToggle to Mage & Ranger");
    }

    log("autoPlay: " + autoPlay);
}

function returnPartyToTown()
{
    log("Returning party to town.");

    returnToTown();
    send_cm(mageName, {message:"town"});
    send_cm(rangerName, {message:"town"});
}

//	returns true if character is offline
function characterOffline(name)
{
	if(parent.X.characters.filter((x)=>{return x.name==name && x.online == 0}).length == 0)
	{
		return false;
	}

	if(!get_active_characters()[name])
	{
		return true;
	}
	else
	{
		return false;
	}
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
		let reason = character.name + " recieved readyreply from " + sender + ". " + sender + " is " + (data.isReady?"ready!":"not ready. ")

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
		if(fullAuto)
		{
			autoPlay = true;
		}

		return;
    }
    else if(data.message == "autoToggle")
    {
		autoPlay = data.auto;

		if(!autoPlay)
		{
			farmingModeActive = false;
		}

        log("autoPlay: " + autoPlay);
        return;
	}
	else if(data.message == "town")
	{
		returnToTown();
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
	let target = get_nearest_monster
	({
		target:character.name
	});

	if(!target)
	{
	    target = get_nearest_monster();
	}

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

function isInTown()
{
	return (character.map === merchantStandMap && distance(character,merchantStandCoords) < 200);
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
		log(character.name + " waiting for Mluck, resending request...");
	}
	else
	{
		log(character.name + " requesting Mluck");
		sentRequests.push({message:"mluck",name:merchantName});
	}

	let merchReq = {message:"mluck",name:character.name};
	send_cm(merchantName, merchReq);
}

function requestMagiPort()
{
	log(character.name + " requesting MagiPort");

	let magiReq = {message:"magiPort",name:character.name};
	send_cm(mageName, magiReq);
}

function checkSentRequests()
{
	if(sentRequests.length == 0)
	{
		return;
	}

	log("Checking request status...");

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

function usePotions(healthPotThreshold = 0.9, manaPotThreshold = 0.9)
{
    if(!character.rip && (character.hp < (character.max_hp * healthPotThreshold) || character.mp < (character.max_mp * manaPotThreshold)))
	{
		use_hp_or_mp();
	}
}

function checkBuffs()
{
	//	check that you have mLuck from merchant
	if(!character.s.mluck || character.s.mluck.f != merchantName)
	{
		requestMluck();
		return false;
	}
	else if(character.s.mluck && character.s.mluck.f == merchantName)
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
		let healthPotsNeeded = healthPotionsToHave - hPotions;
		let manaPotsNeeded = manaPotionsToHave - mPotions;
		let potsList = {message:"buyPots", hPots:healthPotsNeeded, mPots:manaPotsNeeded};
		send_cm(merchantName, potsList);

		if(sentRequests.find(x=>x.message=="potions"))
		{
			log(character.name + " waiting for potions, resending request... ");
		}
		else
		{
			log(character.name + " sending request for potions");
			sentRequests.push({message:"potions",name:merchantName});
		}

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
			if(item_properties(character.items[i]) && !exclude.includes(character.items[i].name))
			{
				send_item(merchant, i, character.items[i].q);
			}
		}

        log(character.name + " sent gold & items to merchant.");
	}
}

function toggleCraftingMode()
{
	craftingOn = !craftingOn;
	log("Crafting Mode " + craftingOn);
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

function travelToFarmSpot()
{
	if(farmMode == "coords")
	{
		goTo(farmMap, farmCoords);
	}
	else if(farmMode == "name")
	{
		traveling = true;
		smart_move(farmMonsterName, ()=>{traveling = false;});
	}
	else if(farmMode == "number")
	{

	}
}

function returnToTown(delay)
{
	if(returningToTown)
		return;

	log(character.name + " returning to town.");

	returningToTown = true;

	use("use_town");

	setTimeout(function()
	{
		goTo(merchantStandMap,merchantStandCoords,()=>{returningToTown=false});
	}, 5000);
}

//	sorts inventory to push all items toward the back
function tidyInventory()
{
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item && i+1 < character.items.length && !character.items[i+1])
		{
			swap(i, i+1);
		}
	}
}