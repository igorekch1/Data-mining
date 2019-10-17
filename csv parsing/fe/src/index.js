import 'babel-polyfill';
import axios from './api/axios';
import Highcharts from 'highcharts'; 

const wordFrequencyContainer = document.querySelector("#wordFrequency");
const phraseFrequencyContainer = document.querySelector("#phraseFrequency");
const mostFrequentWordsContainer = document.querySelector("#mostFrequentWords");

const getWordsStats = async () => {
  const wordsStats = await axios.get('/words');
  
  return wordsStats;
};

const getAverageWordLength = async () => {
  const averageWordLength = await axios.get('/words/average');
  return averageWordLength;
};

const getPhrasessStats = async () => {
  const phrasesStats = await axios.get('/phrases');

  return phrasesStats;
};

const getAveragePhraseLength = async () => {
  const averagePhraseLength = await axios.get('/phrases/average');

  return averagePhraseLength;
};

const getMostFrequentWords = async () => {
  const mostFrequentWords = await axios.get('/frequent');

  return mostFrequentWords;
};

(async () => {
  const wordStats = await getWordsStats();
  const averageWordLength = await getAverageWordLength();
  const phrasessStats = await getPhrasessStats();
  const averagePhraseLength = await getAveragePhraseLength();
  const mostFrequentWords = await getMostFrequentWords();

  const avgHamWordContainer = document.querySelector(".average-word-ham");
  const avgSpamWordContainer = document.querySelector(".average-word-spam");
  const avgHamPhraseContainer = document.querySelector(".average-phrase-ham");
  const avgSpamPhraseContainer = document.querySelector(".average-phrase-spam");

  avgHamWordContainer.append(averageWordLength.hamAverageWordLength);
  avgSpamWordContainer.append(averageWordLength.spamAverageWordLength);
  avgHamPhraseContainer.append(averagePhraseLength.hamAveragePhraseLength);
  avgSpamPhraseContainer.append(averagePhraseLength.spamAveragePhraseLength);

  Highcharts.chart(wordFrequencyContainer, {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Word Length Distribution'
    },
    xAxis: {
      categories: wordStats.categories
    },
    yAxis: {
      title: {
          text: 'Word frequency'
      }
    },
    plotOptions: {
      line: {
        dataLabels: {
            enabled: true
        },
        enableMouseTracking: false
      }
    },
    series: [{
        name: wordStats.series[0].name,
        data: wordStats.series[0].data
    }, {
        name: wordStats.series[1].name,
        data: wordStats.series[1].data
    }]
  });

  Highcharts.chart(phraseFrequencyContainer, {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Phrase Length Distribution'
    },
    xAxis: {
      categories: phrasessStats.categories
    },
    yAxis: {
      title: {
          text: 'Phrase frequency'
      }
    },
    plotOptions: {
      line: {
        dataLabels: {
            enabled: true
        },
        enableMouseTracking: false
      }
    },
    series: [{
      name: phrasessStats.series[0].name,
      data: phrasessStats.series[0].data
    }, {
        name: phrasessStats.series[1].name,
        data: phrasessStats.series[1].data
    }]
  });

  Highcharts.chart(mostFrequentWordsContainer, {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Most frequent words'
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      title: {
          text: 'Word frequency'
      }
    },
    plotOptions: {
      line: {
        dataLabels: {
            enabled: true
        },
        enableMouseTracking: false
      }
    },
    series: [{
      data: mostFrequentWords.data
    }]
  });
})();
