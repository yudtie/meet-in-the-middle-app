'use client';
import { useRouter } from 'next/navigation';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function HomePage() {
  const router = useRouter();

  const createSession = async () => {
    try {
      const sessionsRef = ref(database, 'sessions');
      const newSessionRef = push(sessionsRef);
      const sessionId = newSessionRef.key;
      
      await set(newSessionRef, {
        createdAt: Date.now(),
        expiresAt: Date.now() + (6 * 60 * 60 * 1000),
        users: {},
        midpoint: null,
        venues: []
      });
      
      router.push(`/session/${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50"></div>
      
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        
        <div className="mb-8 inline-block">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-5xl">🗺️</span>
          </div>
        </div>
        
        <h1 className="text-6xl font-semibold text-gray-900 mb-4 tracking-tight">
          Meet Halfway
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 font-normal">
          Find the perfect spot to meet your friend.<br />
          Fair for both. Simple and fast.
        </p>
        
        <button 
          onClick={createSession}
          className="group bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-3"
        >
          <span>Create Meeting</span>
          <svg 
            className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast</h3>
            <p className="text-sm text-gray-600">Get suggestions in seconds</p>
          </div>
          <div className="p-6">
            <div className="text-3xl mb-3">⚖️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Fair</h3>
            <p className="text-sm text-gray-600">Equal travel time for both</p>
          </div>
          <div className="p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Private</h3>
            <p className="text-sm text-gray-600">No account needed</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}