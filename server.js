const express = require("express");
const Crawler = require("simplecrawler");
const fs = require("node-fs");
const path = require("path");
const url = require("url");

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/startCrawler", (req, res) => {
  const crawlUrl = req.body.crawlUrl;
  if (!crawlUrl) {
    return res.status(400).json({ error: "Please provide a valid URL." });
  }

  const crawler = new Crawler(crawlUrl);

  crawler.on("crawlstart", function () {
    console.log(__dirname)
    console.log("Crawl starting");
    res.json({ message: "Crawling has started." });
  });

  crawler.on("fetchstart", function (queueItem) {
    console.log("fetchStart", queueItem);
  });

  crawler.on("fetchcomplete", function (queueItem, responseBuffer) {
    var domain = url.parse(crawlUrl).hostname;
    var outputDirectory = path.join(__dirname, "public", domain);
    var parsed = url.parse(queueItem.url);
    if (parsed.pathname === "/") {
      parsed.pathname = "/index.html";
    }
    var dirname = outputDirectory + parsed.pathname.replace(/\/[^\/]+$/, "");
    var filepath = outputDirectory + parsed.pathname;
    // Check if DIR exists
    fs.exists(dirname, function (exists) {
      // If DIR exists, write file
      if (exists) {
        fs.writeFile(filepath, responseBuffer, function () {});
      } else {
        // Else, recursively create dir using node-fs, then write file
        fs.mkdir(dirname, 0o755, true, function () {
          fs.writeFile(filepath, responseBuffer, function () {});
        });
      }
    });
  });

  crawler.on("complete", function () {
    console.log("Finished!");
    res.send("Crawling completed!");
  });

  crawler.start();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});