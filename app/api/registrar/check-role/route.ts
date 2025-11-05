import { NextRequest, NextResponse } from 'next/server';
import { RegistrarDatabase } from '@/lib/registrar-database';

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(uid);

    if (!hasRegistrarRole) {
      // Also try to find by email as fallback
      if (email) {
        const registrarByEmail = await RegistrarDatabase.getRegistrarByEmail(email);
        
        if (registrarByEmail && registrarByEmail.uid === uid) {
          // Update last login
          await RegistrarDatabase.updateLastLogin(uid);
          
          return NextResponse.json({
            success: true,
            registrar: {
              uid: registrarByEmail.uid,
              email: registrarByEmail.email,
              firstName: registrarByEmail.firstName,
              lastName: registrarByEmail.lastName,
              role: registrarByEmail.role
            }
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Access denied. Registrar role required.' },
        { status: 403 }
      );
    }

    // Get registrar data
    const registrar = await RegistrarDatabase.getRegistrar(uid);

    if (!registrar) {
      return NextResponse.json(
        { error: 'Registrar not found' },
        { status: 404 }
      );
    }

    // Update last login
    await RegistrarDatabase.updateLastLogin(uid);

    return NextResponse.json({
      success: true,
      registrar: {
        uid: registrar.uid,
        email: registrar.email,
        firstName: registrar.firstName,
        lastName: registrar.lastName,
        role: registrar.role
      }
    });

  } catch (error: any) {
    console.error('Role check failed:', error);

    return NextResponse.json(
      { error: 'Role check failed: ' + error.message },
      { status: 500 }
    );
  }
}
