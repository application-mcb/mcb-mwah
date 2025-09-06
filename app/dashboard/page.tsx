"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ProfileForm } from "@/components/profile-form";
import { 
  User, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Gear, 
  Bell, 
  SignOut,
  House,
  Phone,
  MapPin,
  Shield,
  IdentificationCard,
  Pencil,
  ChartBar
} from "@phosphor-icons/react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { UserProfile } from "@/lib/user-sync";
import { getProfileAction } from "@/app/actions/profile";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user);
            
            // Get user profile from database through server action
            try {
              const profileResult = await getProfileAction({ uid: user.uid });
              const profile = profileResult.success ? profileResult.user : null;
              if (profile && profile.firstName && profile.lastName) {
                setUserProfile(profile);
              } else {
                console.log('No complete profile found, redirecting to setup');
                router.push('/setup');
                return;
              }
            } catch (error) {
              console.log('Error getting profile, redirecting to setup:', error);
              router.push('/setup');
              return;
            }
          } else {
            router.push('/');
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    // Refresh user profile data through server action
    if (user) {
      try {
        const profileResult = await getProfileAction({ uid: user.uid });
        const profile = profileResult.success ? profileResult.user : null;
        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
    setIsEditModalOpen(false);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided';
    return phone.startsWith('+63') ? phone : `+63${phone}`;
  };

  const getFullName = () => {
    if (!userProfile) return 'Student';
    const { firstName, middleName, lastName, nameExtension } = userProfile;
    let fullName = firstName || '';
    
    if (middleName) {
      // Add middle name initial (first letter only)
      fullName += ` ${middleName.charAt(0).toUpperCase()}.`;
    }
    
    if (lastName) {
      fullName += ` ${lastName}`;
    }
    
    if (nameExtension) {
      fullName += ` ${nameExtension}`;
    }
    
    return fullName || 'Student';
  };

  const getAddress = () => {
    if (!userProfile) return 'Not provided';
    const { streetName, province, municipality, barangay, zipCode } = userProfile;
    const parts = [streetName, municipality, province, zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Please sign in to access your dashboard.</p>
            <Button 
              onClick={() => router.push('/')}
              className="mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white/50 shadow-lg flex flex-col animate-in slide-in-from-left-4 duration-500">
        {/* Sidebar Header */}
        <div className="p-6 border-blue-100">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center mb-2">
              <img 
                src="/logo.png" 
                alt="Marian College Logo" 
                className="w-12 h-12 object-contain aspect-square"
              />
              <div className="flex flex-col ml-2">
              <h1 className="text-xl font-light text-gray-900 text-left">Student Portal</h1>
              <p className="text-xs text-gray-600 font-bold uppercase font-mono ">Marian College of Baliuag, Inc.</p>
            </div>
            </div>
            
          </div>
        </div>

        {/* Student Profile Section */}
        <div className="p-6 border-gray-200 bg-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center" >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full aspect-square border-2 border-black"
                />
              ) : (
                <User size={32} className="text-blue-900" weight="duotone" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {userProfile ? getFullName() : user.displayName || user.email?.split('@')[0] || 'Student'}
              </h3>
              <p className="text-xs text-gray-900 font-mono font-medium">{user.email}</p>
              <p className="text-xs text-gray-00 font-mono font-medium">ID: {user.studentId || 'Not Enrolled'}</p>
            </div>

            
          </div>
          <Button 
              variant="ghost"
              className="border-1 border-blue-900 rounded-none w-full text-white bg-blue-900"
              onClick={userProfile ? handleEditProfile : () => router.push('/setup')}
            >
              <Gear size={20} weight="fill" className="mr-1 transition-transform duration-200 hover:text-blue-900" />
              {userProfile ? 'Edit Profile' : 'Complete Profile'}
            </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">

            <h4 className="text-sm font-medium text-blue-900 tracking-wider mb-[-2]">Hey {userProfile?.firstName}!</h4>
            <h4 className="text-sm font-light text-blue-900 tracking-wider mb-4">What would you like to do?</h4>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
                <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <User className="text-white" weight="fill" />
            </div>
           
              Dashboard
            </Button>
            
            
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
                <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <BookOpen className="text-white" weight="fill" />
            </div>
            
              My Subjects
            </Button>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <Calendar className="text-white" weight="fill" />
            </div>
            
              Schedule
            </Button>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <ChartBar className="text-white" weight="fill" />
            </div>
            
              Performance
            </Button>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <IdentificationCard className="text-white" weight="fill" />
            </div>
            
              Academic Records
            </Button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200">
       
          <Button 
            variant="outline"
            className="rounded-none border-r-0 border-b-0 font-light border-t-0 w-full justify-start border-l-5 border-red-900 bg-red-50 text-red-900 hover:text-red-900 hover:border-red-900"
            onClick={handleSignOut}
          >
            <div className="flex justify-center items-center bg-red-800 aspect-square  w-6 h-6 " >
              <SignOut className="text-white" />
            </div>

            Sign Out  {user.email?.split('@')[0] || 'Student'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
              
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        title="Edit Profile"
        size="2xl"
      >
        <ProfileForm
          user={user}
          userProfile={userProfile}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          isModal={true}
        />
      </Modal>
    </div>
  );
}
