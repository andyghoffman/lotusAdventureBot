//load_file("C:/GitHub/lotusAdventureBot/code/Crafting.24.js");

function craftUpgrades(levelToStop=7)
{
	// for (let i = 1; i <= levelToStop; i++)
	// {
	// 	if (craftUpgrade(i))
	// 	{
	// 		break;
	// 	}
	// }
}

function craftUpgrade(targetUpgradeLevel)
{
	// for (let i = 0; i < character.items.length; i++)
	// {
	// 	let item = character.items[i];
	//
	// 	if (item && ItemsToUpgrade.includes(item.name) && item.level < targetUpgradeLevel && !isShiny(item))
	// 	{
	// 		log("Upgrading " + G.items[item.name].name + "...");
	//
	// 		let scroll = "scroll0";
	// 		if (item.level >= UpgradeLevelToUseTierTwoScroll || item.level >= G.items[item.name].grades[0])
	// 		{
	// 			scroll = "scroll1";
	// 		}
	//
	// 		let scrollToUse = locate_item(scroll);
	//
	// 		if (scrollToUse > -1)
	// 		{
	// 			upgrade(i, scrollToUse);
	// 			return true;
	// 		} else
	// 		{
	// 			log("Missing " + G.items[scroll].name);
	// 		}
	// 	}
	// }
	//
	// return false;
}

function craftCompounds(levelToStop = 2)
{
	// for (let i = 0; i < levelToStop; i++)
	// {
	// 	if (craftCompound(i))
	// 	{
	// 		break;
	// 	}
	// }
}

function craftCompound(levelToUse)
{
	// let triple = [-1, -1, -1];
	// let foundItem = "";
	//
	// for (let i = 0; i < ItemsToCompound.length; i++)
	// {
	// 	let count = 0;
	// 	triple = [-1, -1, -1];
	//
	// 	for (let k = 0; k < character.items.length; k++)
	// 	{
	// 		let item = character.items[k];
	// 		if (item && item.name === ItemsToCompound[i] && item.level === levelToUse && count < 3 && !isShiny(item))
	// 		{
	// 			triple[count] = k;
	// 			count++;
	// 		}
	// 	}
	//
	// 	//	found a triple, stop looking
	// 	if (triple[0] !== -1 && triple[1] !== -1 && triple[2] !== -1)
	// 	{
	// 		foundItem = ItemsToCompound[i];
	// 		break;
	// 	}
	// }
	//
	// //	no triple
	// if (foundItem === "")
	// {
	// 	return false;
	// }
	//
	// let item = triple[0];
	//
	// let scroll = "cscroll0";
	// if (item.level >= CompoundLevelToUseTierTwoScroll || item.level >= G.items[foundItem].grades[0])
	// {
	// 	scroll = "cscroll1";
	// }
	//
	// let scrollToUse = locate_item(scroll);
	//
	// if (scrollToUse > -1)
	// {
	// 	log("Compounding three +" + levelToUse + " " + G.items[foundItem].name + "...");
	// 	compound(triple[0], triple[1], triple[2], scrollToUse);
	// 	return true;
	// } else
	// {
	// 	log("Missing " + G.items[scroll].name);
	// }
	//
	// return true;
}