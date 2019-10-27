const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const cheerio = require('cheerio')
const request = require('request');
const _ = require('lodash');

const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const getLinks = (html) => {
    const $ = cheerio.load(html);
    const links = $("a");
    let hrefs = [];

    $(links).each((i, link) => {
        const href = $(link).attr('href');

        if (!href) return;

        hrefs.push(href);
    });

    return hrefs;
}

const makePageRequest = (url) => {
    request(url, (err, res) => {
        if (err) return Error("Oops.. Something went wrong!");
        
        const links = getLinks(res.body);
        
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
const link = "https://kingfitness.com.ua/kharkiv-magelan";
makePageRequest(link);