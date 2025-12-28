'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function VoiceAgent() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    policyNumber: '',
    phone: ''
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          if (finalTranscript) {
            handleUserMessage(finalTranscript);
            setTranscript('');
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          if (isCallActive && !isMuted) {
            recognitionRef.current?.start();
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  const startCall = async () => {
    setIsCallActive(true);
    setMessages([]);
    setCallDuration(0);

    const greeting = "Hello! Thank you for calling VLGS Insurance. My name is Maya, your AI assistant. I can help you with policy information, claims status, premium payments, and scheduling appointments. How may I assist you today?";

    const greetingMessage: Message = {
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    };

    setMessages([greetingMessage]);
    speak(greeting);

    if (recognitionRef.current && !isMuted) {
      setIsListening(true);
      recognitionRef.current.start();
    }

    saveCallToHistory({
      timestamp: new Date().toISOString(),
      duration: 0,
      messages: [greetingMessage],
      outcome: 'in-progress'
    });
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (synthRef.current) {
      synthRef.current.cancel();
    }

    const finalMessage: Message = {
      role: 'assistant',
      content: 'Thank you for calling VLGS Insurance. Have a great day!',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, finalMessage];
    setMessages(updatedMessages);

    saveCallToHistory({
      timestamp: new Date().toISOString(),
      duration: callDuration,
      messages: updatedMessages,
      outcome: 'completed',
      customerInfo
    });
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (newMutedState && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else if (!newMutedState && recognitionRef.current && isCallActive) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);

    if (!newSpeakerState && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current || !isSpeakerOn) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice =>
      voice.name.includes('Female') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Victoria')
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    synthRef.current.speak(utterance);
  };

  const handleUserMessage = async (userText: string) => {
    const userMessage: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    const response = await processUserIntent(userText);

    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    speak(response);
  };

  const processUserIntent = async (userText: string): Promise<string> => {
    const lowerText = userText.toLowerCase();

    // Extract customer information
    const policyMatch = userText.match(/policy\s*(?:number)?\s*(?:is\s*)?([A-Z0-9-]+)/i);
    if (policyMatch) {
      setCustomerInfo(prev => ({ ...prev, policyNumber: policyMatch[1] }));
    }

    // Policy inquiry
    if (lowerText.includes('policy') && !lowerText.includes('claim')) {
      return "I can help you with your policy information. Could you please provide your policy number? It should be in the format P-L-G-S followed by numbers.";
    }

    // Claims status
    if (lowerText.includes('claim')) {
      if (customerInfo.policyNumber || policyMatch) {
        const policyNum = policyMatch ? policyMatch[1] : customerInfo.policyNumber;
        return `Let me check the claim status for policy ${policyNum}. According to our records, your claim submitted on November 15th is currently in review. Our claims adjuster will contact you within 2 business days. Is there anything specific about the claim you'd like to know?`;
      }
      return "I can check your claim status. First, I'll need your policy number. Could you please provide that?";
    }

    // Premium payment
    if (lowerText.includes('payment') || lowerText.includes('premium') || lowerText.includes('pay')) {
      if (customerInfo.policyNumber || policyMatch) {
        const policyNum = policyMatch ? policyMatch[1] : customerInfo.policyNumber;
        return `For policy ${policyNum}, your next premium payment of $287.50 is due on January 15th, 2026. You can pay online through our portal, by phone, or set up automatic payments. Would you like me to help you with any of these options?`;
      }
      return "I can assist you with premium payments. May I have your policy number to pull up your account?";
    }

    // Appointment scheduling
    if (lowerText.includes('appointment') || lowerText.includes('schedule') || lowerText.includes('meeting')) {
      return "I'd be happy to schedule an appointment for you. We have availability this week on Wednesday at 2 PM or Friday at 10 AM. Which time works better for you? Or would you prefer a different day?";
    }

    // Coverage questions
    if (lowerText.includes('coverage') || lowerText.includes('covered') || lowerText.includes('cover')) {
      return "I can provide information about your coverage. Your current policy includes liability, collision, and comprehensive coverage with a $500 deductible. What specific aspect of your coverage would you like to know more about?";
    }

    // Transfer to human agent
    if (lowerText.includes('human') || lowerText.includes('agent') || lowerText.includes('representative')) {
      return "I understand you'd like to speak with a human agent. Let me transfer you to our customer service team. Please hold for a moment. Your estimated wait time is approximately 3 minutes.";
    }

    // General response
    if (lowerText.includes('thank') || lowerText.includes('thanks')) {
      return "You're very welcome! Is there anything else I can help you with today?";
    }

    // Default response with suggestions
    return "I'm here to help you with policy information, claims status, premium payments, or scheduling appointments. What would you like assistance with today?";
  };

  const saveCallToHistory = (callData: any) => {
    const history = JSON.parse(localStorage.getItem('vlgs-call-history') || '[]');
    const existingIndex = history.findIndex((call: any) =>
      call.timestamp === callData.timestamp
    );

    if (existingIndex >= 0) {
      history[existingIndex] = callData;
    } else {
      history.unshift(callData);
    }

    localStorage.setItem('vlgs-call-history', JSON.stringify(history.slice(0, 50)));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isCallActive
                ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                : 'bg-blue-600'
            }`}>
              <Phone className="w-16 h-16 text-white" />
            </div>
            {isCallActive && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                LIVE
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCallActive ? 'Call in Progress' : 'Ready to Assist'}
            </h2>
            {isCallActive && (
              <p className="text-lg text-gray-600 mt-2">
                Duration: {formatDuration(callDuration)}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            {!isCallActive ? (
              <button
                onClick={startCall}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                <Phone className="w-6 h-6" />
                <span>Start Call</span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all ${
                    isMuted
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`p-4 rounded-full transition-all ${
                    !isSpeakerOn
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>

                <button
                  onClick={endCall}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                  <span>End Call</span>
                </button>
              </>
            )}
          </div>

          {isCallActive && (
            <div className="w-full mt-8">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {isListening ? 'Listening...' : 'Not listening'}
                  </span>
                </div>
                {transcript && (
                  <p className="text-gray-600 italic">{transcript}</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h3>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.role === 'user' ? 'You' : 'Maya (AI Agent)'}
                        </p>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Features</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
          <li>✓ Policy information retrieval</li>
          <li>✓ Claims status updates</li>
          <li>✓ Premium payment assistance</li>
          <li>✓ Appointment scheduling</li>
          <li>✓ Coverage inquiries</li>
          <li>✓ Transfer to human agents</li>
          <li>✓ Natural language understanding</li>
          <li>✓ Real-time voice interaction</li>
        </ul>
      </div>
    </div>
  );
}
