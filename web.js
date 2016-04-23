var express = require("express");
var app = express();

app.use(express.logger());

app.use("/", express.static(__dirname));

var server = app.listen(process.env.PORT || 5000, function() {
    console.log("Listening on " + server.address().port);
});
