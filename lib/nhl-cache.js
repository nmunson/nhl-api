var redis  = require("redis")
var nhl    = require("./nhl")
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
}
else {
  var client = require("redis").createClient()
}

exports.team = function(team, season, gameType, cb){
  // 1. check for cached version 
  // 2. return cache or create cache
  // 3. set expiry for cache
  
  var key = team + season + gameType
  
  client.get(key, function(err, reply){
    if(reply){
      // use cache
      client.incr("cache-hit", function(e,r){ })
      cb(JSON.parse(reply))
    }else{
      // restore cache
      nhl.team(team, season, gameType, function(players){
        client.multi()
        .set(key, JSON.stringify(players))
        .expire(key, 120) // cache will last for two minutes
        .incr("expensive-hit")
        .exec(function(err, replies){
          cb(players)
        })
      })
    }
  })
}

exports.currentSeason = function() {
  var date = new Date()
  var currentYear = date.getFullYear()

  if (date.getMonth() <= 7) // august
    return (currentYear - 1) + "" + currentYear
  else
    return currentYear + "" + (currentYear + 1)
}

exports.gameType = function(type) {
  if (type === "playoffs")
    return "3"
  else
    return "2"
}