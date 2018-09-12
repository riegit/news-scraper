var express = require("express");
var method = require("method-override");
var body = require("body-parser");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");
var request = require("request");

var Note = require("./models/Note");
var Article = require("./models/Article");
var databaseUrl = "mongodb://localhost/testscraper";

mongoose.connect(
  databaseUrl,
  { useNewUrlParser: true }
);

var app = express();
var port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(express.static("public"));
app.use(body.urlencoded({ extended: false }));
app.use(method("_method"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.listen(port, function() {
  console.log("Listening on port " + port);
});

//Routes
app.get("/scapte", function(req, res) {
  request("https://www.nytimes.com/section/world", function(req, res, html) {
    var $ = cheerio.load(html);

    $("div.story-body").each(function(i, element) {
      var result = {};
      result.title = $(element)
        .find("h2.class")
        .text()
        .trim();
      result.link = $(element)
        .find("a")
        .attr("href");
      result.summary = $(element)
        .find("p.summary")
        .text()
        .trim();

      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });
    res.send("Scrape completed");
  });
});
