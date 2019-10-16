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
    const wordsLengthList = phrasesText.map(word => {
        if (!word || word.length === 0) return;
        return word.length;
    });
    
    return wordsLengthList;
}

// get number of average length of words by category
const getAverageWordLength = (list, { category }) => {
    const categoryWordsLengthList = getWordsLengthList(list, { category });
    const generalWordsLength = categoryWordsLengthList.reduce((acc, curVal) => acc + curVal, 0);
    const averageWordLength = generalWordsLength / categoryWordsLengthList.length;
    
    return averageWordLength.toFixed(2);
}

// get array of length of phrases by category
getPhrasesLengthList = (list, { category }) => {
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

// get most frequent words by category
const getMostFrequentWords = (list, { category }, wordsQ) => {
    const categoryList = list.find((categoryList) => categoryList.category === category);
    const text = categoryList.phrasesList.join(" ");
    const cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");

    let words = cleanString.split(' '), frequencies = {}, word;
  
    for( let i = 0; i < words.length; i++ ) {
      word = words[i];
      frequencies[word] = frequencies[word] || 0;
      frequencies[word]++;
    }
    
    words = Object.keys( frequencies );
  
    return words.sort((a,b) => frequencies[b] -frequencies[a]).slice(0,wordsQ).toString();
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

// get an ordered array of word length by its frequence
const getOrderedWordLengthQunatity = (wordsLength) => {
    const wordFrequence = getWordFrequence(wordsLength);
    console.log(wordFrequence)
    return Object.entries(wordFrequence).map(([, value]) => value);
}

// get an ordered array of frequence
const getWordLengthFrequence = (hamWords, spamWords) => {
    const wordHamFrequence = _.keys(getWordFrequence(hamWords)).map(w => parseInt(w));
    const wordSpamFrequence = _.keys(getWordFrequence(spamWords)).map(w => parseInt(w));
    
    return [...new Set(wordHamFrequence.concat(wordSpamFrequence))].sort((a, b) => a - b);
}

// TODO: fill array with 0 if no similar values with frequence
const getListWithNoConvergence = (wordsLengthList, wordLengthFrequence) => {
    // console.log(wordsLengthList, wordLengthFrequence);
    const frequenceArr =  Object.entries(wordsLengthList).map(([key,]) => parseInt(key));
    console.log("----------------------")
    // console.log(wordLengthFrequence, frequenceArr)
    const arr = frequenceArr.map(item => {
        // console.log(item)
        wordLengthFrequence.map(len => {
            // console.log(item, len)
            if (len in frequenceArr) {
                return len;
            } else {
                return 0;
            }
        })
    })
    console.log(arr);
}


// app.get('/', async (req, res) => {
    
(async function() {
    const jsonCSV = await getJSONfromCSV(csvFilePath);
    
    const hamWordsLengthList = getWordsLengthList(jsonCSV, { category: "ham" });
    const spamWordsLengthList = getWordsLengthList(jsonCSV, { category: "spam" });
    const hamWordFrequence = getWordFrequence(hamWordsLengthList);
    const spamWordFrequence = getWordFrequence(spamWordsLengthList);
    const wordLengthFrequence = getWordLengthFrequence(hamWordsLengthList, spamWordsLengthList);
    // const orderedHamWordLengthQuantity = getOrderedWordLengthQunatity(hamWordsLengthList);
    // const orderedSpamWordLengthQuantity = getOrderedWordLengthQunatity(spamWordsLengthList);

    // const wordLengthData = {
    //     labels: wordLengthFrequence,
    //     datasets: [{
    //         label: 'ham',
    //         data: orderedHamWordLengthQuantity
    //     }, {
    //         label: 'spam',
    //         data: orderedSpamWordLengthQuantity
    //     }]
    // }

    const structuredHamLengthList = getListWithNoConvergence(hamWordFrequence, wordLengthFrequence);
    // const structuredSpamLengthList = getListWithNoConvergence(orderedSpamWordLengthQuantity, wordLengthFrequence);
    // console.log(orderedHamWordLengthQuantity)
    // console.log()
    // console.log("word length frequency - ", wordLengthFrequence)

    const hamAverageWordLength = getAverageWordLength(jsonCSV, { category: "ham" });
    const spamAverageWordLength = getAverageWordLength(jsonCSV, { category: "spam" });

    const hamPhrasesLengthList = getPhrasesLengthList(jsonCSV, { category: "ham" });
    const spamPhrasesLengthList = getPhrasesLengthList(jsonCSV, { category: "spam" });
    
    const hamAveragePhraseLength = getAveragePhraseLength(jsonCSV, { category: "ham" });
    const spamAveragePhraseLength = getAveragePhraseLength(jsonCSV, { category: "spam" });
    
    const hamMostFrequentWords = getMostFrequentWords(jsonCSV, { category: "ham" }, 20);
    const spamMostFrequentWords = getMostFrequentWords(jsonCSV, { category: "spam" }, 20);
    // console.log(hamMostFrequentWords)
    // console.log(spamMostFrequentWords)

   
    
    // res.end(JSON.stringify({
    //     hamMostFrequentWords,
    //     spamMostFrequentWords
    // }));
})();
    // });
    
// app.listen(port, () => console.log(`Server is runnin on port ${port}`));