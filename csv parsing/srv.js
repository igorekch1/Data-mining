const csv = require('csvtojson')
const sw = require('stopword');
const _ = require('lodash');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const port = 3001;
const csvFilePath = "sms-spam-corpus.csv";

app.use(cors());
app.use(bodyParser.json())

const stopWordsList = ["I", "a", "about", "an", "are", "as", "at", "be", "by", "com", "for", "from", "how", "in", "is", "it", 
    "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "where", "who", "will", "with", "the", "www", "its"];

const processData = (str) => {
    // cast to lower case
    const lowerCaseString = str.toLowerCase();
    // regexp for numbers
    const withNoDigits = lowerCaseString.replace(/[0-9]/g, '');
    // regexp for special characters
    const withNoSpecCharacters = withNoDigits.replace(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/g).split(" ");  
    // removing stopwords
    const withNoStopwords = sw.removeStopwords(withNoSpecCharacters, stopWordsList).join(" ");
    
    return withNoStopwords;
}

const getJSONfromCSV = async (file) => {
    const res = await csv().fromFile(file);
    
    const newArr = _.chain(res)
        .groupBy("v1")
        .map((value, key) => ({ category: key, phrasesList: value.map(obj => processData(obj.v2)) }))
        .value();

    return newArr;
}

// get array of length of words by category
const getWordsLengthList = (list, { category }) => {
    const categoryList = list.find((categoryList) => categoryList.category === category);
    const phrasesText = categoryList.phrasesList.join(" ").split(" ");
    const wordsLengthList = phrasesText
        .map(word => (!word || word.length === 0) ? null : word.length)
        .filter(word => word != null)
    
    return wordsLengthList;
}

// get number of average length of words by category
const getAverageWordLength = (list, { category }) => {
    const categoryWordsLengthList = getWordsLengthList(list, { category });
    const generalWordsLength = categoryWordsLengthList
        .reduce((acc, curVal) => acc + curVal, 0);
    const averageWordLength = generalWordsLength / categoryWordsLengthList.length;
    
    return averageWordLength.toFixed(2);
}

// get array of length of phrases by category
const getPhrasesLengthList = (list, { category }) => {
    const categoryList = list.find((categoryList) => categoryList.category === category);
    const phraseLengthList = categoryList.phrasesList.map(phrase => phrase.length);
    
    return phraseLengthList;
}

// get number of length of phrase by category
const getAveragePhraseLength = (list, { category }) => {
    const categoryPharsesLengthList = getPhrasesLengthList(list, { category });
    const generalPrasesLength = categoryPharsesLengthList.reduce((acc, curVal) => acc + curVal, 0);
    const averagePhraseLength = generalPrasesLength / categoryPharsesLengthList.length;

    return averagePhraseLength.toFixed(2);
}

const getWordFrequence = (wordsLength) => {
    const countedWords = wordsLength.reduce((acc, curr) => { 
        if(!curr) return acc;
        
        if (curr in acc) {
            acc[curr]++;
        } else {
            acc[curr] = 1;
        }

        return acc;
    }, {});
    
    return countedWords;
}

// get an ordered array of frequence
const getWordLengthFrequence = (hamWords, spamWords) => {
    const wordHamFrequence = _.keys(getWordFrequence(hamWords)).map(w => parseInt(w));
    const wordSpamFrequence = _.keys(getWordFrequence(spamWords)).map(w => parseInt(w));
    
    return [...new Set(wordHamFrequence.concat(wordSpamFrequence))].sort((a, b) => a - b);
}

// fill array with 0 if no similar values with frequence
const getListWithNoConvergence = (wordsLengthList, wordLengthFrequence) => {
    const frequenceArr =  Object.entries(wordsLengthList).map(([key,]) => parseInt(key));
    
    return wordLengthFrequence.map(len => frequenceArr.includes(len) ? len : 0);
}

// get most frequent words by category
const getMostFrequentWords = (list, { category }, wordsQ) => {
    const categoryList = list.find((categoryList) => categoryList.category === category);
    const words = categoryList.phrasesList.join(" ").split(" ");

    const countedWords = getWordFrequence(words);
    const countedWordsArr = Object.keys(countedWords).map((key) => {
        return {
            word: key,
            frequency: countedWords[key]
        };
    });

    return _.orderBy(countedWordsArr, ['frequency'], ['desc']).slice(0, wordsQ);
}

// get an ordered array of frequence
const getFullFrequence = (hamWords, spamWords) => {
    const wordHamFrequence = hamWords.map(w => w.frequency);
    const wordSpamFrequence = spamWords.map(w => w.frequency);
    
    return [...new Set(wordHamFrequence.concat(wordSpamFrequence))].sort((a, b) => a - b);
}

const getWordByFrequency = (arr, frequency) => {
    const foundItem = arr.find(item => item.frequency === frequency);

    return foundItem.word;
} 

// fill array with "" if no similar values with frequence
const getWordsWithNoConvergence = (wordsLengthList, wordLengthFrequence) => {
    const frequenceArr =  wordsLengthList.map(item => item.frequency);

    return wordLengthFrequence.map(len => frequenceArr.includes(len) 
        ? getWordByFrequency(wordsLengthList, len) 
        : ""
    );
}

// app.get('/', async (req, res) => {
    
(async function() {
    const jsonCSV = await getJSONfromCSV(csvFilePath);
    
    const hamWordsLengthList = getWordsLengthList(jsonCSV, { category: "ham" });
    const spamWordsLengthList = getWordsLengthList(jsonCSV, { category: "spam" });
    
    const hamWordFrequence = getWordFrequence(hamWordsLengthList);
    const spamWordFrequence = getWordFrequence(spamWordsLengthList);
    
    // ------------------- task 1A --------------------
    const wordLengthFrequence = getWordLengthFrequence(hamWordsLengthList, spamWordsLengthList);
    const updatedHamWordFrequence = getListWithNoConvergence(hamWordFrequence, wordLengthFrequence);
    const updatedSpamWordFrequence = getListWithNoConvergence(spamWordFrequence, wordLengthFrequence);
   // ------------------------------------------------

    // ------------------ task 1B ---------------------
    const hamAverageWordLength = getAverageWordLength(jsonCSV, { category: "ham" });
    const spamAverageWordLength = getAverageWordLength(jsonCSV, { category: "spam" });
    // -----------------------------------------------

    const hamPhrasesLengthList = getPhrasesLengthList(jsonCSV, { category: "ham" });
    const spamPhrasesLengthList = getPhrasesLengthList(jsonCSV, { category: "spam" });
    
    const hamPhraseFrequence = getWordFrequence(hamPhrasesLengthList);
    const spamPhraseFrequence = getWordFrequence(spamPhrasesLengthList);
    
    // ------------------ task 2A --------------------
    const phraseLengthFrequence = getWordLengthFrequence(hamPhrasesLengthList, spamPhrasesLengthList);
    const updatedHamPhraseFrequence = getListWithNoConvergence(hamPhraseFrequence, phraseLengthFrequence);
    const updatedSpamPhraseFrequence = getListWithNoConvergence(spamPhraseFrequence, phraseLengthFrequence);
    // -----------------------------------------------
    
    // ----------------- task 2B ---------------------
    const hamAveragePhraseLength = getAveragePhraseLength(jsonCSV, { category: "ham" });
    const spamAveragePhraseLength = getAveragePhraseLength(jsonCSV, { category: "spam" });
    // -----------------------------------------------

    const hamMostFrequentWords = getMostFrequentWords(jsonCSV, { category: "ham" }, 20);
    const spamMostFrequentWords = getMostFrequentWords(jsonCSV, { category: "spam" }, 20);
    
    // ----------------- task 3 ----------------------
    const topWordFrequence = getFullFrequence(hamMostFrequentWords, spamMostFrequentWords);
    const updatedHamMostFrequentWords = getWordsWithNoConvergence(hamMostFrequentWords, topWordFrequence);
    const updatedSpamMostFrequentWords = getWordsWithNoConvergence(spamMostFrequentWords, topWordFrequence);
    // ------------------------------------------------
   
    
    // res.end(JSON.stringify({
    //     hamMostFrequentWords,
    //     spamMostFrequentWords
    // }));
})();
    // });
    
// app.listen(port, () => console.log(`Server is runnin on port ${port}`));