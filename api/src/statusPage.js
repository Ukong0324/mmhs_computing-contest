var http = require('http');
 
// The following 4 are the actual values that pertain to your account and this specific metric.
var apiKey = '7c8a07df-f2d8-4966-ace6-23383696cd28';
var pageId = '7vjfbx9v4d3d';
var metricId = 'q5sfnrbsyt9g';
var apiBase = 'http://api.statuspage.io/v1';
 
var url = apiBase + '/pages/' + pageId + '/metrics/' + metricId + '/data.json';
var authHeader = { 'Authorization': 'OAuth ' + apiKey };
var options = { method: 'POST', headers: authHeader };
 
// Need at least 1 data point for every 5 minutes.
// Submit random data for the whole day.
var totalPoints = 60 / 5 * 24;
var epochInSeconds = Math.floor(new Date() / 1000);
 
// This function gets called every second.
function submit(count) {
  count = count + 1;
 
  if(count > totalPoints) return;
 
  var currentTimestamp = epochInSeconds - (count - 1) * 5 * 60;
  var randomValue = Math.floor(Math.random() * 1000);
 
  var data = {
    timestamp: currentTimestamp,
    value: randomValue,
  };
 
  var request = http.request(url, options, function (res) {
    if (res.statusMessage === "Unauthorized") {
      const genericError =
        "Error encountered. Please ensure that your page code and authorization key are correct.";
      return console.error(genericError);
    }
    res.on("data", function () {
      console.log("Submitted point " + count + " of " + totalPoints);
    });
    res.on("end", function () {
      setTimeout(function () {
        submit(count);
      }, 1000);
    });
    res.on("error", (error) => {
      console.error(`Error caught: ${error.message}`);
    });
  });
 
  request.end(JSON.stringify({ data: data }));
}
 
// Initial call to start submitting data.
submit(0);