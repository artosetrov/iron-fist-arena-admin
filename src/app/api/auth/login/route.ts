import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import type { AdminRole } from '@/lib/auth'

const ALLOWED_ROLES: AdminRole[] = ['admin', 'moderator', 'developer']

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.session) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { role: true },
    })

    if (!dbUser || !ALLOWED_ROLES.includes(dbUser.role as AdminRole)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      role: dbUser.role,
    })

    response.cookies.set('admin-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
