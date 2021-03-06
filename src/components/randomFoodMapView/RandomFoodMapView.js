import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import _ from 'lodash';
import axios from 'axios';

import CustomMapList from '../customMap/CustomMapList';
import Snackbar from '../snackBar/SnackBar';
import { getRootUrl, log } from '../../common/Common';

const ROOT_URL = getRootUrl();

function RandomFoodMapView() {
  const [selectedTerm, setSelectedTerm] = useState('');

  const [randomFoodList, setRandomFoodList] = useState([]);
  const [nameList, setNameList] = useState([]);
  const [locationStrList, setLocationStrList] = useState([]);
  const [coordinatesList, setCoordinatesList] = useState([]);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [openSuccessAlert, setOpenSuccessAlert] = useState(false);
  const [message, setMessage] = useState('');

  const [refreshButtonClicked, setRefreshButtonClicked] = useState(false);

  useEffect(() => {
    getRandomFoodList();
    getUserCurrentLatLong();
  }, []);

  useEffect(() => {
    const selectedTerm = _.sample(randomFoodList);
    setSelectedTerm(selectedTerm);
    if (!_.isEmpty(selectedTerm) && latitude !== 0 && longitude !== 0)
      findRestaurantsByLatLong(selectedTerm, latitude, longitude);
  }, [randomFoodList, latitude, longitude]);

  useEffect(() => {
    if (openSuccessAlert === true) {
      setOpenSuccessAlert(false);
    }
    if (!_.isEmpty(message)) {
      setMessage('');
    }
  }, [openSuccessAlert, message]);

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
          log("response = ", response);
          if (!_.isEmpty(response.data.categories)) {
            let randomFoodList = [];
            response.data.categories.forEach((item, i) => {
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
          log("error = ", error);
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
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
      .then((response) => {
        if (!_.isEmpty(response)) {
          log("response = ", response);

          const nameList = response.data.restaurants.businesses.map((item, i) => {
            const obj = {};
            obj.name = item.name;
            return obj;
          });
          setNameList(nameList);

          const locationStrList = response.data.restaurants.businesses.map((item, i) => {
            const obj = {};
            obj.locationStr = item.location.display_address.join(', ');
            return obj;
          });
          setLocationStrList(locationStrList);

          const coordinatesList = response.data.restaurants.businesses.map((item, i) => {
            return item.coordinates;
          });
          setCoordinatesList(coordinatesList);

          setRefreshButtonClicked(false);
        }
      })
      .catch((error) => {
        if (!_.isEmpty(error)) {
          log("error = ", error);
          setRefreshButtonClicked(false);
        }
      });
  }

  const handleRefresh = () => {
    setNameList([]);
    setLocationStrList([]);
    setCoordinatesList([]);
    setRefreshButtonClicked(true);

    const selectedTerm = _.sample(randomFoodList);
    setSelectedTerm(selectedTerm);
    if (!_.isEmpty(selectedTerm) && latitude !== 0 && longitude !== 0) {
      findRestaurantsByLatLong(selectedTerm, latitude, longitude);
      setOpenSuccessAlert(true);
      setMessage('Refresh success!');
    }
  }

  let renderRefreshButton = () => {
    let refreshButton = null;

    if (refreshButtonClicked === true) {
      refreshButton = (
        <div className="mt-3 d-flex justify-content-end" style={{ marginRight: '2.5em' }}>
          <Button variant="contained" color="primary" disabled={true} onClick={handleRefresh}>
            Loading...
          </Button>
        </div>
      );
    } else {
      refreshButton = (
        <div className="mt-3 d-flex justify-content-end" style={{ marginRight: '2.5em' }}>
          <Button variant="contained" color="primary" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      );
    }

    return refreshButton;
  }

  return (
    <div>
      <div className="mt-4 d-flex justify-content-end" style={{ marginRight: '2.5em' }}>
        <Typography component={'span'}>
          {
            !_.isEmpty(selectedTerm) ?
              <div>
                <b>Current food category:</b> {selectedTerm}
              </div>
              :
              null
          }
        </Typography>
      </div>
      {renderRefreshButton()}
      <div className="mt-3" style={{ margin: '2.5em' }}>
        <CustomMapList
          latitude={latitude}
          longitude={longitude}
          nameList={nameList}
          locationStrList={locationStrList}
          coordinatesList={coordinatesList}
        />
      </div>
      <Snackbar openSuccessAlert={openSuccessAlert} message={message} />
    </div>
  )
}

export default RandomFoodMapView;
