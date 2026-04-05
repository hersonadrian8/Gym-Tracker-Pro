import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgqeookauzyguvlojxvo.supabase.co'
const supabaseAnonKey = 'sb_publishable_s9FflT4s3dMs1l-RPDVQdQ_asW-inYv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
