// Dependencies

var express = require("express");
var method = require("method-override");
var body = require("body-parser");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");
var request = require("request");

// Mongoose

var Note = require("./models/Note");
var Article = require("./models/Article");
var databaseUrl = "mongodb://localhost/mongoscraper";

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect(
    databaseUrl,
    { useNewUrlParser: true }
  );
}

mongoose.Promise = Promise;
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

var app = express();
var port = process.env.PORT || 3000;

// app set-ups

app.use(logger("dev"));
app.use(express.static("public"));
app.use(body.urlencoded({ extended: false }));
app.use(method("_method"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.listen(port, function() {
  console.log("Listening on port " + port);
});

// Routes

app.get("/", function(req, res) {
  Article.find({}, null, { sort: { created: -1 } }, function(err, data) {
    if (data.length === 0) {
      res.render("placeholder", {
        message:
          'There\'s no news yet. Please click "Scrape Articles" to populate news.'
      });
    } else {
      res.render("index", { articles: data });
    }
  });
});

app.get("/scrape", function(req, res) {
  request("https://www.nytimes.com/section/technology", function(
    error,
    response,
    html
  ) {
    var $ = cheerio.load(html);
    var result = {};
    $("div.story-body").each(function(i, element) {
      var link = $(element)
        .find("a")
        .attr("href");
      var title = $(element)
        .find("h2.headline")
        .text()
        .trim();
      var summary = $(element)
        .find("p.summary")
        .text()
        .trim();

      result.link = link;
      result.title = title;
      if (summary) {
        result.summary = summary;
      }

      var entry = new Article(result);
      Article.find({ title: result.title }, function(err, data) {
        if (data.length === 0) {
          entry.save(function(err, data) {
            if (err) throw err;
          });
        }
      });
    });
    console.log("Scrape finished.");
    res.redirect("/");
  });
});

app.post("/note/:id", function(req, res) {
  var note = new Note(req.body);
  note.save(function(err, doc) {
    if (err) throw err;
    Article.findByIdAndUpdate(
      req.params.id,
      { $set: { note: doc._id } },
      { new: true },
      function(err, newdoc) {
        if (err) throw err;
        else {
          res.send(newdoc);
        }
      }
    );
  });
});

app.get("/note/:id", function(req, res) {
  var id = req.params.id;
  Article.findById(id)
    .populate("note")
    .exec(function(err, data) {
      res.send(data.note);
    });
});
