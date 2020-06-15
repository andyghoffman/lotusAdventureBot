//load_file("C:/GitHub/lotusAdventureBot/code/Positioning.25.js");

let tick = 0;

function positionRoutine()
{
	if(is_moving(character) || smart.moving)
	{
		return;
	}
	
	let center = getFarmLocation();
	let targetPos = {x:center.x,y:center.y};
	let theta = Math.atan2(character.y - center.y, character.x - center.x) + (180/Math.PI);
	let radius = Settings["TetherRadius"];
	
	targetPos.x += Math.cos(theta) * radius;
	targetPos.y += Math.sin(theta) * radius;
	
	move(targetPos.x, targetPos.y);
	
	tick++;
	
	// if(is_moving(character) || smart.moving)
	// {
	// 	return;
	// }
	//
	// let radius = 10;
	//
	// for(let e in parent.entities)
	// {
	// 	let target = get_entity(e);
	//
	// 	if(target && distance(character, target) < radius)
	// 	{
	// 		if(target.player)
	// 		{
	//
	// 		}
	// 		else if(target.type === "monster")
	// 		{
	// 			let newPos = {x:target.x, y:target.y};
	// 			let angle = Math.atan2(character.x - target.x, character.y - target.y);
	//
	// 			newPos.x += (radius * Math.cos(angle));
	// 			newPos.y += (radius * Math.sin(angle))
	//			
	//
	// 			move(newPos.x, newPos.y);
	//			
	// 			return;
	// 		}
	// 	}
	// }
}