import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'
import { getCorsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-04-30.basil',
  httpClient: Stripe.createFetchHttpClient(),
})

const allowedRedirectOrigins = [
  'https://remindertoday.com',
  'https://www.remindertoday.com',
  'http://localhost:5173',
]

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate the user's JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { priceId } = await req.json()
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Missing priceId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user already has a stripe_customer_id
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single()

    // Prevent duplicate subscriptions or charging comp users
    if (profile?.plan === 'pro' || profile?.plan === 'comp') {
      return new Response(JSON.stringify({ error: 'Already subscribed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let customerId = profile?.stripe_customer_id

    // Create or reuse Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Validate redirect origin
    const requestOrigin = req.headers.get('origin')
    const redirectOrigin =
      requestOrigin && allowedRedirectOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedRedirectOrigins[0]

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${redirectOrigin}/settings?upgraded=true`,
      cancel_url: `${redirectOrigin}/settings`,
      client_reference_id: user.id,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Checkout session error:', (err as Error).message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
