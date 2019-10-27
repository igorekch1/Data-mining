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

const getLinks = (html, pageLink) => {
    const hostName = new URL(pageLink).hostname;
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
    
    return _.uniq(httpUrls);
}

// Make request on the url to get html
const parsePage = (url) => {
    return new Promise((resolve, reject) => {
        // jar - true: Fix "Exceeded maxRedirects. Probably stuck in a redirect loop"
        request({jar: true, url}, (err, res) => {
            if (err) return reject(err);
            
            try {
                resolve(getLinks(res.body, url));
            } catch(e) {
                reject(e);
            }
        })
    });
}

const allLinks = [], outgoingLinks = [];
let i = 0;

const getLinksFromAllPages = async (url) => {
    // links from page
    const links = await parsePage(url);
    
    // no more outgoing links - return
    if (links.length === 0) {
        allLinks.push(url);
        outgoingLinks.push({
            id: i + 1,
            page: url,
            // do not include link on itself
            outLinks: links.filter(str => str !== url)
        });

        i++;
        return;
    } else {
        for (link of links) {
            // if already visited - return
            if (allLinks.includes(link)) return;
            
            allLinks.push(link);
            outgoingLinks.push({
                id: i + 1,
                page: link,
                // do not include link on itself
                outLinks: links.filter(str => str !== link)
            });
            
            i++;
            await getLinksFromAllPages(link);
        }
    }
}

async function main() {
    // const pageLink = "https://bufet.ua/menyu/";
    const pageLink = "https://hints.littlealchemy2.com/";
    await getLinksFromAllPages(pageLink);

    for (ind in outgoingLinks) {
        const indexes = outgoingLinks[ind].outLinks.map(link => {
            const index = outgoingLinks.findIndex(linkObj => {
                return linkObj.page === link 
            });

            return index + 1;
        });

        outgoingLinks[ind].outLinkIndexes = indexes;
    }
    // TODO: if we need to put 0 on the place for itself for matrix - 
    // remove filter and check for url coincidence in loop 
    
    console.log("Outgoing links on the page - ", outgoingLinks)
}

main()

app.post('/page-rank', async (req, res) => {
    const { url } = req.body; 
    
    // const link = "http://stackabuse.com";
    const pageLink = "https://kingfitness.com.ua/kharkiv-magelan";

    const links = await parsePage(pageLink);

    res.status(200);
    res.json(links);
});
    
// app.listen(port, () => console.log(`Server is runnin on port ${port}`));