'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CourseManagement from '@/components/course-management';
import GradeSectionManagement from '@/components/grade-section-management';
import SubjectManagement from '@/components/subject-management';
import EnrollmentManagement from '@/components/enrollment-management';
import StudentManagement from '@/components/student-management';
import TeacherManagement from '@/components/teacher-management';
import RegistrarOverview from '@/components/registrar-overview';
import {
  User,
  Users,
  ChartBar,
  Gear,
  SignOut,
  House,
  IdentificationCard,
  GraduationCap,
  Calendar,
  Bell,
  MemberOfIcon,
  Shield,
  BookOpen,
  UserList,
  Robot,
  Brain,
  Cpu,
  Lightbulb,
  ChatCircleDots,
  Sparkle
} from "@phosphor-icons/react";

interface RegistrarData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

type ViewType = 'overview' | 'student-enrollments' | 'student-management' | 'course-management' | 'grade-section-management' | 'subject-management' | 'teacher-management';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  displayContent?: string;
}

export default function RegistrarPage() {
  const [registrar, setRegistrar] = useState<RegistrarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to load
    }

    if (!user) {
      router.push('/');
      return;
    }

    const checkRegistrarAccess = async () => {
      try {
        // Check registrar role using UID and email
        const response = await fetch('/api/registrar/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setRegistrar(data.registrar);
        } else {
          setError(data.error || 'Access denied');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error: any) {
        setError('Failed to verify access: ' + error.message);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkRegistrarAccess();
  }, [user, authLoading, router]);

  // Auto-scroll to bottom when new messages are added or during typewriter effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping, typingMessageId]);

  // Trigger typewriter effect for welcome message on component mount
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: 'Hello! I\'m your AI assistant. I can help you with registrar tasks, provide insights, and answer questions about student data.',
      isUser: false,
      timestamp: new Date(),
      displayContent: '',
      isTyping: true,
    };

    setChatMessages([welcomeMessage]);
    setTypingMessageId(welcomeMessage.id);
    typeWriterEffect(welcomeMessage.id, welcomeMessage.content, 45); // Faster typing for welcome message
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view);
  };

  const sendMessageToAI = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      // Get context based on current view
      const context = `Current view: ${currentView}. User role: Registrar. User: ${registrar?.firstName} ${registrar?.lastName}`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if there are tool results
        if (data.toolResults && data.toolResults.length > 0) {
          // Add AI response with tool results context
          const toolContext = ``;
          const fullResponse = data.response + toolContext;

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: fullResponse,
            isUser: false,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, aiMessage]);
          setTypingMessageId(aiMessage.id);

          // Start typewriter effect
          typeWriterEffect(aiMessage.id, fullResponse);
        } else {
          // Regular AI response without tools
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            isUser: false,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, aiMessage]);
          setTypingMessageId(aiMessage.id);

          // Start typewriter effect
          typeWriterEffect(aiMessage.id, data.response);
        }
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
        setTypingMessageId(errorMessage.id);

        // Start typewriter effect for error message
        typeWriterEffect(errorMessage.id, 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send message to AI:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setTypingMessageId(errorMessage.id);

      // Start typewriter effect for connection error message
      typeWriterEffect(errorMessage.id, 'Sorry, I\'m having trouble connecting. Please try again.');
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendMessage = () => {
    sendMessageToAI(chatInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessageToAI(prompt);
  };

  const typeWriterEffect = (messageId: string, fullContent: string, delay: number = 1) => {
    let currentIndex = 0;

    // Update the message to show it's being typed
    setChatMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isTyping: true, displayContent: '' }
        : msg
    ));

    const typeNextCharacter = () => {
      if (currentIndex < fullContent.length) {
        const nextChar = fullContent.charAt(currentIndex);

        setChatMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, displayContent: (msg.displayContent || '') + nextChar }
            : msg
        ));

        currentIndex++;
        setTimeout(typeNextCharacter, delay);
      } else {
        // Typing complete
        setChatMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, isTyping: false, displayContent: undefined }
            : msg
        ));
        setTypingMessageId(null);
      }
    };

    // Start typing after a brief pause
    setTimeout(typeNextCharacter, 300);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-900 animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-900 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-blue-900 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-light text-red-600 mb-4" style={{ fontFamily: 'Poppins' }}>
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            {error}
          </p>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Make sure you're logged in with the correct registrar account.
            </p>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Check the console for detailed error information.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/auth-debug'}
              variant="outline"
              className="w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Debug Authentication
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getFullName = () => {
    if (!registrar) return 'Registrar';
    const { firstName, lastName } = registrar;
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Registrar';
  };

  const getInitials = () => {
    if (!registrar) return 'R';
    const { firstName, lastName } = registrar;
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`.slice(0, 2) || 'R';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex min-w-[1200px]">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white/50 shadow-lg flex flex-col animate-in slide-in-from-left-4 duration-500 h-screen fixed left-0 top-0 z-10 flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-blue-100">
          <div className="flex items-center mb-2">
            <img 
              src="/logo.png" 
              alt="Marian College Logo" 
              className="w-12 h-12 object-contain aspect-square"
            />
            <div className="flex flex-col ml-2">
              <h1 className="text-xl font-light text-gray-900 text-left">Registrar System</h1>
              <p className="text-xs text-gray-600 font-bold uppercase font-mono text-left">Marian College of Baliuag, Inc.</p>
            </div>
          </div>
        </div>

        {/* Registrar Profile Section */}
        <div className="p-6 border-gray-200 bg-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full aspect-square border-2 border-black"
                />
              ) : (
                <Shield size={32} className="text-white" weight="duotone" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {getFullName()}
              </h3>
              <p className="text-xs text-gray-900 font-mono font-medium">{registrar?.email}</p>
              <p className="text-xs text-gray-600 font-mono font-medium">Registrar</p>
            </div>
          </div>
          <Button 
            variant="ghost"
            className="border-1 shadow-sm border-blue-900 rounded-none w-full text-white bg-blue-900"
            onClick={() => {/* Add profile edit functionality */}}
          >
            <Gear size={20} weight="fill" className="mr-1 transition-transform duration-200 hover:text-blue-900" />
            Settings
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900 tracking-wider mb-[-2]">Hey {registrar?.firstName}!</h4>
            <h4 className="text-sm font-light text-blue-900 tracking-wider mb-4">What would you like to do?</h4>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'overview' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('overview')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <House className="text-white" weight="fill" />
              </div>
              Overview
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'student-enrollments' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('student-enrollments')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <Users className="text-white" weight="fill" />
              </div>
              Student Enrollments
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'student-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('student-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <GraduationCap className="text-white" weight="fill" />
              </div>
              Student Management
            </Button>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'teacher-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('teacher-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <GraduationCap className="text-white" weight="fill" />
              </div>
              Teacher Management
            </Button>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <ChartBar className="text-white" weight="fill" />
              </div>
              Reports & Analytics
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'subject-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('subject-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <BookOpen className="text-white" weight="fill" />
              </div>
              Subject Management
            </Button>


            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-10 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.01] transform hover:border-blue-900 border-l-5 ${
                currentView === 'course-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('course-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-5 h-5">
              <BookOpen className="text-white" weight="fill" />
              </div>
              Course Management
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'grade-section-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''  
              }`}
              onClick={() => handleNavigation('grade-section-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <MemberOfIcon className="text-white" weight="fill" />
              </div>
              Grades & Sections
            </Button>

            

           

        
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button 
            className="rounded-none border-r-0 border-b-0 font-light border-t-0 w-full justify-start border-1 shadow-sm border-red-900 bg-red-800 text-white hover:bg-red-900"
            onClick={handleSignOut}
          >
            <div className="flex justify-center items-center bg-white aspect-square w-6 h-6">
              <SignOut className="text-red-900" weight="fill" />
            </div>
            Sign Out {registrar?.firstName || 'Registrar'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 ml-80 mr-96">
        {currentView === 'overview' && (
          <RegistrarOverview registrarUid={registrar?.uid || ''} />
        )}

        {currentView === 'student-enrollments' && registrar && (
          <EnrollmentManagement
            registrarUid={registrar.uid}
            registrarName={`${registrar.firstName} ${registrar.lastName}`}
          />
        )}

        {currentView === 'student-management' && registrar && (
          <StudentManagement
            registrarUid={registrar.uid}
            registrarName={`${registrar.firstName} ${registrar.lastName}`}
          />
        )}

        {currentView === 'course-management' && registrar && (
          <CourseManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'grade-section-management' && registrar && (
          <GradeSectionManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'subject-management' && registrar && (
          <SubjectManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'teacher-management' && registrar && (
          <TeacherManagement registrarUid={registrar.uid} />
        )}

      </div>

      {/* Right Sidebar - AI Chatbot */}
      <aside className="w-96 bg-white/50 shadow-lg flex flex-col animate-in slide-in-from-right-4 duration-500 h-screen fixed right-0 top-0 z-10 flex-shrink-0">
        {/* AI Header */}
        <div className="p-4 bg-blue-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white flex items-center justify-center">
              <Robot size={20} className="text-blue-900" weight="fill" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-light" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  AI Assistant
                </h2>
                <Brain size={14} className="text-blue-200" weight="duotone" />
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Sparkle size={12} className="text-blue-200" weight="fill" />
                <p className="text-xs opacity-90" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Powered by Gemini AI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col p-6 min-h-0">
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
            {chatMessages
              .filter(message => !message.isTyping) // Don't show messages that are currently being typed
              .map((message) => (
                <div key={message.id} className={`flex items-start space-x-3 ${message.isUser ? 'justify-end' : ''}`}>
                  {!message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 border-black border-2 relative">
                      <Brain size={16} className="text-white" weight="fill" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-700 border border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-emerald-800 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  <div className={`flex-1 ${message.isUser ? 'bg-blue-900 text-white' : 'bg-gray-100'} rounded-lg p-3 shadow-lg max-w-[85%] min-w-0 break-words`}>
                    <p className={`text-xs leading-relaxed font-mono ${message.isUser ? 'text-white' : 'text-gray-800'}`}>
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 font-mono ${message.isUser ? 'text-blue-200' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 border-black border-2">
                      <span className="text-white text-xs font-medium" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </div>
              ))}

            {/* Typing Indicator - only show during API call, not during typewriter effect */}
            {isAiTyping && !typingMessageId && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 border-black border-2 relative">
                  <Brain size={16} className="text-white" weight="fill" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-700 border border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-emerald-800 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg p-3 shadow-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator for typewriter effect */}
            {typingMessageId && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 border-black border-2 relative">
                  <Brain size={16} className="text-white" weight="fill" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-700 border border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-emerald-800 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg p-3 shadow-lg min-h-[3rem]">
                  <p className="text-xs text-gray-800 leading-relaxed font-mono">
                    {(() => {
                      const typingMessage = chatMessages.find(msg => msg.id === typingMessageId);
                      return typingMessage?.displayContent || '';
                    })()}
                    <span className="animate-pulse">|</span>
                  </p>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex flex-wrap gap-1">
              <Button
                className="bg-blue-900 text-white text-xs font-light hover:bg-blue-800"
                onClick={() => handleQuickPrompt('How many students are enrolled this year?')}
                disabled={isAiTyping}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Enrollment stats
              </Button>
              <Button
                className="bg-blue-900 text-white text-xs font-light hover:bg-blue-800"
                onClick={() => handleQuickPrompt('Show me all enrolled students with their details')}
                disabled={isAiTyping}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Student reports
              </Button>
              <Button
                className="bg-blue-900 text-white text-xs font-light hover:bg-blue-800"
                onClick={() => handleQuickPrompt('Is there a student named Nasche enrolled?')}
                disabled={isAiTyping}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Find student
              </Button>
              <Button
                className="bg-blue-900 text-white text-xs font-light hover:bg-blue-800"
                onClick={() => handleQuickPrompt('What subjects are available for each grade level?')}
                disabled={isAiTyping}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Course availability
              </Button>
              <Button
                className="bg-blue-900 text-white text-xs font-light hover:bg-blue-800"
                onClick={() => handleQuickPrompt('Show me all teachers and their assignments')}
                disabled={isAiTyping}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Teacher info
              </Button>
            </div>
          </div>

          {/* Chat Input Area */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-2">
              <input
                ref={chatInputRef}
                type="text"
                placeholder="Ask me anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAiTyping}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:border-blue-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isAiTyping}
                className="bg-blue-900 hover:bg-blue-800 text-white rounded-none px-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
