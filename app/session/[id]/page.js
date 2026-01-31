'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import LocationInput from '@/components/LocationInput';
import MapView from '@/components/MapView';
import VenueList from '@/components/VenueList';
import NameModal from '@/components/NameModal';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id;
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);

  useEffect(() => {
    // Generate unique user ID (stored in localStorage)
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', uid);
    }
    setUserId(uid);

    // Listen to session updates in real-time
    const sessionRef = ref(database, `sessions/${sessionId}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        // Session doesn't exist or expired
        setLoading(false);
        return;
      }
      
      // Check if session expired
      if (data.expiresAt < Date.now()) {
        alert('This session has expired');
        setLoading(false);
        return;
      }
      
      setSession(data);
      setLoading(false);
      
      // Check if this user has already joined
      if (data.users && data.users[uid]) {
        setHasJoined(true);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const joinSession = async (location) => {
    // Store location and show name modal
    setPendingLocation(location);
    setShowNameModal(true);
  };

  const handleNameSubmit = async (userName) => {
    const updates = {};
    
    updates[`sessions/${sessionId}/users/${userId}`] = {
      name: userName,
      location: pendingLocation,
      lastUpdated: Date.now()
    };
    
    await update(ref(database), updates);
    setHasJoined(true);
    setShowNameModal(false);
    setPendingLocation(null);
  };

  const handleNameCancel = () => {
    setShowNameModal(false);
    setPendingLocation(null);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied! Share it with your friend.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h1>
          <p className="text-gray-600 mb-4">This session may have expired or doesn't exist.</p>
          <a href="/" className="text-blue-500 hover:underline">Go Home</a>
        </div>
      </div>
    );
  }

  const userCount = Object.keys(session.users || {}).length;
  const canStart = userCount === 2;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Meet Halfway</h1>
              <p className="text-gray-600">
                {userCount}/2 users connected
              </p>
            </div>
            
            {/* Share Link Button */}
            <button 
              onClick={copyShareLink}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📋 Copy Share Link
            </button>
          </div>
        </div>

        {/* Location Input - shows if user hasn't joined yet */}
        {!hasJoined && (
          <LocationInput onLocationSet={joinSession} />
        )}

        {/* Main App - shows when user has joined */}
        {hasJoined && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            
            {/* Map */}
            <div className="bg-white rounded-lg shadow p-2 sm:p-4 order-1">
              <MapView 
                session={session} 
                currentUserId={userId}
                sessionId={sessionId}
              />
            </div>

            {/* Venues */}
            <div className="bg-white rounded-lg shadow p-2 sm:p-4 order-2">
              {canStart ? (
                <VenueList session={session} sessionId={sessionId} />
              ) : (
                <div className="text-center text-gray-500 py-8 sm:py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-base sm:text-lg font-semibold mb-2">Waiting for other user...</p>
                  <p className="text-xs sm:text-sm">Share the link above to invite them!</p>
                </div>
              )}
            </div>
            
          </div>
        )}

      </div>

      {/* Name Modal */}
      <NameModal 
        isOpen={showNameModal}
        onSubmit={handleNameSubmit}
        onCancel={handleNameCancel}
      />
    </div>
  );
}