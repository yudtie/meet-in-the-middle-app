'use client';
import { useState } from 'react';

export default function LocationInput({ onLocationSet }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Method 1: Use browser geolocation
  const useCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address (using Mapbox)
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
          );
          const data = await response.json();
          const addressText = data.features[0]?.place_name || 'Current Location';
          
          onLocationSet({
            lat: latitude,
            lng: longitude,
            address: addressText
          });
        } catch (error) {
          console.error('Geocoding error:', error);
          onLocationSet({
            lat: latitude,
            lng: longitude,
            address: 'Current Location'
          });
        }
        
        setLoading(false);
      },
      (error) => {
        alert('Unable to get your location. Please enter your address manually.');
        console.error(error);
        setLoading(false);
      }
    );
  };

  // Method 2: Manual address entry
  const handleManualAddress = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setLoading(true);
    
    try {
      // Geocode address using Mapbox
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        onLocationSet({
          lat,
          lng,
          address: data.features[0].place_name
        });
      } else {
        alert('Address not found. Please try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to find address. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Set Your Location</h2>
      
      {/* Current Location Button */}
      <button
        onClick={useCurrentLocation}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Getting location...' : '📍 Use My Current Location'}
      </button>
      
      <div className="text-center text-gray-500 mb-4">OR</div>
      
      {/* Manual Address Input */}
      <form onSubmit={handleManualAddress}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Finding address...' : 'Set Address'}
        </button>
      </form>
    </div>
  );
}