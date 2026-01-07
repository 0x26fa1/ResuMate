import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inline to avoid import issues
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

    const { id } = await request.json()

    console.log('🔍 DELETE - Resume ID:', id)

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Fetch resume with file_url only (storage_path column doesn't exist)
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    console.log('📄 Resume query result:', { resume, error: fetchError })

    if (fetchError || !resume) {
      console.error('❌ Resume not found:', fetchError)
      return NextResponse.json({ 
        error: 'Resume not found or unauthorized',
        details: fetchError?.message 
      }, { status: 404 })
    }

    // Extract actual path from file_url
    let path = null
    
    if (resume.file_url) {
      const urlParts = resume.file_url.split('/resumes/')
      path = urlParts?.[1] // "user.id/timestamp_filename"
    }

    // Delete file from storage if path exists
    if (path) {
      console.log('🗑️ Deleting file from storage:', path)
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([path])

      if (storageError) {
        console.error('⚠️ Storage deletion failed:', storageError)
        // Continue with database deletion even if storage fails
      } else {
        console.log('✅ File deleted from storage')
      }
    } else {
      console.log('⚠️ No file path found, skipping storage deletion')
    }

    // Delete resume record from database
    const { error: deleteError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Database deletion failed:', deleteError)
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Resume deleted successfully from database')
    return NextResponse.json({ message: 'Resume deleted successfully' }, { status: 200 })
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}