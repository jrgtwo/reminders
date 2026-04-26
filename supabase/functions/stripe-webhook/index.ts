import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-04-30.basil',
  httpClient: Stripe.createFetchHttpClient()
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message)
    return new Response('Webhook signature verification failed', {
      status: 400
    })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      if (userId) {
        // Never overwrite a comp plan
        const { data: existing } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', userId)
          .single()
        if (existing?.plan !== 'comp') {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      // Never overwrite a comp plan
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('stripe_customer_id', customerId)
        .single()
      if (updatedProfile?.plan !== 'comp') {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        await supabase
          .from('profiles')
          .update({
            plan: isActive ? 'pro' : 'free',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      // Never overwrite a comp plan
      const { data: deletedProfile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('stripe_customer_id', customerId)
        .single()
      if (deletedProfile?.plan !== 'comp') {
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
