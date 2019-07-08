$(document).ready(function() {
    // Handle on-click functions
    var articleContainer = $(".article-container");
    $(document).on("click", ".btn.save", articleSave);
    $(document).on("click", ".scrape", articleScrape);
  
    // load page
    start();
  
    function start() {
      // Empty the page
      articleContainer.empty();
      // Get unsaved articles
      $.get("/api/headlines?saved=false").then(function(data) {
        if (data && data.length) {
          renderArticles(data);
        }
        else {
          emptyPage();
        }
      });
    }
  
    // Load unsaved articles
    function renderArticles(articles) {
      var articlecards = [];
      // Loop through all
      for (var i = 0; i < articles.length; i++) {
        // Push into blank array
        articlecards.push(createcard(articles[i]));
      }
      // Append to DOM
      articleContainer.append(articlecards);
    }
    // Create new cards
    function createcard(article) {
      var card = $(
        [
          "<div class='card w-75 p-1 m-3 mx-auto'>",
          "<div class='card-body'>",
          "<div class='card-title'>",
          "<h4>",
          "<a class='article-link' target='_blank' href='" + article.url + "'>",
          article.headline,
          "</a>",
          "</h4>",
          "<a class='btn btn-outline-primary save float-right'>",
          "Save",
          "</a>",
          "</div>",
          article.summary ,
          "</div>",
          "</div>"
        ].join("")
      );
      // Attach article ID
      card.data("_id", article._id);
      // Display
      return card;
    }
    // Display something if there is no articles
    function emptyPage() {
      var emptyAlert = $(
        [
          "<div class='alert alert-warning text-center'>",
          "<h5>There are no articles.  Press the scrape button in top menu.</h5>",
          "</div>",
        ].join("")
      );
      // Append to element
      articleContainer.append(emptyAlert);
    }
  
    // Handle saveing articles
    function articleSave() {
      var articleToSave = $(this)
        .parents(".card")
        .data();
      articleToSave.saved = true;
      // PUT request to API
      $.ajax({
        method: "PUT",
        url: "/api/headlines/" + articleToSave._id,
        data: articleToSave
      }).then(function(data) {
        if (data.saved) {
          // start again..  Basically refresh the page
          start();
        }
      });
    }
    // Run api/fetch
    function articleScrape() {
      $.get("/api/fetch").then(function(data) {
        // Start again.. lol
        start();
      });
    }
  });