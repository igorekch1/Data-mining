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
    margin: '-17px 0 0 -20px',
    color: "#eb347a"
  },
  fullHeight: {
    height: '100vh'
  }
}));

const App = () => {
  const classes = useStyles();
  const [phrase, setPhrase] = React.useState("");
  const [foundPhrase, setFoundPhrase] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = event => {
    setPhrase(event.target.value);
  };

  const submitForm = async (e) => {
    e.preventDefault();

    setIsSearching(true);

    const foundSearch = await handleSearch();
    
    setFoundPhrase(foundSearch);
    setIsSearching(false);
  }

  const handleSearch = async () => {
    const response = await fetch('http://localhost:3001/search-phrase', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({search: phrase})
    });

    const foundPhrase = await response.json();

    return foundPhrase;
  }

  return (
    <Grid 
      container
      justify='center'
      alignItems='center'
      className={classes.fullHeight}  
    >
      <div style={{width: "100%"}}>
        <Grid item xs={6} style={{margin: "0 auto"}}>
          <form 
            className={classes.container} 
            noValidate 
            autoComplete="off"
            onSubmit={(e) => submitForm(e)}  
            >
              <Grid item xs={9}>
                <TextField
                  label="Name"
                  className={classes.textField}
                  value={phrase}
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
                  disabled={isSearching}
                  size='medium'
                  className={classes.button}
                >
                  Search  
                </Button>
                {isSearching && <CircularProgress disableShrink className={classes.spinner} />}
              </Grid>
          </form>
        </Grid>
        {foundPhrase && (
          <Grid item xs={12} style={{textAlign: "center"}}>
            <Typography variant="h3" component="h3">
              Phrase: {foundPhrase}
            </Typography>
          </Grid>
        )}
      </div>
    </Grid>
  );
}

export default App;
