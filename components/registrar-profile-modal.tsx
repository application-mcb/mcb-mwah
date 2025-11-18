'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  Envelope,
  IdentificationCard,
  Calendar,
  PaperPlaneTilt,
  Camera,
  Shield,
} from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth-context'
import { storage, auth } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'

interface RegistrarProfileModalProps {
  isOpen: boolean
  onClose: () => void
  registrar: {
    uid: string
    email: string
    firstName: string
    lastName: string
    middleName?: string
    nameExtension?: string
    birthday?: string
    photoURL?: string
  }
  onUpdate?: () => void
}

export default function RegistrarProfileModal({
  isOpen,
  onClose,
  registrar,
  onUpdate,
}: RegistrarProfileModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | undefined>(
    registrar.photoURL
  )
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nameExtension: '',
    birthday: '',
  })

  useEffect(() => {
    if (registrar) {
      setFormData({
        firstName: registrar.firstName || '',
        middleName: registrar.middleName || '',
        lastName: registrar.lastName || '',
        nameExtension: registrar.nameExtension || '',
        birthday: registrar.birthday || '',
      })
      setCurrentPhotoURL(registrar.photoURL)
      setPhotoPreview(null)
    }
  }, [registrar])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required', { autoClose: 3000 })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/registrar/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: registrar.uid,
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim(),
          lastName: formData.lastName.trim(),
          nameExtension: formData.nameExtension.trim(),
          birthday: formData.birthday.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully', { autoClose: 3000 })
      onUpdate?.()
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile', {
        autoClose: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file', { autoClose: 3000 })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB', { autoClose: 3000 })
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      setIsUploadingPhoto(true)
      try {
        // Create storage reference
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `registrars/${
          registrar.uid
        }/profile-${Date.now()}.${fileExtension}`
        const storageRef = ref(storage, fileName)

        // Upload file to Firebase Storage
        const snapshot = await uploadBytes(storageRef, file)

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref)

        // Update Firebase Auth user profile photoURL
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL,
          })
        }

        // Update registrar profile with photoURL only
        const updateResponse = await fetch('/api/registrar/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: registrar.uid,
            firstName: registrar.firstName,
            lastName: registrar.lastName,
            middleName: registrar.middleName,
            nameExtension: registrar.nameExtension,
            birthday: registrar.birthday,
            photoURL: downloadURL,
          }),
        })

        const updateData = await updateResponse.json()

        if (!updateResponse.ok) {
          throw new Error(updateData.error || 'Failed to update profile')
        }

        setCurrentPhotoURL(downloadURL)
        setPhotoPreview(null)
        toast.success('Profile picture updated successfully', {
          autoClose: 3000,
        })
        onUpdate?.()
      } catch (error: any) {
        console.error('Error uploading photo:', error)
        toast.error(error.message || 'Failed to upload photo', {
          autoClose: 5000,
        })
        setPhotoPreview(null)
      } finally {
        setIsUploadingPhoto(false)
      }
    }
    input.click()
  }

  const handleSendPasswordReset = async () => {
    setIsSendingReset(true)

    try {
      const response = await fetch('/api/registrar/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: registrar.uid,
          email: registrar.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email')
      }

      toast.success('Password reset email sent successfully', {
        autoClose: 3000,
      })
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      toast.error(error.message || 'Failed to send password reset email', {
        autoClose: 5000,
      })
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings" size="md">
      <div className="p-6 space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center border-4 border-blue-900">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : currentPhotoURL || user?.photoURL ? (
                <img
                  src={currentPhotoURL || user?.photoURL || ''}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield size={40} className="text-white" weight="duotone" />
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Change profile picture"
            >
              <Camera size={14} className="text-white" weight="fill" />
            </button>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First Name"
                className="rounded-lg"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last Name"
                className="rounded-lg"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="middleName"
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Middle Name
              </Label>
              <Input
                id="middleName"
                type="text"
                placeholder="Middle Name"
                className="rounded-lg"
                value={formData.middleName}
                onChange={(e) =>
                  handleInputChange('middleName', e.target.value)
                }
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="nameExtension"
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Extension
              </Label>
              <Input
                id="nameExtension"
                type="text"
                placeholder="Jr., Sr., III, etc."
                className="rounded-lg"
                value={formData.nameExtension}
                onChange={(e) =>
                  handleInputChange('nameExtension', e.target.value)
                }
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="birthday"
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Birthday
            </Label>
            <Input
              id="birthday"
              type="date"
              className="rounded-lg"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
        </div>

        {/* Uneditable Information */}
        <div className="pt-4 border-t border-blue-100 space-y-4">
          <h3
            className="text-sm font-medium text-gray-700"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Account Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <IdentificationCard
                size={20}
                className="text-blue-900"
                weight="fill"
              />
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Document ID</Label>
                <p
                  className="text-sm text-gray-900 font-mono"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {registrar.uid}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Envelope size={20} className="text-blue-900" weight="fill" />
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Email</Label>
                <p
                  className="text-sm text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {registrar.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <PaperPlaneTilt
                size={20}
                className="text-blue-900"
                weight="fill"
              />
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Password Reset</Label>
                <Button
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset}
                  className="mt-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs px-4 py-1.5"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {isSendingReset ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
