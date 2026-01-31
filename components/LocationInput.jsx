'use client';
import { useState } from 'react';

export default function LocationInput({ onLocationSet }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleManualAddress = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setLoading(true);
    
    try {
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
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Set Your Location</h2>
      
      {/* Current Location Button */}
      <button
        onClick={useCurrentLocation}
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-lg mb-4 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 inline-flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {loading ? 'Getting location...' : 'Use My Current Location'}
      </button>
      
      <div className="text-center text-slate-500 mb-4 font-medium">OR</div>
      
      {/* Manual Address Input */}
      <form onSubmit={handleManualAddress}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address"
          className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Finding address...' : 'Set Address'}
        </button>
      </form>
    </div>
  );
}