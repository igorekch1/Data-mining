const csv = require('csvtojson');
const sw = require('stopword');
const _ = require('lodash');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const port = 3001;
const csvFilePath = "sms-spam-corpus.csv";

app.use(cors());
app.use(bodyParser.json());


const stopWordsList = ["i", "a", "about", "an", "are", "as", "at", "be", "by", "com", "for", "from", "how", "in", "is", "it", 
    "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "where", "who", "will", "with", "the", "www", "its"];

const processData = (str) => {
    // cast to lower case
    const lowerCaseString = str.toLowerCase();
    // regexp for numbers
    const withNoDigits = lowerCaseString.replace(/[0-9]/g, '');
    // regexp for special characters
    const withNoSpecCharacters = withNoDigits.replace(/[^a-zA-Z ]/g, "").split(" ");  
    // removing stopwords
    const withNoStopwords = sw.removeStopwords(withNoSpecCharacters, stopWordsList).join(" ");
    
    return withNoStopwords.toLowerCase();
}

const getJSONfromCSV = async (file) => {
    const res = await csv().fromFile(file);
    
    const newArr = _.chain(res)
        .groupBy("v1")
        .map((value, key) => ({ category: key, phrasesList: value.map(obj => processData(obj.v2)) }))
        .value();

    return newArr;
}

// get all words from category
const getWordsFromCategory = async (category) => {
    const jsonCSV = await getJSONfromCSV(csvFilePath);
    const categoryList = jsonCSV.find((categoryList) => categoryList.category === category);
    const words = categoryList.phrasesList.join(" ").split(" ");
    
    return words;
}

// find words that are not in category
const getWordsNotInCategory = (searchArr, categoryWords) => {
    const wordsNotInCategory = searchArr.filter(word => !categoryWords.includes(word));
    
    return wordsNotInCategory; 
}


// find apperance probability of word from category
const findWordProbability = (word) => {

}

// get apperance probability of each word from category
const getWordArrProbability = (wordArr, categoryWords) => {
    const countedWords = wordArr
        .map((word) => {
            const wordProbability =  categoryWords.reduce((acc, curr) => { 
                if(!curr) return acc;
                
                if (curr === word) {
                    if (curr in acc) {
                        acc[curr]++;
                    } else {
                        acc[curr] = 1;
                    }
                } 

                return acc;
            }, {});
            
            wordProbability[word] = _.isEmpty(wordProbability) ? 1 : wordProbability[word];
            
            return wordProbability;
        });

    return countedWords;
}

// count probability by Bayes P(word1|category) * P(word2|category) * ...
const countProbabilityByBayes = (wordProbability, denominator) => {
    const wordProbabilityValues = wordProbability.map(item => Object.values(item).find(x => x));
    // console.log("www",wordProbabilityValues)
    const probability = wordProbabilityValues
        .reduce((acc, val) => acc * (val / denominator), 1);

    return probability;
}

// count general probability by Bayes P(bodytext|category) / Q
const findPhraseProbability = async (phrase, category) => {
    const wordsFromCategory = await getWordsFromCategory(category);
    const wordArr = phrase.split(" ");
    const wordsNotInCategory = getWordsNotInCategory(wordArr, wordsFromCategory);
    
    // full Q words in category
    // if all words in cateroy -> denominator = Q words
    // else denominator = Q words + word length that are not in category
    const wordsLengthFromCategory = wordsNotInCategory.length 
        ? wordsFromCategory.length + wordsNotInCategory.length
        : wordsFromCategory.length;

    // arr of numerators
    // if all words in cateroy -> numerator = numerator
    // else numerator = numerator + 1 
    const wordArrProbability = getWordArrProbability(wordArr, wordsFromCategory);
    const wordProbability = wordsNotInCategory.length 
    ? wordArrProbability
        .map(item => {
            const tmpValue = Object.values(item).find(x => x);
            const tmpKey = Object.keys(item).find(x => x);
            
            item[tmpKey] = tmpValue === 1 ? tmpValue : tmpValue + 1; 
            return item;
        })
    : wordArrProbability;

    const probabilityByBayes = countProbabilityByBayes(wordProbability, wordsLengthFromCategory)
    
    return probabilityByBayes;
}

app.post('/search-phrase', async (req, res) => {
    const { search } = req.body; 

    const hamProbabilty = await findPhraseProbability(search, "ham");
    const spamProbabilty = await findPhraseProbability(search, "spam");
    
    res.status(200);
    res.json({
        spam: hamProbabilty,
        ham: spamProbabilty
    });
});
    
app.listen(port, () => console.log(`Server is runnin on port ${port}`));