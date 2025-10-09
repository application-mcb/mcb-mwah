'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function DebugKitPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/registrar/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registrar registered successfully!');
        setFormData({ email: '', password: '', firstName: '', lastName: '' });
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      setMessage('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Poppins' }}>
            Registrar Debug Kit
          </h1>
          <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Poppins' }}>
            Register a new registrar account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-light" style={{ fontFamily: 'Poppins' }}>
              First Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-light" style={{ fontFamily: 'Poppins' }}>
              Last Name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-light" style={{ fontFamily: 'Poppins' }}>
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-light" style={{ fontFamily: 'Poppins' }}>
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? 'Registering...' : 'Register Registrar'}
          </Button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded text-sm ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`} style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            {message}
          </div>
        )}
      </Card>
    </div>
  );
}
