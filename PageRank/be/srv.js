const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const url = require("url");

const cheerio = require("cheerio");
const request = require("request");
const _ = require("lodash");

const createPageRank = require("./pagerank");

const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const getLinks = (html, pageLink) => {
    const hostName = new URL(pageLink).hostname;
    // Creating html page txt
    const $ = cheerio.load(html);
    // Get all 'a' tags
    const links = $("a");
    let urls = [];

    // Getting all hrefs from a tag
    $(links).each((i, link) => {
        const href = $(link).attr("href");

        if (!href) return;

        // get absolute path to page URL
        const absoluteUrl = url.resolve(pageLink, href);

        urls.push(absoluteUrl);
    });

    // Get only internal http / https links
    const httpUrls = urls.filter(url => {
        const newUrl = new URL(url);

        return (
            (newUrl.protocol === "http:" || newUrl.protocol === "https:") &&
            newUrl.hostname === hostName
        );
    });

    return _.uniq(httpUrls);
};

// Make request on the url to get html
const parsePage = url => {
    return new Promise((resolve, reject) => {
        // jar - true: Fix "Exceeded maxRedirects. Probably stuck in a redirect loop"
        request({
            jar: true,
            url
        }, (err, res) => {
            if (err) return reject(err);

            try {
                resolve(getLinks(res.body, url));
            } catch (e) {
                reject(e);
            }
        });
    });
};

const allLinks = [],
    outgoingLinks = [];
let i = 0;

const getLinksFromAllPages = async url => {
    // if already visited - return
    if (allLinks.includes(url)) return;

    // push to already visited links in order to not make request again
    allLinks.push(url);

    // links from page
    const links = await parsePage(url);

    outgoingLinks.push({
        id: i,
        // id: i + 1,
        page: url,
        outLinks: links
        // TODO: without itself link
        // do not include link on itself
        // outLinks: links.filter(str => str !== link)
    });

    i++;

    // no more outgoing links - return
    if (links.length === 0) return;

    for (link of links) {
        await getLinksFromAllPages(link);
    }
};

async function getOrientedGraphObject(pageLink) {
    await getLinksFromAllPages(pageLink);

    for (ind in outgoingLinks) {
        const indexes = outgoingLinks[ind].outLinks.map(link => {
            // TODO: if url links to itself return 0
            if (link === outgoingLinks[ind].page) return null;

            const index = outgoingLinks.findIndex(linkObj => {
                return linkObj.page === link;
            });

            return index;
        });

        outgoingLinks[ind].outLinkIndexes = indexes;
    }

    return outgoingLinks;
}

const getGraphNodes = (graph) => {
    return graph.map(node => {
        return node.outLinkIndexes
    });
}

const getFirstTen = (pageRanks, graph) => {
    const orderedRanks = _.orderBy(pageRanks, ['pageRank'], ['desc']).splice(0, 10);

    orderedRanks.forEach(rank => {
        graph.forEach(node => {
            if (rank.id === node.id) {
                rank.page = node.page
            }
        })
    });

    return orderedRanks;
}

const linkProb = 0.5;
const tolerance = 0.0001;

app.post("/page-rank", async (req, res) => {
    const {
        url
    } = req.body;
    const pageLink = "http://localhost/pagerank/index.php";

    try {
        const orientedGraph = await getOrientedGraphObject(url);
        const graphNodes = getGraphNodes(orientedGraph);

        let pageRanks = [];
        createPageRank(graphNodes, linkProb, tolerance, (res) => {
            pageRanks = res;
        }, true);

        const firstTenPageRanks = getFirstTen(pageRanks, orientedGraph);

        res.status(200);
        res.json({
            data: orientedGraph,
            pageRanks: firstTenPageRanks
        });
    } catch (err) {
        res.status(400);
        res.json({
            error: err.message
        });
    }
});

app.listen(port, () => console.log(`Server is runnin on port ${port}`));