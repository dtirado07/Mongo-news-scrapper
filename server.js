var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
//set engine and default for handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB

mongoose.connect("mongodb://dtirado:VLqEyhxihk3J27H@ds249017.mlab.com:49017/heroku_fx1602gw", { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.steelers.com/news").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // With cheerio, find each p-tag with the "title" class
        // (i: iterator. element: the current element)
        $("div.d3-l-col__col-4").each(function (i, element) {

            var results = [];
            // Save the text of the element in a "title" variable
            var title = $(element).find("h3.d3-o-media-object__title").text();

            // In the currently selected element, look at its child elements (i.e., its a-tags),
            // then save the values for any "href" attributes that the child elements may have
            var link = $(element).find("a").attr("href");

            // Save these results in an object that we'll push into the results array we defined earlier
            results.push({
                title: title,
                link: link
            });
            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title and link)
            // Create a new Article using the `result` object built from scraping
            db.Article.create(results)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send("Scrape Complete");
    });
});


app.get("/", function (req, res) {
    db.Article.find({ "saved": false }, function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("home", hbsObject);
    });
});

app.get("/saved", function (req, res) {
    db.Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("myarticles", hbsObject);
    });
});

app.get("/articles", function (req, res) {
    // Grab every doc in the Articles array
    db.Article.find({}, function (error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        else {
            res.json(doc);
        }
    });
});
app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ "_id": req.params.id })
        .populate("note")
        .exec(function (error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            else {
                res.json(doc);
            }
        });
});

app.post("/articles/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(doc);
            }
        });
});

// Delete an article
app.post("/articles/delete/:id", function (req, res) {
    db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false, "notes": [] })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(doc);
            }
        });
});




// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});