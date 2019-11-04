import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {Grid, TextField, Button, CircularProgress, Typography} from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    width: '100%',
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  button: {
    marginLeft: "20px",
    marginTop: '15px',
    height: '70%',
    width: '100%',
    margin: theme.spacing(1),
  },
  paper: {
    width: '100%',
    color: theme.palette.text.secondary,
    marginTop: '-200px'
  },
  wrapper: {
    position: 'relative'
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    margin: '-17px 0 0 0',
    color: "#eb347a"
  },
  halfWidth: {
    width: "50%"
  },
  error: {
    width: "100%",
    fontSize: "20px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#ff0000"
  }
}));

const App = () => {
  const classes = useStyles();
  const [urlLink, setUrlLink] = useState("");
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = event => {
    setGraph("");
    setUrlLink(event.target.value);
  };

  const submitForm = async (e) => {
    e.preventDefault();

    setError("");
    setGraph(null);
    setIsSearching(true);

    const graph = await handleSearch();
    
    const { data, pageRanks, error } = graph;
    
    if (error) {
      setError(error);
      setIsSearching(false);
      return;
    }
    
    setGraph({data, pageRanks});
    setIsSearching(false);
  }

  const handleSearch = async () => {
    const response = await fetch('http://localhost:3001/page-rank', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: urlLink })
    });

    const result = await response.json();

    return result;
  }
  
  return (
    <Grid 
      container
    >
      <Grid item xs={12}
        container
        justify='center'
        alignItems='center'
        spacing={3}
        style={{marginBottom: "20px"}}
      >
        <Grid item xs={6}>
            <form 
              className={classes.container} 
              noValidate 
              autoComplete="off"
              onSubmit={(e) => submitForm(e)}  
              >
                <Grid item xs={9}>
                  <TextField
                    label="URL link"
                    placeholder="Enter the link..."
                    className={classes.textField}
                    value={urlLink}
                    onChange={(e) => handleChange(e)}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={3} className={classes.wrapper}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSearching || !urlLink}
                    size='medium'
                    className={classes.button}
                  >
                    Search  
                  </Button>
                  {isSearching && <CircularProgress disableShrink className={classes.spinner} />}
                </Grid>
            </form>
          </Grid>
      </Grid>
      {graph && !isSearching && (
        <>
          <Grid item xs={5}>
            <Typography variant="h4" component="h4" style={{textAlign: 'center', marginBottom: "10px"}}>
              Page and links Graph 
            </Typography>
            <Typography variant="h5" component="h5">
              <div>
                {graph.data.map(node => (
                  <div>
                    <div style={{textAlign: 'center'}}>
                      Page: {node.id} ({node.page})
                    </div>
                    <div style={{textAlign: 'center'}}>
                      Links: [{node.outLinkIndexes.join(", ")}]
                    </div>
                    <hr/>
                  </div>
                ))}
              </div>
            </Typography>
          </Grid>
          <Grid item xs={2}></Grid>
          <Grid item xs={5}>
            <Typography variant="h4" component="h4" style={{textAlign: 'center', marginBottom: "10px"}}>
                Top 10 PageRanks 
              </Typography>
            <Typography variant="h5" component="h5">
              <div>
                {graph.pageRanks.map((node, i) => (
                  <div>
                    <div style={{textAlign: 'center'}}>
                      {i + 1}) Page: {node.id} ({node.page})
                    </div>
                    <div style={{textAlign: 'center'}}>
                      PageRank: {node.pageRank}
                    </div>
                    <hr/>
                  </div>
                ))}
              </div>
            </Typography>
          </Grid>
        </>
      )}
      {error && (
        <div className={classes.error}>Error: {error}</div>
      )}
    </Grid>
  );
}

export default App;
