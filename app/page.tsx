'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import VoiceAgent from '@/components/VoiceAgent';
import Dashboard from '@/components/Dashboard';
import ConversationHistory from '@/components/ConversationHistory';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'agent' | 'dashboard' | 'history'>('agent');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            VLGS Insurance AI Voice Agent
          </h1>
          <p className="text-gray-600">
            Advanced AI-powered customer service for insurance inquiries
          </p>
        </header>

        <div className="mb-6 flex justify-center space-x-2">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'agent'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Voice Agent
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Call History
          </button>
        </div>

        {activeTab === 'agent' && <VoiceAgent />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <ConversationHistory />}
      </div>
    </main>
  );
}
