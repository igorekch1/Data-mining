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
    const wordsLengthValueList =  _.values(wordsLengthList);
    const wordsLengthKeyList =  _.keys(wordsLengthList).map(key => parseInt(key));
    
    return wordLengthFrequence.map((len, i) => {
        return (wordsLengthKeyList.includes(len) && wordsLengthValueList[i]) 
            ? wordsLengthValueList[i] 
            : 0
    });
}

// get most frequent words by category
const getMostFrequentWords = (lists, wordsQ) => {
    const fullWordList = lists.map(list => wordList = list.phrasesList.join(" "))
        .join(" ")
        .split(" ");
    
    const countedWords = getWordFrequence(fullWordList);
    const countedWordsArr = Object.keys(countedWords).map((key) => {
        return {
            word: key,
            frequency: countedWords[key]
        };
    });
    
    return _.orderBy(countedWordsArr, ['frequency'], ['desc']).slice(0, wordsQ).reverse();
}

const getMostFrequentWordsArr = (words) => {
    return words.map(item => [item.word, item.frequency]);
} 

// ------------------- task 1A --------------------
app.get('/words', async (req, res) => {
    const jsonCSV = await getJSONfromCSV(csvFilePath);
    
    const hamWordsLengthList = getWordsLengthList(jsonCSV, { category: "ham" });
    const spamWordsLengthList = getWordsLengthList(jsonCSV, { category: "spam" });
    
    const hamWordFrequence = getWordFrequence(hamWordsLengthList);
    const spamWordFrequence = getWordFrequence(spamWordsLengthList);

    const wordLengthFrequence = getWordLengthFrequence(hamWordsLengthList, spamWordsLengthList);
    const updatedHamWordFrequence = getListWithNoConvergence(hamWordFrequence, wordLengthFrequence);
    const updatedSpamWordFrequence = getListWithNoConvergence(spamWordFrequence, wordLengthFrequence);

    res.json({
        categories: wordLengthFrequence,
        series: [
            {
                name: "ham",
                data: updatedHamWordFrequence
            },{
                name: "spam",
                data: updatedSpamWordFrequence
            }
        ]
    });
});
// ------------------------------------------------

// ------------------ task 1B ---------------------
app.get('/words/average', async (req, res) => {
    const jsonCSV = await getJSONfromCSV(csvFilePath);

    const hamAverageWordLength = getAverageWordLength(jsonCSV, { category: "ham" });
    const spamAverageWordLength = getAverageWordLength(jsonCSV, { category: "spam" });

    res.json({ hamAverageWordLength, spamAverageWordLength });
});
// -----------------------------------------------

// ------------------ task 2A --------------------
app.get('/phrases', async (req, res) => {
    const jsonCSV = await getJSONfromCSV(csvFilePath);

    const hamPhrasesLengthList = getPhrasesLengthList(jsonCSV, { category: "ham" });
    const spamPhrasesLengthList = getPhrasesLengthList(jsonCSV, { category: "spam" });
    
    const hamPhraseFrequence = getWordFrequence(hamPhrasesLengthList);
    const spamPhraseFrequence = getWordFrequence(spamPhrasesLengthList);
    
    const phraseLengthFrequence = getWordLengthFrequence(hamPhrasesLengthList, spamPhrasesLengthList);
    const updatedHamPhraseFrequence = getListWithNoConvergence(hamPhraseFrequence, phraseLengthFrequence);
    const updatedSpamPhraseFrequence = getListWithNoConvergence(spamPhraseFrequence, phraseLengthFrequence);

    res.json({
        categories: phraseLengthFrequence,
        series: [
            {
                name: "ham",
                data: updatedHamPhraseFrequence
            },{
                name: "spam",
                data: updatedSpamPhraseFrequence
            }
        ]
    });
});
// -----------------------------------------------

// ----------------- task 2B ---------------------
app.get('/phrases/average', async (req, res) => {
    const jsonCSV = await getJSONfromCSV(csvFilePath);
    
    const hamAveragePhraseLength = getAveragePhraseLength(jsonCSV, { category: "ham" });
    const spamAveragePhraseLength = getAveragePhraseLength(jsonCSV, { category: "spam" });

    res.json({ hamAveragePhraseLength, spamAveragePhraseLength });
});
// -----------------------------------------------

// ----------------- task 3 ----------------------
app.get('/frequent', async (req, res) => {
    const jsonCSV = await getJSONfromCSV(csvFilePath);
    
    const mostFrequentWords = getMostFrequentWords(jsonCSV, 20);
    const mostFrequentWordsArr = getMostFrequentWordsArr(mostFrequentWords); 

    res.json({data: mostFrequentWordsArr});
});
// -----------------------------------------------
    
app.listen(port, () => console.log(`Server is runnin on port ${port}`));