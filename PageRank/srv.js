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

const getLinks = (html) => {
    // Creating html page txt
    const $ = cheerio.load(html);
    // Get all 'a' tags
    const links = $("a");
    let hrefs = [];

    // Getting all hrefs from a tag
    $(links).each((i, link) => {
        const href = $(link).attr('href');

        if (!href) return;

        // get absolute path to page URL
        const absoluteUrl = url.resolve(pageLink, href);

        hrefs.push(absoluteUrl);
    });

    // Get only http / https links
    const httpHrefs = hrefs.filter(href => 
        href.startsWith("http://") || href.startsWith("https://")
    );

    return httpHrefs;
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

// const link = "http://stackabuse.com";
const pageLink = "https://kingfitness.com.ua/kharkiv-magelan";
makePageRequest(pageLink);