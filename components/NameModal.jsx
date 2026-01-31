'use client';
import { useState } from 'react';

export default function NameModal({ isOpen, onSubmit, onCancel }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">What's your name?</h2>
        <p className="text-slate-400 mb-6">
          Let your friend know who they're meeting!
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
            autoFocus
            maxLength={30}
          />
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 font-medium"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}