class StandardBotBehaviour extends BehaviourDefinition
{
	//  initialization
	constructor()
	{
		super("StandardBotBehaviour");

		//  behaviour settings
		this.FarmSpawn = {map: "winterland", name: "arcticbee", number: 10};
		this.PotionsToCarry = 1000;
		this.LowPotionsThreshold = 100;
		this.MinMonsterDistance = 50;
		this.SpecialMonsters = [];
		this.DoNotKite = [];
		//////

		//  global vars
		this.AutoPlay = true;
		this.FarmingModeActive = true;
		this.Traveling = false;
		this.GoingBackToTown = false;
		this.Banking = false;
		this.IsStuck = false;
		
		//  intervals
		this.Intervals[this.mainInterval] = 250;
		this.Intervals[this.lateInterval] = 5000;
	}
	
	mainInterval()
	{
		log("echo 1");
		
		if (character.rip)
		{
			setTimeout(respawn, 15000);
			//return;
		}
		
		loot();
		this.usePotions();

		let target = get_targeted_monster();
		if ((!target || !this.SpecialMonsters.includes(target.mtype)) && (this.FarmingModeActive && !this.Traveling))
		{
			target = this.lookForSpecialTargets();
		}
		if (!target && this.FarmingModeActive && !this.Traveling)
		{
			target = this.getTargetMonster(this.FarmSpawn.name);
		}

		if (this.AutoPlay)
		{
			this.tidyInventory();
		}
	
		if (this.AutoPlay && !this.Traveling && !this.GoingBackToTown)
		{
			this.classRoutine(target);
		}

		// if (this.isMoving() || !this.FarmingModeActive)
		// {
		// 	//return;
		// }

		if (!target && !this.Traveling)
		{
			log(character.name + " going to farm map... ");
			//travelToFarmSpot("name", this.FarmSpawn.name, this.FarmSpawn.map, this.FarmSpawn.number);
		}

		//  keep personal space
		if (!this.Traveling && this.FarmingModeActive)
		{
			this.personalSpace();
		}
	}
	
	lateInterval()
	{
		log("echo 2");
		
		// if (character.rip)
		// {
		// 	return;
		// }

		//this.checkSentRequests();
		
		// if (!botChar.AutoPlay || botChar.isMoving())
		// {
		// 	return;
		// }

		//  check if you need anything
		//this.checkIfReady();
	}

	autoAttack(target)
	{
		if (!target)
		{
			return;
		}

		if (!is_in_range(target, "attack"))
		{
			approachTarget(target);
		} else if (!is_on_cooldown("attack"))
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

	getTargetMonster(botChar, farmTarget, canPullNewMonsters = true)
	{
		let target = get_targeted_monster();

		//	if you already have a target, keep it
		if (target && target.mtype === farmTarget)
		{
			return target;
		}

		//	target a monster that is targeting another party member
		for (let p of parent.party_list)
		{
			if (p !== character.name)
			{
				target = get_nearest_monster({target: p});

				if (target)
				{
					return target;
				}
			}
		}
		
		//  target nearest monster to you
		target = get_nearest_monster({type: farmTarget, target: character.name});

		if (target)
		{
			return target;
		}
		
		//	target nearest monster that has no target
		if (!target && canPullNewMonsters)
		{
			target = get_nearest_monster({type: farmTarget, no_target: true});
		}

		if (target)
		{
			return target;
		} 
		else
		{
			return null;
		}
	}
	
	lookForSpecialTargets()
	{
		//  if something is hitting you kill it first
		let target = get_nearest_monster({target: character.name});
		if (target)
		{
			return target;
		}

		for (let special of this.SpecialMonsters)
		{
			target = this.getTargetMonster(special);
			if (target && special.includes(target.mtype))
			{
				stop();
				change_target(target);

				return target;
			}
		}

		return null;
	}
	
	checkPotionInventory()
	{
		let hPotions = quantity("hpot1");
		let mPotions = quantity("mpot1");

		if (mPotions < this.LowPotionsThreshold || hPotions < this.LowPotionsThreshold)
		{
			let healthPotsNeeded = this.HealthPotsToHave - hPotions;
			let manaPotsNeeded = this.ManaPotsToHave - mPotions;

			if (healthPotsNeeded < 0)
			{
				healthPotsNeeded = 0;
			}
			if (manaPotsNeeded < 0)
			{
				manaPotsNeeded = 0;
			}
			
			log("Need potions! Waaah.");
		}
	}

	personalSpace()
	{
		if (this.isMoving())
		{
			this.IsStuck = false;
		}

		let minDistance = this.MinMonsterDistance;
		let target = get_nearest_monster({target: character.name});

		if (!target)
		{
			target = get_nearest_monster();
		}

		if (target && this.DoNotKite.includes(target.mtype))
		{
			return;
		}

		//	try to move out of the monster's range
		if (target && (distance(character, target) < target.range || distance(character, target) < minDistance))
		{
			let currentPos = {x: character.real_x, y: character.real_y};
			let right = 0;
			let up = 0;
			let reverse = this.IsStuck ? -1 : 1;

			if (target.x < character.x)
			{
				right = -(minDistance) * reverse;
			} 
			else
			{
				right = (minDistance) * reverse;
			}

			if (target.y < character.y)
			{
				up = (minDistance) * reverse;
			} 
			else
			{
				up = -(minDistance) * reverse;
			}

			let adjustment = {x: character.x + right, y: character.y + up};

			if (!this.isInFarmSpawnBounds(adjustment))
			{
				approachTarget(getFarmSpotCoords());
			} 
			else
			{
				smart_move(adjustment, () =>
				{
					this.stuckCheck(currentPos);
				});
			}
		}
	}
	
	stuckCheck(originalPosition)
	{
		this.IsStuck = distance(originalPosition, {x: character.real_x, y: character.real_y}) < 1;

		if (this.IsStuck)
		{
			stop();
			writeToLog(character.name + " is stuck!");
			// setTimeout(() =>
			// {
				// if (!botChar.IsStuck)
				// {
				// 	return;
				// }

				// writeToLog(character.name + " is still stuck and returning to town.");
				// IsStuck = false;
				// goBackToTown();

			// }, 30000);
		}
	}
	
	isInFarmSpawnBounds(coords)
	{
		let center = this.getFarmSpotCoords();

		if (character.name === SoloCharacter)
		{
			return distance(coords, center) < SoloFarmRadius;
		} 
		else
		{
			return distance(coords, center) < FarmRadius;
		}
	}

	getFarmSpotCoords()
	{
		let center = {x: 0, y: 0};

		let monster = G.maps[this.FarmSpawn.map].monsters.find((x) =>
		{
			if (x.type === this.FarmSpawn.name && x.count === this.FarmSpawn.number) return x;
		});

		center.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
		center.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);

		return center;
	}
	
	isMoving()
	{
		return (is_moving(character) || smart.moving || this.GoingBackToTown || this.Traveling);
	}

	tidyInventory()
	{
		if (character.q.upgrade || character.q.compound)
		{
			return;
		}

		let slotToMove = -1;
		let lastEmptySlot = -1;
		for (let i = 0; i < character.items.length; i++)
		{
			let item = character.items[i];

			if (item && item.name === "placeholder")
			{
				continue;
			}

			if (item && slotToMove === -1)
			{
				slotToMove = i;
			} 
			else if (slotToMove !== -1 && !item)
			{
				lastEmptySlot = i;
			}
		}

		if (lastEmptySlot > 0 && slotToMove >= 0)
		{
			swap(slotToMove, lastEmptySlot);
		}
	}

	usePotions()
	{
		if (character.rip)
		{
			return;
		}

		let hPotRecovery = 500;//G.items[Potions[0]].gives.hp;
		let mPotRecovery = 500;//G.items[Potions[1]].gives.mp;

		if ((character.hp <= (character.max_hp - hPotRecovery) || character.mp <= (character.max_mp - mPotRecovery)))
		{
			use_hp_or_mp();
		}
	}
}