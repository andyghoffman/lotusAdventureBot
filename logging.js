const fs = require('fs');

function todaysLogName()
{
	let name = "";



	return name;
}

function getCurrentLog()
{
	let logFile = fs.readFile('logs/test.txt', (error, data) =>
	{
		if (error)
		{
			throw (error);
		}

		if (data)
		{
			console.log(data.toString());
		}
	});

	if (logFile)
	{

	}
	else
	{

	}
}

function createNewLogFile()
{
	let fileName = "";
}

let testDate = new Date();
console.log(testDate.toLocaleString());