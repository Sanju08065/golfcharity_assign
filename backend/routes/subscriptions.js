const express = require('express');
const Stripe = require('stripe');
const { supabaseAdmin } = require('../utils/supabase');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/subscribe — Create Stripe Checkout Session and return URL
router.post('/', verifyToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const user_id = req.user.id;
    const email = req.user.email;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be monthly or yearly.',
        code: 'INVALID_PLAN'
      });
    }

    const priceId = plan === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { user_id, plan },
      subscription_data: {
        metadata: { user_id, plan },
      },
    });

    return res.status(200).json({
      success: true,
      data: { url: session.url },
      message: 'Checkout session created'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHECKOUT_FAILED'
    });
  }
});

// POST /api/subscription/activate — verify session with Stripe and activate directly
// Called by frontend after redirect from Stripe checkout success
router.post('/activate', verifyToken, async (req, res) => {
  try {
    const { session_id } = req.body;
    console.log('Activate called with session_id:', session_id, 'user:', req.user.id);

    if (!session_id) {
      return res.status(400).json({ success: false, error: 'session_id required', code: 'MISSING_SESSION' });
    }

    // Retrieve session directly from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Stripe session:', { payment_status: session.payment_status, metadata: session.metadata, subscription: session.subscription });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Payment not completed', code: 'NOT_PAID' });
    }

    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan || 'monthly';

    // Security: ensure the session belongs to the logged-in user
    if (userId !== req.user.id) {
      console.error('User mismatch:', { sessionUserId: userId, reqUserId: req.user.id });
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const stripeSubscriptionId = session.subscription;

    let renewalDate = null;
    if (stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        if (sub.current_period_end) {
          const d = new Date(sub.current_period_end * 1000);
          renewalDate = isNaN(d.getTime()) ? null : d.toISOString();
        }
      } catch (e) { console.error('Failed to get subscription details:', e.message); }
    }

    // Fallback: calculate renewal from today + plan duration if Stripe didn't provide it
    if (!renewalDate) {
      const now = new Date();
      if (plan === 'yearly') {
        now.setFullYear(now.getFullYear() + 1);
      } else {
        now.setMonth(now.getMonth() + 1);
      }
      renewalDate = now.toISOString();
    }

    const { data: updateResult, error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        stripe_subscription_id: stripeSubscriptionId,
        renewal_date: renewalDate,
      })
      .eq('id', userId)
      .select();

    console.log('Supabase update result:', { updateResult, error });

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      message: 'Subscription activated',
      data: { status: 'active', plan, renewal_date: renewalDate }
    });
  } catch (err) {
    console.error('Activate error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'ACTIVATE_FAILED'
    });
  }
});

// GET /api/subscription/status/:user_id
router.get('/status/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    if (user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, subscription_plan, renewal_date, stripe_subscription_id')
      .eq('id', user_id)
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data: {
        status: profile.subscription_status,
        plan: profile.subscription_plan,
        renewal_date: profile.renewal_date,
        has_subscription: profile.subscription_status === 'active'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'STATUS_CHECK_FAILED'
    });
  }
});

// POST /api/subscription/cancel — Cancel via Stripe API
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found',
        code: 'NO_SUBSCRIPTION'
      });
    }

    // Cancel at period end — user keeps access until renewal date
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Subscription will cancel at end of billing period'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CANCEL_FAILED'
    });
  }
});

module.exports = router;
