"use client";

import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Envelope, Phone, MapPin, Calendar, IdentificationCard, Shield, House, Check, GraduationCap } from "@phosphor-icons/react";
import { UserProfile } from "@/lib/user-sync";
import { getProvinces, getMunicipalitiesByProvince, getBarangaysByMunicipality, getZipCodeByBarangay, Province, Municipality, Barangay } from "@/lib/philippines-locations";
import { updateProfileAction } from "@/app/actions/profile";

interface ProfileFormProps {
  user: any;
  userProfile: UserProfile | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const ProfileForm = ({ user, userProfile, onSuccess, onCancel, isModal = false }: ProfileFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
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
    religion: '',
    placeOfBirth: '',
    citizenship: '',
    
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
    
    // Previous School Information
    previousSchoolName: '',
    previousSchoolType: '',
    previousSchoolProvince: '',
    previousSchoolMunicipality: '',
  });

  // Store selected location data for display
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
  const [selectedPreviousSchoolProvince, setSelectedPreviousSchoolProvince] = useState<Province | null>(null);
  const [selectedPreviousSchoolMunicipality, setSelectedPreviousSchoolMunicipality] = useState<Municipality | null>(null);

  const [agreedToAcademicUse, setAgreedToAcademicUse] = useState(false);
  
  // Location data state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  
  // Previous school location data state
  const [previousSchoolMunicipalities, setPreviousSchoolMunicipalities] = useState<Municipality[]>([]);

  useEffect(() => {
    // Load provinces data asynchronously
    const loadProvinces = async () => {
      try {
        const provincesData = await getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error('Error loading provinces:', error);
        toast.error('Failed to load location data');
      }
    };
    
    loadProvinces();
    
    // Pre-fill form with existing data
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        middleName: userProfile.middleName || '',
        lastName: userProfile.lastName || '',
        nameExtension: userProfile.nameExtension || '',
        phoneNumber: userProfile.phoneNumber || '',
        birthMonth: userProfile.birthMonth || '',
        birthDay: userProfile.birthDay || '',
        birthYear: userProfile.birthYear || '',
        gender: userProfile.gender || '',
        civilStatus: userProfile.civilStatus || '',
        religion: userProfile.religion || '',
        placeOfBirth: userProfile.placeOfBirth || '',
        citizenship: userProfile.citizenship || '',
        streetName: userProfile.streetName || '',
        province: userProfile.province || '',
        municipality: userProfile.municipality || '',
        barangay: userProfile.barangay || '',
        zipCode: userProfile.zipCode || '',
        guardianName: userProfile.guardianName || '',
        guardianPhone: userProfile.guardianPhone || '',
        guardianEmail: userProfile.guardianEmail || '',
        guardianRelationship: userProfile.guardianRelationship || '',
        emergencyContact: userProfile.emergencyContact || '',
        previousSchoolName: userProfile.previousSchoolName || '',
        previousSchoolType: userProfile.previousSchoolType || '',
        previousSchoolProvince: userProfile.previousSchoolProvince || '',
        previousSchoolMunicipality: userProfile.previousSchoolMunicipality || '',
      });
      setAgreedToAcademicUse(userProfile.academicDataUsageAgreement || false);
      
      // Set selected location data for proper dropdown display
      if (userProfile.province) {
        const province = provinces.find(p => p.name === userProfile.province);
        if (province) {
          setSelectedProvince(province);
          // Load municipalities for this province
          getMunicipalitiesByProvince(province.code).then(municipalities => {
            setMunicipalities(municipalities);
            if (userProfile.municipality) {
              const municipality = municipalities.find(m => m.name === userProfile.municipality);
              if (municipality) {
                setSelectedMunicipality(municipality);
                // Load barangays for this municipality
                getBarangaysByMunicipality(municipality.code).then(barangays => {
                  setBarangays(barangays);
                  if (userProfile.barangay) {
                    const barangay = barangays.find(b => b.name === userProfile.barangay);
                    if (barangay) {
                      setSelectedBarangay(barangay);
                    }
                  }
                });
              }
            }
          });
        }
      }
      
      // Load municipalities for previous school if province exists
      if (userProfile.previousSchoolProvince) {
        const loadPreviousSchoolMunicipalities = async () => {
          try {
            const previousProvince =
              provinces.find((p) => p.name === userProfile.previousSchoolProvince) ||
              provinces.find((p) => p.code === userProfile.previousSchoolProvince) ||
              null;

            const provinceCode = previousProvince?.code || userProfile.previousSchoolProvince;

            if (previousProvince) {
              setSelectedPreviousSchoolProvince(previousProvince);
            }

            const municipalitiesData = await getMunicipalitiesByProvince(provinceCode);
            setPreviousSchoolMunicipalities(municipalitiesData);

            if (userProfile.previousSchoolMunicipality) {
              const matchingMunicipality =
                municipalitiesData.find((m) => m.name === userProfile.previousSchoolMunicipality) ||
                municipalitiesData.find((m) => m.code === userProfile.previousSchoolMunicipality) ||
                null;

              if (matchingMunicipality) {
                setSelectedPreviousSchoolMunicipality(matchingMunicipality);
              }
            }
          } catch (error) {
            console.error('Error loading previous school municipalities:', error);
          }
        };
        loadPreviousSchoolMunicipalities();
      }
    }
  }, [userProfile, provinces]);

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields client-side for better UX
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
      { key: 'guardianRelationship', label: 'Relationship' },
      { key: 'previousSchoolName', label: 'Previous School Name' },
      { key: 'previousSchoolType', label: 'Previous School Type' },
      { key: 'previousSchoolProvince', label: 'Previous School Province' },
      { key: 'previousSchoolMunicipality', label: 'Previous School Municipality' }
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
      // Call the profile update server action
      const result = await updateProfileAction({
        uid: user.uid,
        profileData: {
          ...formData,
          academicDataUsageAgreement: agreedToAcademicUse,
          locationCodes: {
            province: selectedProvince?.code || '',
            municipality: selectedMunicipality?.code || '',
            barangay: selectedBarangay?.code || '',
            previousSchoolProvince: selectedPreviousSchoolProvince?.code || '',
            previousSchoolMunicipality: selectedPreviousSchoolMunicipality?.code || '',
          },
        },
      });

      if (result.success) {
        toast.success('Profile updated successfully');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
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
    const province = provinces.find(p => p.code === provinceCode);
    
    setFormData(prev => ({
      ...prev,
      province: province?.name || '',
      municipality: '',
      barangay: '',
      zipCode: ''
    }));
    
    setSelectedProvince(province || null);
    setSelectedMunicipality(null);
    setSelectedBarangay(null);
    
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
    const municipality = municipalities.find(m => m.code === municipalityCode);
    
    setFormData(prev => ({
      ...prev,
      municipality: municipality?.name || '',
      barangay: '',
      zipCode: ''
    }));
    
    setSelectedMunicipality(municipality || null);
    setSelectedBarangay(null);
    
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
    const barangay = barangays.find(b => b.code === barangayCode);
    
    setFormData(prev => ({
      ...prev,
      barangay: barangay?.name || ''
    }));
    
    setSelectedBarangay(barangay || null);
  };

  // Previous school location handlers
  const handlePreviousSchoolProvinceChange = async (provinceCode: string) => {
    const province =
      provinces.find((p) => p.code === provinceCode) || null;

    setSelectedPreviousSchoolProvince(province);
    setSelectedPreviousSchoolMunicipality(null);

    setFormData(prev => ({
      ...prev,
      previousSchoolProvince: province?.name || '',
      previousSchoolMunicipality: ''
    }));
    
    if (provinceCode) {
      try {
        const provinceMunicipalities = await getMunicipalitiesByProvince(provinceCode);
        setPreviousSchoolMunicipalities(provinceMunicipalities);
      } catch (error) {
        console.error('Error loading municipalities:', error);
        toast.error('Failed to load municipalities');
        setPreviousSchoolMunicipalities([]);
      }
    } else {
      setPreviousSchoolMunicipalities([]);
    }
  };

  const handlePreviousSchoolMunicipalityChange = (municipalityCode: string) => {
    const municipality =
      previousSchoolMunicipalities.find((m) => m.code === municipalityCode) || null;

    setSelectedPreviousSchoolMunicipality(municipality);

    setFormData(prev => ({
      ...prev,
      previousSchoolMunicipality: municipality?.name || ''
    }));
  };

  return (
    <div className={`${isModal ? 'p-6' : 'min-h-screen bg-gradient-to-br from-blue-900 to-blue-900 py-12 px-4 relative'}`}>
      {!isModal && (
        <>
          {/* Decorative Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </>
      )}
      
      <div className={`${isModal ? 'w-full' : 'max-w-4xl mx-auto relative z-10'}`}>
        <Card className={`${isModal ? 'shadow-lg border border-blue-100 rounded-xl bg-white/80 backdrop-blur-sm' : 'shadow-2xl border border-blue-100 rounded-xl bg-white/80 backdrop-blur-sm'}`}>
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {userProfile ? 'Edit Your Profile' : 'Setup Your Account'}
            </CardTitle>
            <CardDescription className="text-gray-600 text-base" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              {userProfile 
                ? 'Update your personal details, contact information, and background information.'
                : 'Finish setting up your profile by providing accurate personal details, contact information, and background to access features and begin smoothly.'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                    <IdentificationCard size={18} className="text-white" weight="fill" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Personal Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify rounded-xl border border-blue-100 shadow-sm p-3 bg-blue-50" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  {userProfile 
                    ? 'Update your essential personal details for account verification, including your full name, updated contact information, and a concise overview of your professional background.'
                    : 'Submit your essential personal details for account verification, including your full name, updated contact information, and a concise overview of your professional background. Ensure the information is accurate and complete to facilitate smooth verification and secure access to your account.'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First Name"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 py-2 h-10 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-500"
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                        className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
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
                    <div>
                      <select
                        className="w-full px-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
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
                    <div>
                      <select
                        className="w-full px-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
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
                      className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
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
                      className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
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

                <div className="space-y-2">
                  <Label htmlFor="religion" className="text-sm font-medium text-gray-700">Religion</Label>
                  <div>
                    <Input
                      id="religion"
                      type="text"
                      placeholder="Religion"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.religion}
                      onChange={(e) => handleInputChange('religion', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth" className="text-sm font-medium text-gray-700">Place of Birth</Label>
                  <div>
                    <Input
                      id="placeOfBirth"
                      type="text"
                      placeholder="Place of Birth"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.placeOfBirth}
                      onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citizenship" className="text-sm font-medium text-gray-700">Citizenship</Label>
                  <div>
                    <Input
                      id="citizenship"
                      type="text"
                      placeholder="Citizenship"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.citizenship}
                      onChange={(e) => handleInputChange('citizenship', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                    <House size={18} className="text-white" weight="fill" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Address Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify rounded-xl border border-blue-100 shadow-sm p-3 bg-blue-50" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  {userProfile 
                    ? 'Update your full residential address details, including street, city, state, and postal code, for accurate location verification.'
                    : 'Provide your full residential address details, including street, city, state, and postal code, for accurate location verification. Ensure all information is correct and up to date to confirm your residence and complete the verification process successfully.'
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="streetName" className="text-sm font-medium text-gray-700">Street Name <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="streetName"
                      type="text"
                      placeholder="Street Name"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.streetName}
                      onChange={(e) => handleInputChange('streetName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-medium text-gray-700">Province <span className="text-red-500">*</span></Label>
                    <div>
                      <select
                        id="province"
                        className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
                        value={selectedProvince?.code || ''}
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
                    <div>
                      <select
                        id="municipality"
                        className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
                        value={selectedMunicipality?.code || ''}
                        onChange={(e) => handleMunicipalityChange(e.target.value)}
                        disabled={!selectedProvince}
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
                    <div>
                      <select
                        id="barangay"
                        className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
                        value={selectedBarangay?.code || ''}
                        onChange={(e) => handleBarangayChange(e.target.value)}
                        disabled={!selectedMunicipality}
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
                    <div>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="ZIP Code"
                        className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
              <div className="pb-4 border-b border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                    <Shield size={18} className="text-white" weight="fill" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Guardian Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify rounded-xl border border-blue-100 shadow-sm p-3 bg-blue-50" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  {userProfile 
                    ? 'Update emergency contact and guardian details for safety purposes, including full name, relationship, and accurate contact information.'
                    : 'Submit emergency contact and guardian details for safety purposes, including full name, relationship, and accurate contact information. This ensures proper communication and support in case of emergencies, helping verify identity and maintaining safety throughout the verification process.'
                  }
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
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
                  <div>
                    <Input
                      id="guardianPhone"
                      type="tel"
                      placeholder="+63962 781 1434"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
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
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Previous School Information Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                    <GraduationCap size={18} className="text-white" weight="fill" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Previous School Information</h3>
                </div>
                <p className="text-xs text-blue-900 font-light text-justify rounded-xl border border-blue-100 shadow-sm p-3 bg-blue-50" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Provide details about your previous educational institution, including the school name, type (private or public), and location. This information helps us understand your academic background and ensures proper record keeping.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previousSchoolName" className="text-sm font-medium text-gray-700">Name of School <span className="text-red-500">*</span></Label>
                  <div>
                    <Input
                      id="previousSchoolName"
                      type="text"
                      placeholder="Name of School"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                      value={formData.previousSchoolName}
                      onChange={(e) => handleInputChange('previousSchoolName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousSchoolType" className="text-sm font-medium text-gray-700">School Type <span className="text-red-500">*</span></Label>
                  <div>
                    <select
                      id="previousSchoolType"
                      className="w-full px-3 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
                      value={formData.previousSchoolType}
                      onChange={(e) => handleInputChange('previousSchoolType', e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="Private">Private</option>
                      <option value="Public">Public</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousSchoolProvince" className="text-sm font-medium text-gray-700">Province <span className="text-red-500">*</span></Label>
                  <div>
                    <select
                      id="previousSchoolProvince"
                      className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
                      value={selectedPreviousSchoolProvince?.code || ''}
                      onChange={(e) => handlePreviousSchoolProvinceChange(e.target.value)}
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
                  <Label htmlFor="previousSchoolMunicipality" className="text-sm font-medium text-gray-700">Municipality <span className="text-red-500">*</span></Label>
                  <div>
                    <select
                      id="previousSchoolMunicipality"
                      className="w-full px-3 pr-4 py-2 h-10 rounded-xl border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200 bg-white"
                      value={selectedPreviousSchoolMunicipality?.code || ''}
                      onChange={(e) => handlePreviousSchoolMunicipalityChange(e.target.value)}
                      disabled={!selectedPreviousSchoolProvince}
                    >
                      <option value="">Select Municipality</option>
                      {previousSchoolMunicipalities.map(municipality => (
                        <option key={municipality.code} value={municipality.code}>
                          {municipality.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Data Usage Agreement */}
            <div className="">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 shadow-sm bg-blue-50 text-blue-900">
                <div className="flex items-center">
                  
                </div>
                <div className="flex-1">
                  <label htmlFor="academicUse" className="text-xs text-blue-900 font-light cursor-pointer" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    <span className="font-medium text-blue-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Academic Data Usage Agreement</span>
                    <br />
                    I agree that the data provided in this form may be used for academic research, educational purposes, and institutional analysis. This data will be handled in accordance with applicable privacy laws and institutional policies.
                  </label>
                </div>
                
              </div>
              <div className="flex items-center text-xs text-blue-900 font-light cursor-pointer mt-3" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                <input
                  type="checkbox"
                  id="academicUse"
                  checked={agreedToAcademicUse}
                  onChange={(e) => setAgreedToAcademicUse(e.target.checked)}
                  className="w-4 mr-2 h-4 text-blue-900 bg-white border-gray-300 rounded-lg focus:ring-blue-900 focus:ring-2"
                />
                I agree with the terms and conditions
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                loading={isLoading}
                disabled={!agreedToAcademicUse}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {userProfile ? 'Update Profile' : 'Complete Setup'}
              </Button>
              
              {isModal && onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="px-8 py-3 rounded-xl"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Cancel
                </Button>
              )}
            </div>

            {!isModal && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  You can update these details later in your profile settings
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
