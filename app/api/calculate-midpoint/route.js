import { NextResponse } from 'next/server';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function POST(request) {
  try {
    const { sessionId, location1, location2 } = await request.json();

    // Step 1: Get the route between the two users
    const routeResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${location1.lng},${location1.lat};${location2.lng},${location2.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
    );
    const routeData = await routeResponse.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      return NextResponse.json({ error: 'Could not find route' }, { status: 400 });
    }

    const route = routeData.routes[0];
    const coordinates = route.geometry.coordinates;
    const midpointCoord = coordinates[Math.floor(coordinates.length / 2)];
    
    const midpoint = {
      lng: midpointCoord[0],
      lat: midpointCoord[1]
    };

    // Step 2: Search for venues near the midpoint
    const venues = await searchVenues(midpoint, location1, location2);

    // Step 3: Update Firebase with midpoint and venues
    const updates = {};
    updates[`sessions/${sessionId}/midpoint`] = midpoint;
    updates[`sessions/${sessionId}/venues`] = venues;
    updates[`sessions/${sessionId}/lastCalculated`] = Date.now();

    await update(ref(database), updates);

    return NextResponse.json({ 
      success: true, 
      midpoint, 
      venues 
    });

  } catch (error) {
    console.error('Error calculating midpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to search for venues
async function searchVenues(midpoint, location1, location2) {
  const categories = [
    'cafe',
    'restaurant', 
    'bar',
    'gas_station'
  ];

  const allVenues = [];

  // Use Mapbox Search API
  for (const category of categories) {
    try {
      const searchResponse = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/category/${category}?` +
        `proximity=${midpoint.lng},${midpoint.lat}&` +
        `limit=5&` +
        `access_token=${MAPBOX_TOKEN}`
      );

      const searchData = await searchResponse.json();

      if (searchData.features) {
        for (const feature of searchData.features) {
          allVenues.push({
            id: feature.properties.mapbox_id,
            name: feature.properties.name,
            category: category,
            address: feature.properties.full_address || feature.properties.place_formatted || 'Address not available',
            location: {
              lng: feature.geometry.coordinates[0],
              lat: feature.geometry.coordinates[1]
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error searching ${category}:`, error);
    }
  }

  // Step 3: Calculate drive time from each user to each venue
  const venuesWithDriveTimes = await Promise.all(
  allVenues.map(async (venue) => {
    // Get drive time and distance from User 1 to venue
    const result1 = await getDriveTimeAndDistance(location1, venue.location);
    
    // Get drive time and distance from User 2 to venue
    const result2 = await getDriveTimeAndDistance(location2, venue.location);

    // Calculate distance from midpoint
    const distanceFromMidpoint = calculateDistance(
      midpoint.lat, 
      midpoint.lng, 
      venue.location.lat, 
      venue.location.lng
    );

    return {
      ...venue,
      driveTimeUser1: result1.time,
      driveTimeUser2: result2.time,
      distanceUser1: result1.distance,
      distanceUser2: result2.distance,
      totalDriveTime: result1.time + result2.time,
      timeDifference: Math.abs(result1.time - result2.time),
      distanceFromMidpoint: distanceFromMidpoint
    };
  })
);

  // Sort venues by fairness and total drive time
  const sortedVenues = venuesWithDriveTimes.sort((a, b) => {
    // Prioritize venues where drive times are most equal
    if (Math.abs(a.timeDifference - b.timeDifference) > 2) {
      return a.timeDifference - b.timeDifference;
    }
    // Then by total drive time
    return a.totalDriveTime - b.totalDriveTime;
  });

  // Return top 10
  return sortedVenues.slice(0, 10);
}

// Helper: Get drive time and distance between two points
async function getDriveTimeAndDistance(origin, destination) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        time: Math.round(route.duration / 60), // Convert to minutes
        distance: Math.round((route.distance * 0.000621371) * 10) / 10 // Convert meters to miles, round to 1 decimal
      };
    }
    return { time: 0, distance: 0 };
  } catch (error) {
    console.error('Error getting drive time:', error);
    return { time: 0, distance: 0 };
  }
}

// Helper: Calculate straight-line distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}