import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { red } from '@material-ui/core/colors';
import _ from 'lodash';
import axios from 'axios';

import CardView from '../cardView/CardView';

const ROOT_URL = "https://lunch-picker-api.herokuapp.com/api";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2),
    flexGrow: 1,
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: red[500],
  },
}));

function RandomFood() {
  const classes = useStyles();
  const [randomFoodList, setRandomFoodList] = useState([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [open, setOpen] = useState(true);

  const [resultList, setResultList] = useState([]);

  useEffect(() => {
    getRandomFoodList();
    getUserCurrentLatLong();
  }, []);

  useEffect(() => {
    if (!_.isEmpty(randomFoodList)) {
      setTimeout(() => {
        setOpen(false)
      }, 1500);
    }
  }, [randomFoodList]);

  useEffect(() => {
    const selectedTerm = _.sample(randomFoodList);
    findRestaurantsByLatLong(selectedTerm, latitude, longitude);
  }, [randomFoodList, latitude, longitude]);

  const getRandomFoodList = () => {
    axios.get(
      `${ROOT_URL}/category/get-categories`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
      .then((response) => {
        if (!_.isEmpty(response)) {
          console.log("response = ", response);
          if (!_.isEmpty(response.data.categories.categories)) {
            let randomFoodList = [];
            response.data.categories.categories.forEach((item, i) => {
              if (!_.isEmpty(item.parent_aliases)) {
                const parentAliases = item.parent_aliases[0];
                if (_.isEqual(parentAliases, "food") || _.isEqual(parentAliases, "restaurants") || _.isEqual(parentAliases, "bars") || _.isEqual(parentAliases, "breakfast_brunch")) {
                  randomFoodList.push(item);
                }
              }
            });
            const formattedRandomFoodList = randomFoodList.map((item, i) => {
              return item.title;
            });
            setRandomFoodList(formattedRandomFoodList);
          }
        }
      })
      .catch((error) => {
        if (!_.isEmpty(error)) {
          console.log("error = ", error);
        }
      });
  }

  const getUserCurrentLatLong = () => {
    navigator.geolocation.getCurrentPosition((location) => {
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      setLatitude(latitude);
      setLongitude(longitude);
    });
  }

  const findRestaurantsByLatLong = (selectedTerm, latitude, longitude) => {
    axios.get(
      `${ROOT_URL}/restaurant/find-restaurants-by-lat-long`,
      {
        params: {
          term: selectedTerm,
          latitude: latitude,
          longitude: longitude
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
      .then((response) => {
        if (!_.isEmpty(response)) {
          console.log("response = ", response);
          setResultList(response.data.restaurants.businesses);
        }
      })
      .catch((error) => {
        if (!_.isEmpty(error)) {
          console.log("error = ", error);
        }
      });
  }

  const renderRandomFood = () => {
    let cardViewResultList = null;

    if (!_.isEmpty(resultList)) {
      cardViewResultList = resultList.map((item, i) => {
        return (
          <Grid key={i} item xs={12} sm={4}>
            <div className="d-flex justify-content-center">
              <CardView resultListItem={item} />
            </div>
          </Grid>
        );
      });
    }

    return cardViewResultList;
  }

  const renderDiv = () => {
    let renderDiv = null;

    if (!_.isEmpty(resultList)) {
      renderDiv = (
        <div className={classes.root} style={{ overflow: 'hidden' }}>
          <Grid container spacing={3}>
            {renderRandomFood()}
          </Grid>
        </div>
      );
    } else {
      renderDiv = (
        <Backdrop
          className={classes.backdrop}
          open={open}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      );
    }

    return renderDiv;
  }

  return (
    renderDiv()
  )
}

export default RandomFood;