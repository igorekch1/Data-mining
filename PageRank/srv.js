const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const _ = require('lodash');

const port = 3001;

app.use(cors());
app.use(bodyParser.json());


app.post('/page-rank', async (req, res) => {
    const { url } = req.body; 
    
    res.status(200);
    res.json({test: "test"});
});
    
app.listen(port, () => console.log(`Server is runnin on port ${port}`));