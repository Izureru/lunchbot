var restify = require('restify')
var logger = require('morgan')
var request = require('request');

var VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN;
var msqId = process.env.MSQ_ID;
var wsId = process.env.WS_ID;
var ebtId = process.env.EBT_ID;

if (!VERIFY_TOKEN) {
  console.error('SLACK_VERIFY_TOKEN is required')
  process.exit(1)
}
var PORT = process.env.PORT || 8080

var server = restify.createServer()
server.use(logger('tiny'))
server.use(restify.queryParser());

var getDay =  function() {
    var d = new Date();
    var weekday = new Array(7);
    weekday[0]=  "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
console.log(weekday[d.getDay()]);
    return weekday[d.getDay()];
}

var spreadSheetId = '';
var url = "https://spreadsheets.google.com/feeds/list/" + spreadSheetId + "/od6/public/values?alt=json";
var dayNameVar = 'gsx$' + getDay().toLowerCase();
var areaAmounts;

server.get('/lunch', function (req, res) {
	switch (req.query.text) {
		case 'ebt': areaAmounts = 6; spreadSheetId = ebtId;
		break;

		case 'msq': areaAmounts = 9; spreadSheetId = msqId;
		break;

		case 'ws': areaAmounts = 9; spreadSheetId = wsId;
	}
	url = "https://spreadsheets.google.com/feeds/list/" + spreadSheetId + "/od6/public/values?alt=json";
		request(url, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var parsedBody = JSON.parse(body);
			var menuReturned = "";
			for (var i = 1; i < areaAmounts; i++) {
				var lunchItem = parsedBody.feed.entry[i][dayNameVar].$t;
				var selectionType = parsedBody.feed.entry[i].gsx$type.$t;
				console.log(selectionType);
				var returnMessage = getDay() + "'s " + selectionType + " is " + lunchItem;
				menuReturned = menuReturned + "\n \n" + returnMessage;
			}
				sendMenu(menuReturned, res);
		}
		});
});

function sendMenu(message,res ) {
	res.send({response_type: 'ephemeral', text: message})
};

server.listen(PORT, function (err) {
  if (err) {
    return console.error('Error starting server: ', err)
  }

  console.log('Server successfully started on port %s', PORT)
})
