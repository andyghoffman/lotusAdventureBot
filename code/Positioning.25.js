//load_file("C:/GitHub/lotusAdventureBot/code/Positioning.25.js");

function positionRoutine()
{
	if(is_moving(character) || smart.moving)
	{
		return;
	}
	
	if(get_targeted_monster() && Settings["PriorityTargets"].includes(get_targeted_monster().mtype))
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
}