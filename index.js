import express from 'express';
import axios from 'axios';
import { config } from 'dotenv';
config();
import bodyParser from 'body-parser';

const app  = express();
const port = process.env.port || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function getLatLong(address) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: process.env.API_KEY
            }
        });

        // Check if the request was successful
        if (response.data.status === 'OK') {
            // Extract latitude and longitude
            const location = response.data.results[0].geometry.location;
            const latitude = location.lat;
            const longitude = location.lng;
            
            return { latitude, longitude };
        } else {
            throw new Error('Failed to fetch location information');
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

app.get('/' , (req,res) => {
    res.render('index', { data : null });
})

app.post('/hospitalsNearby', async (req, res) => {
    try {
        const address = req.body.address;
        const location = await getLatLong(address);
        
        if (location) {
          console.log("Latitude:", location.latitude);
          console.log("Longitude:", location.longitude);
  
          // Make request to Google Maps API
          const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            {
              params: {
                location: `${location.latitude},${location.longitude}`,
                radius: "5000",
                type: "hospital",
                key: process.env.API_KEY,
              },
            }
          );
  
          const result = response.data;
          const hospitals = result.results.map((result) => {
            return {
              name: result.name,
              vicinity: result.vicinity,
              rating: result.rating || "Not available",
            };
          });
  
          res.render("index", { data: hospitals });
        } else {
          console.log("Failed to fetch location information");
          res.status(500).send("Failed to fetch location information");
        }
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
      }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  