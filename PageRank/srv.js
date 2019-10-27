const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser'); 
const url = require('url'); 

const cheerio = require('cheerio')
const request = require('request');
const _ = require('lodash');

const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// const link = "http://stackabuse.com";
const pageLink = "https://kingfitness.com.ua/kharkiv-magelan";
const hostName = new URL(pageLink).hostname;

const getLinks = (html) => {
    // Creating html page txt
    const $ = cheerio.load(html);
    // Get all 'a' tags
    const links = $("a");
    let urls = [];

    // Getting all hrefs from a tag
    $(links).each((i, link) => {
        const href = $(link).attr('href');

        if (!href) return;

        // get absolute path to page URL
        const absoluteUrl = url.resolve(pageLink, href);

        urls.push(absoluteUrl);
    });

    // Get only internal http / https links
    const httpUrls = urls.filter(url => {
        const newUrl = new URL(url);
        
        return (
            (newUrl.protocol === "http:" || 
            newUrl.protocol === "https:") &&
            newUrl.hostname === hostName
        );
    });

    return httpUrls;
}

const makePageRequest = (url) => {
    // Make request on the url to get html
    request(url, (err, res) => {
        if (err) return Error("Oops.. Something went wrong!");
        
        const links = getLinks(res.body);
        console.log(links)
        return links;
    });
}

app.post('/page-rank', async (req, res) => {
    const { url } = req.body; 
    
    res.status(200);
    res.json({test: "test"});
});
    
// app.listen(port, () => console.log(`Server is runnin on port ${port}`));

makePageRequest(pageLink);