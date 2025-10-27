"use client";

import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Envelope, Phone, MapPin, Calendar, IdentificationCard, Shield, House, Check } from "@phosphor-icons/react";
import { UserProfile } from "@/lib/user-sync";
import { getProvinces, getMunicipalitiesByProvince, getBarangaysByMunicipality, getZipCodeByBarangay, Province, Municipality, Barangay } from "@/lib/philippines-locations";
import { createStudentAccountAction } from "@/app/actions/setup";
import { getProfileAction } from "@/app/actions/profile";

export default function CustomizeAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    nameExtension: '',
    phoneNumber: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    gender: '',
    civilStatus: '',
    
    // Address Information
    streetName: '',
    province: '',
    municipality: '',
    barangay: '',
    zipCode: '',
    
    // Guardian Information
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: '',
    emergencyContact: '',
  });

  const [agreedToAcademicUse, setAgreedToAcademicUse] = useState(false);
  
  // Location data state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  useEffect(() => {
    // Load provinces data asynchronously
    const loadProvinces = async () => {
      try {
        const provincesData = await getProvinces();
        setProvinces(provincesData);
        toast.success('Location data loaded');
      } catch (error) {
        console.error('Error loading provinces:', error);
        toast.error('Failed to load location data');
      }
    };
    
    loadProvinces();
    
    // Get user data from Firebase Auth and sync with database
    const getUser = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user);
            
            // Get user profile from database through server action
            try {
              const profileResult = await getProfileAction({ uid: user.uid });
              const profile = profileResult.success ? profileResult.user : null;
              if (profile) {
                setUserProfile(profile);
                setFormData({
                  firstName: profile.firstName || '',
                  middleName: profile.middleName || '',
                  lastName: profile.lastName || '',
                  nameExtension: profile.nameExtension || '',
                  phoneNumber: profile.phoneNumber || '',
                  birthMonth: profile.birthMonth || '',
                  birthDay: profile.birthDay || '',
                  birthYear: profile.birthYear || '',
                  gender: profile.gender || '',
                  civilStatus: profile.civilStatus || '',
                  streetName: profile.streetName || '',
                  province: profile.province || '',
                  municipality: profile.municipality || '',
                  barangay: profile.barangay || '',
                  zipCode: profile.zipCode || '',
                  guardianName: profile.guardianName || '',
                  guardianPhone: profile.guardianPhone || '',
                  guardianEmail: profile.guardianEmail || '',
                  guardianRelationship: profile.guardianRelationship || '',
                  emergencyContact: profile.emergencyContact || '',
                });
              }
              // If no profile exists, that's fine - user will fill out the form
            } catch (error) {
              console.log('No existing profile found - user will create new profile');
              // This is expected for new users - they'll fill out the form
            }
          } else {
            // Redirect to login if not authenticated
            window.location.href = '/';
          }
        });
      } catch (error) {
        console.error('Error getting user:', error);
        window.location.href = '/';
      }
    };

    getUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    
    // Check if all required fields are filled
    const requiredFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'birthMonth', label: 'Birth Month' },
      { key: 'birthDay', label: 'Birth Day' },
      { key: 'birthYear', label: 'Birth Year' },
      { key: 'gender', label: 'Gender' },
      { key: 'civilStatus', label: 'Civil Status' },
      { key: 'streetName', label: 'Street Name' },
      { key: 'province', label: 'Province' },
      { key: 'municipality', label: 'Municipality' },
      { key: 'barangay', label: 'Barangay' },
      { key: 'zipCode', label: 'ZIP/Postal Code' },
      { key: 'guardianName', label: 'Guardian/Contact Name' },
      { key: 'guardianPhone', label: 'Guardian Phone' },
      { key: 'guardianRelationship', label: 'Relationship' }
    ];

    const missingFields = requiredFields.filter(field => !formData[field.key as keyof typeof formData]?.trim());
    
    if (missingFields.length > 0) {
      toast.error('Please check all required fields');
      return;
    }
    
    if (!agreedToAcademicUse) {
      toast.error('Please agree to the academic data usage terms');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create student account with complete profile through server action
      const profileData = {
        ...formData,
        email: user.email || '',
        photoURL: user.photoURL || '',
        provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
        academicDataUsageAgreement: agreedToAcademicUse
      };

      const result = await createStudentAccountAction({
        uid: user.uid,
        profileData,
      });

      if (result.success) {
        console.log('Student account created:', result);
        toast.success(result.message || 'Student account created');
        setUserProfile(result.user || null);
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        console.error('Failed to create student account:', result);
        toast.error(result.error || 'Failed to create student account');
      }
    } catch (error) {
      console.error('Error during setup:', error);
      toast.error('An error occurred during setup');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If empty, return empty
    if (!digits) return '';
    
    // If starts with 63, keep it
    if (digits.startsWith('63')) {
      const withoutCountryCode = digits.substring(2);
      if (withoutCountryCode.length <= 10) {
        // Format as +63 XXX XXX XXXX
        const formatted = withoutCountryCode.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        return `+63${formatted}`;
      }
    }
    
    // If starts with 0, remove it and add +63
    if (digits.startsWith('0')) {
      const withoutZero = digits.substring(1);
      if (withoutZero.length <= 10) {
        const formatted = withoutZero.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        return `+63${formatted}`;
      }
    }
    
    // If doesn't start with 63 or 0, treat as local number
    if (digits.length <= 10) {
      const formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      return `+63${formatted}`;
    }
    
    // If too long, truncate to 10 digits
    const truncated = digits.substring(0, 10);
    const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    return `+63${formatted}`;
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({
      ...prev,
      phoneNumber: formatted
    }));
  };

  const handleGuardianPhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({
      ...prev,
      guardianPhone: formatted
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Location handlers
  const handleProvinceChange = async (provinceCode: string) => {
    setFormData(prev => ({
      ...prev,
      province: provinceCode,
      municipality: '',
      barangay: '',
      zipCode: ''
    }));
    
    if (provinceCode) {
      try {
        const provinceMunicipalities = await getMunicipalitiesByProvince(provinceCode);
        setMunicipalities(provinceMunicipalities);
        setBarangays([]);
      } catch (error) {
        console.error('Error loading municipalities:', error);
        toast.error('Failed to load municipalities');
        setMunicipalities([]);
      }
    } else {
      setMunicipalities([]);
      setBarangays([]);
    }
  };

  const handleMunicipalityChange = async (municipalityCode: string) => {
    setFormData(prev => ({
      ...prev,
      municipality: municipalityCode,
      barangay: '',
      zipCode: ''
    }));
    
    if (municipalityCode) {
      try {
        const municipalityBarangays = await getBarangaysByMunicipality(municipalityCode);
        setBarangays(municipalityBarangays);
      } catch (error) {
        console.error('Error loading barangays:', error);
        toast.error('Failed to load barangays');
        setBarangays([]);
      }
    } else {
      setBarangays([]);
    }
  };

  const handleBarangayChange = (barangayCode: string) => {
    setFormData(prev => ({
      ...prev,
      barangay: barangayCode
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-900 py-12 px-4 relative">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:60px_60px] bg-blue-50"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-light text-gray-900">Setup Your Account</CardTitle>
            <CardDescription className="text-gray-500 text-base">
            Finish setting up your profile by providing accurate personal details, contact information, and background to access features and begin smoothly.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <IdentificationCard size={20} className="text-blue-900" weight="duotone" />
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify border-1 shadow-xl border-blue-900 p-3 bg-blue-100">Submit your essential personal details for account verification, including your full name, updated contact information, and a concise overview of your professional background. Ensure the information is accurate and complete to facilitate smooth verification and secure access to your account.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First Name"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">Middle Name</Label>
                  <div>
                    <Input
                      id="middleName"
                      type="text"
                      placeholder="Middle Name"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last Name"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameExtension" className="text-sm font-medium text-gray-700">Name Extension</Label>
                  <div>
                    <Input
                      id="nameExtension"
                      type="text"
                      placeholder="Jr., Sr., III, etc."
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.nameExtension}
                      onChange={(e) => handleInputChange('nameExtension', e.target.value)}
                    />
                  </div>
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 h-10 bg-gray-50 border-2 border-gray-200 text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+63962 781 1434"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <select
                        className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                        value={formData.birthMonth || ''}
                        onChange={(e) => handleInputChange('birthMonth', e.target.value)}
                      >
                        <option value="">Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                        value={formData.birthDay || ''}
                        onChange={(e) => handleInputChange('birthDay', e.target.value)}
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day.toString().padStart(2, '0')}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  <div className="relative">
                      <select
                        className="w-full px-4 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                        value={formData.birthYear || ''}
                        onChange={(e) => handleInputChange('birthYear', e.target.value)}
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></Label>
                  <div>
                    <select
                      id="gender"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="civilStatus" className="text-sm font-medium text-gray-700">Civil Status <span className="text-red-500">*</span></Label>
                  <div>
                    <select
                      id="civilStatus"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                      value={formData.civilStatus}
                      onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                    >
                      <option value="">Select civil status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <House size={20} className="text-blue-900" weight="duotone" />
                  <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify border-1 shadow-xl border-blue-900 p-3 bg-blue-100">
                Provide your full residential address details, including street, city, state, and postal code, for accurate location verification. Ensure all information is correct and up to date to confirm your residence and complete the verification process successfully.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="streetName" className="text-sm font-medium text-gray-700">Street Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                    <Input
                      id="streetName"
                      type="text"
                      placeholder="Street Name"
                      className="w-full pl-10 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.streetName}
                      onChange={(e) => handleInputChange('streetName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-medium text-gray-700">Province <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                      <select
                        id="province"
                        className="w-full pl-10 pr-4 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                        value={formData.province}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                      >
                        <option value="">Select Province</option>
                        {provinces.map(province => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">Municipality <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                      <select
                        id="municipality"
                        className="w-full pl-10 pr-4 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                        value={formData.municipality}
                        onChange={(e) => handleMunicipalityChange(e.target.value)}
                        disabled={!formData.province}
                      >
                        <option value="">Select Municipality</option>
                        {municipalities.map(municipality => (
                          <option key={municipality.code} value={municipality.code}>
                            {municipality.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barangay" className="text-sm font-medium text-gray-700">Barangay <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                      <select
                        id="barangay"
                        className="w-full pl-10 pr-4 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                        value={formData.barangay}
                        onChange={(e) => handleBarangayChange(e.target.value)}
                        disabled={!formData.municipality}
                      >
                        <option value="">Select Barangay</option>
                        {barangays.map(barangay => (
                          <option key={barangay.code} value={barangay.code}>
                            {barangay.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">ZIP/Postal Code <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                    <Input
                      id="zipCode"
                      type="text"
                        placeholder="ZIP Code"
                        className="w-full pl-10 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={20} className="text-blue-900" weight="duotone" />
                  <h3 className="text-lg font-medium text-gray-900">Guardian Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify border-1 shadow-xl border-blue-900 p-3 bg-blue-100">
                Submit emergency contact and guardian details for safety purposes, including full name, relationship, and accurate contact information. This ensures proper communication and support in case of emergencies, helping verify identity and maintaining safety throughout the verification process.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianName" className="text-sm font-medium text-gray-700">Guardian/Contact Name <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="guardianName"
                      type="text"
                      placeholder="Guardian Name"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.guardianName}
                      onChange={(e) => handleInputChange('guardianName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianRelationship" className="text-sm font-medium text-gray-700">Relationship <span className="text-red-500">*</span></Label>
                  <div>
                    <select
                      id="guardianRelationship"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 rounded-md bg-white"
                      value={formData.guardianRelationship}
                      onChange={(e) => handleInputChange('guardianRelationship', e.target.value)}
                    >
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianPhone" className="text-sm font-medium text-gray-700">Guardian Phone <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                    <Input
                      id="guardianPhone"
                      type="tel"
                      placeholder="+63962 781 1434"
                      className="w-full pl-10 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.guardianPhone}
                      onChange={(e) => handleGuardianPhoneChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianEmail" className="text-sm font-medium text-gray-700">Guardian Email</Label>
                  <div>
                    <Input
                      id="guardianEmail"
                      type="email"
                      placeholder="Guardian Email"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.guardianEmail}
                      onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">Additional Emergency Contact</Label>
                  <div>
                    <Input
                      id="emergencyContact"
                      type="text"
                      placeholder="Emergency Contact"
                      className="w-full px-3 py-2 h-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Data Usage Agreement */}
            <div className="">
              <div className="flex items-start gap-3 p-4 border-1 shadow-xl border-blue-900 bg-blue-100 text-blue-900">
                <div className="flex items-center">
                  
                </div>
                <div className="flex-1">
                  <label htmlFor="academicUse" className="text-xs text-blue-900 font-light cursor-pointer">
                    <span className="font-medium text-blue-900">Academic Data Usage Agreement</span>
                    <br />
                    I agree that the data provided in this form may be used for academic research, educational purposes, and institutional analysis. This data will be handled in accordance with applicable privacy laws and institutional policies.
                  </label>
                </div>
                
              </div>
              <div className="flex items-center text-xs text-blue-900 font-light cursor-pointer">
              <input
                    type="checkbox"
                    id="academicUse"
                    checked={agreedToAcademicUse}
                    onChange={(e) => setAgreedToAcademicUse(e.target.checked)}
                    className="w-4 mb-5 mr-2 mt-5 h-4 text-blue-900 bg-white border-gray-300 rounded focus:ring-blue-900 focus:ring-2"
                  />

                I agree with the terms and conditions
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                className="w-full bg-blue-900 hover:bg-blue-900 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-lg"
                loading={isLoading}
                disabled={!agreedToAcademicUse}
              >
                Complete Setup
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                You can update these details later in your profile settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
