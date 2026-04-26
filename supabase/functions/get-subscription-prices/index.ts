import Stripe from 'https://esm.sh/stripe@17?target=deno'
import { getCorsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-04-30.basil',
  httpClient: Stripe.createFetchHttpClient()
})

type PriceInfo = {
  id: string
  amount: number
  currency: string
  interval: 'month' | 'year'
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const monthlyId = Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID')
    const yearlyId = Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID')
    if (!monthlyId || !yearlyId) {
      return new Response(JSON.stringify({ error: 'Price IDs not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const [monthly, yearly] = await Promise.all([
      stripe.prices.retrieve(monthlyId),
      stripe.prices.retrieve(yearlyId)
    ])

    const toInfo = (p: Stripe.Price, fallbackInterval: 'month' | 'year'): PriceInfo => ({
      id: p.id,
      amount: p.unit_amount ?? 0,
      currency: p.currency,
      interval: (p.recurring?.interval as 'month' | 'year') ?? fallbackInterval
    })

    return new Response(
      JSON.stringify({
        monthly: toInfo(monthly, 'month'),
        yearly: toInfo(yearly, 'year')
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      }
    )
  } catch (err) {
    console.error('Get prices error:', (err as Error).message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
