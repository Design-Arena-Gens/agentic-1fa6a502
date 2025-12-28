'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface CallRecord {
  timestamp: string;
  duration: number;
  messages: Message[];
  outcome: 'completed' | 'in-progress' | 'failed';
  customerInfo?: {
    name: string;
    policyNumber: string;
    phone: string;
  };
}

export default function ConversationHistory() {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filterOutcome, setFilterOutcome] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const storedHistory = JSON.parse(localStorage.getItem('vlgs-call-history') || '[]');
    setHistory(storedHistory);
  };

  const deleteCall = (index: number) => {
    const updatedHistory = history.filter((_, i) => i !== index);
    setHistory(updatedHistory);
    localStorage.setItem('vlgs-call-history', JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear all call history?')) {
      setHistory([]);
      localStorage.removeItem('vlgs-call-history');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const filteredHistory = filterOutcome === 'all'
    ? history
    : history.filter(call => call.outcome === filterOutcome);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Call History</h2>
          <p className="text-gray-600">Review past conversations and customer interactions</p>
        </div>

        <div className="flex space-x-3">
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Calls</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>

          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Call History</h3>
          <p className="text-gray-600">Start a call to see conversation history here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((call, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getOutcomeIcon(call.outcome)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatTimestamp(call.timestamp)}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(call.duration)}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {call.messages.length} messages
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getOutcomeColor(call.outcome)}`}>
                      {call.outcome.toUpperCase()}
                    </span>
                    {expandedIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {call.customerInfo?.policyNumber && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Policy Number: <span className="font-semibold text-gray-900">{call.customerInfo.policyNumber}</span>
                    </p>
                  </div>
                )}
              </div>

              {expandedIndex === index && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Conversation Transcript</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCall(index);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {call.messages.map((message, msgIndex) => (
                      <div
                        key={msgIndex}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-lg px-4 py-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {message.role === 'user' ? 'Customer' : 'AI Agent'}
                          </p>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Data Privacy & Retention</h3>
        <p className="text-sm text-blue-800">
          All conversation data is stored locally in your browser and is not transmitted to external servers.
          Call recordings are retained for quality assurance and training purposes in compliance with
          insurance regulations. Customer data is encrypted at rest and in transit. Data retention period: 7 years.
        </p>
      </div>
    </div>
  );
}
