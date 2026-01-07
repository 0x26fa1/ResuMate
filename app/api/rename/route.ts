import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inline
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { id, title } = await request.json()

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate title
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const trimmedTitle = title.trim()
    
    if (trimmedTitle.length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    }

    if (trimmedTitle.length > 255) {
      return NextResponse.json({ error: 'Title is too long (max 255 characters)' }, { status: 400 })
    }

    // Update resume title
    const { data, error: updateError } = await supabase
      .from('resumes')
      .update({ 
        title: trimmedTitle,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !data) {
      console.error('Update failed:', updateError)
      return NextResponse.json(
        { error: 'Rename failed or resume not found' },
        { status: updateError ? 500 : 404 }
      )
    }

    return NextResponse.json({ message: 'Resume renamed successfully', resume: data }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}