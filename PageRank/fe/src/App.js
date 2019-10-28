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
  fullHeight: {
    height: '100vh'
  },
  maxWidth: {
    maxWidth: "100%",
    marginBottom: "20px"
  },
  halfWidth: {
    width: "50%"
  },
  error: {
    fontSize: "20px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#ff0000"
  }
}));

const App = () => {
  const classes = useStyles();
  const [urlLink, setUrlLink] = useState("");
  const [graph, setGraph] = useState([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = event => {
    setGraph("");
    setUrlLink(event.target.value);
  };

  const submitForm = async (e) => {
    e.preventDefault();

    setError("");
    setGraph([]);
    setIsSearching(true);

    const graph = await handleSearch();
    
    const { data, error } = graph;

    if (error) {
      setError(error);
      setIsSearching(false);
      return;
    }
    
    setGraph(data);
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
      justify='center'
      alignItems='center'
      className={classes.fullHeight}  
    >
      <div className={classes.halfWidth}>
        <Grid item xs={6} className={classes.maxWidth}>
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
        {graph.length !== 0 && !isSearching && (
          <Grid item xs={12}>
            <Typography variant="h5" component="h5">
              <div>
                {graph.map(node => (
                  <div>
                    <div>
                      Page: {node.id}
                    </div>
                    <div>
                      Links: [{node.outLinkIndexes.join(", ")}]
                    </div>
                    <hr/>
                  </div>
                ))}
              </div>
            </Typography>
          </Grid>
        )}
        {error && (
          <div className={classes.error}>Error: {error}</div>
        )}
      </div>
    </Grid>
  );
}

export default App;
