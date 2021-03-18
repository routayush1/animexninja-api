const app = require("express")();
const { v4 } = require("uuid");
const cheerio = require("cheerio");
const cors = require("cors");
const rs = require("request");
const port = 5000;
app.use(cors());
const baseURL = "https://gogoanime.pro/";

app.get("/api/home", (req, res) => {
  let info = {
    popular: "https://anime-x.vercel.app/api/popular/:page",
    details: "https://anime-x.vercel.app/api/details/:id",
    search: "https://anime-x.vercel.app/api/search/:word/:page",
    episode_link: "https://anime-x.vercel.app/api/watching/:id/:episode",
    genre: "https://anime-x.vercel.app/api/genre/:type/:page",
    recently_added: "https://anime-x.vercel.app/api/recentlyadded/:page",
    anime_list: "https://anime-x.vercel.app/api/list/:page",
    genrelist: "https://anime-x.vercel.app/api/genrelist",
  };
  res.send(info);
});
app.get("/api/popular/:page", (req, res) => {
  let results = [];
  let page = req.params.page;
  if (isNaN(page)) {
    return res.status(404).json({ results });
  }
  url = `${baseURL}popular.html?page=${req.params.page}`;
  rs(url, (error, response, html) => {
    if (!error) {
      try {
        var $ = cheerio.load(html);
        $(".img").each(function (index, element) {
          let title = $(this).children("a").attr().title;
          let id = $(this).children("a").attr().href.slice(10);
          let image = $(this).children("a").children("img").attr().src;

          results[index] = { title, id, image };
        });
        res.status(200).json({ results });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

app.get("/api/details/:id", (req, res) => {
  let results = [];

  siteUrl = `${baseURL}category/${req.params.id}`;
  rs(siteUrl, (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);
        var type = " ";
        var summary = "";
        var relased = "";
        var status = "";
        var genres = "";
        var Othername = "";
        var title = $(".anime_info_body_bg").children("h1").text();
        var image = $(".anime_info_body_bg").children("img").attr().src;

        $("p.type").each(function (index, element) {
          if ("Type: " == $(this).children("span").text()) {
            type = $(this).text().slice(15, -5);
          } else if ("Plot Summary: " == $(this).children("span").text()) {
            summary = $(this).text().slice(14);
          } else if ("Released: " == $(this).children("span").text()) {
            relased = $(this).text().slice(10);
          } else if ("Status: " == $(this).children("span").text()) {
            status = $(this).text().slice(8);
          } else if ("Genre: " == $(this).children("span").text()) {
            genres = $(this).text().slice(20, -4);
            genres = genres.split(",");
            genres = genres.join(",");
          } else "Other name: " == $(this).children("span").text();
          {
            Othername = $(this).text().slice(12);
          }
        });
        genres.replace(" ");
        var totalepisode = $("#episode_page")
          .children("li")
          .last()
          .children("a")
          .attr().ep_end;
        results[0] = {
          title,
          image,
          type,
          summary,
          relased,
          genres,
          status,
          totalepisode,
          Othername,
        };
        res.status(200).json({ results });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

app.get("/api/search/:word/:page", (req, res) => {
  let results = [];
  var word = req.params.word;
  let page = req.params.page;
  if (isNaN(page)) {
    return res.status(404).json({ results });
  }

  url = `${baseURL}/search.html?keyword=${word}&page=${req.params.page}`;
  rs(url, (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);
        $(".img").each(function (index, element) {
          let title = $(this).children("a").attr().title;
          let id = $(this).children("a").attr().href.slice(10);
          let image = $(this).children("a").children("img").attr().src;

          results[index] = { title, id, image };
        });
        res.status(200).json({ results });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

async function getLink(Link) {
  rs(Link, (err, resp, html) => {
    if (!err) {
      var $ = cheerio.load(html);
      let links = [];
      $("a").each((i, e) => {
        if (e.attribs.download === "") {
          links.push(e.attribs.href);
        }
      });
      return links;
    }
  });
}

app.get("/api/watching/:id/:episode", (req, res) => {
  let link = "";
  let nl = [];
  var totalepisode = [];
  var id = req.params.id;
  var episode = req.params.episode;
  url = `${baseURL + id}-episode-${episode}`;
  rs(url, async (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);

        if ($(".entry-title").text() === "404") {
          return res
            .status(404)
            .json({ links: [], link, totalepisode: totalepisode });
        }

        totalepisode = $("#episode_page")
          .children("li")
          .last()
          .children("a")
          .text()
          .split("-");
        totalepisode = totalepisode[totalepisode.length - 1];
        link = $("li.anime").children("a").attr("data-video");
        const cl = "http:" + link.replace("streaming.php", "download");
        rs(cl, (err, resp, html) => {
          if (!err) {
            try {
              var $ = cheerio.load(html);
              $("a").each((i, e) => {
                if (e.attribs.download === "") {
                  var li = e.children[0].data
                    .slice(21)
                    .replace("(", "")
                    .replace(")", "")
                    .replace(" - mp4", "");
                  nl.push({
                    src: e.attribs.href,
                    size: li == "HDP" ? "High Speed" : li,
                  });
                }
              });
              return res
                .status(200)
                .json({ links: nl, link, totalepisode: totalepisode });
            } catch (e) {
              return res
                .status(200)
                .json({ links: nl, link, totalepisode: totalepisode });
            }
          }
        });
      } catch (e) {
        return res
          .status(404)
          .json({ links: [], link: "", totalepisode: totalepisode });
      }
    }
  });
});

app.get("/api/genre/:type/:page", (req, res) => {
  var results = [];
  var type = req.params.type;
  var page = req.params.page;
  if (isNaN(page)) {
    return res.status(404).json({ results });
  }
  url = `${baseURL}genre/${type}?page=${page}`;
  rs(url, (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);
        $(".img").each(function (index, element) {
          let title = $(this).children("a").attr().title;
          let id = $(this).children("a").attr().href.slice(10);
          let image = $(this).children("a").children("img").attr().src;

          results[index] = { title, id, image };
        });

        res.status(200).json({ results });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

app.get("/api/recentlyadded/:page", (req, res) => {
  var page = req.params.page;
  var results = [];
  if (isNaN(page)) {
    return res.status(404).json({ results });
  }
  url = `${baseURL}?page=${page}`;
  rs(url, (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);
        $(".img").each(function (index, element) {
          let title = $(this).children("a").attr().title;
          let id = $(this).children("a").attr().href.slice(1);
          let image = $(this).children("a").children("img").attr().src;
          let episodenumber = $(this)
            .parent()
            .children("p.episode")
            .text()
            .replace(" ", "-")
            .toLowerCase();
          id = id.replace("-" + episodenumber, "");
          episodenumber = episodenumber.replace("episode-", "");
          results[index] = { title, id, image, episodenumber };
        });

        res.status(200).json({ results });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

app.get("/api/genrelist", (req, res) => {
  var list = [];

  let url = baseURL;
  rs(url, (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);
        $("nav.genre")
          .children("ul")
          .children("li")
          .each(function (index, element) {
            list[index] = $(this).text();
          });

        res.status(200).json({ list });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

app.get("/api/list/:variable/:page", (req, res) => {
  var list = [];
  var page = req.params.page;

  if (isNaN(page)) {
    return res.status(404).json({ list });
  }
  var alphabet = req.params.variable;
  let url = `${baseURL}anime-list.html?page=${page}`;

  if (alphabet !== "all") {
    url = `${baseURL}anime-list-${alphabet}?page=${page}`;
  }

  rs(url, (err, resp, html) => {
    if (!err) {
      try {
        var $ = cheerio.load(html);
        $("ul.listing")
          .children("li")
          .each(function (index, element) {
            let title = $(this).children("a").text();

            let id = $(this).children("a").attr().href.slice(10);

            list[index] = { title, id };
          });

        res.status(200).json({ list });
      } catch (e) {
        res.status(404).json({ e: "404 fuck off!!!!!" });
      }
    }
  });
});

app.listen(port, () => console.log("running on 5000"));

module.exports = app;
