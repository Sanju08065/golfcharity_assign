const express = require('express');
const Stripe = require('stripe');
const { supabaseAdmin } = require('../utils/supabase');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Safe date conversion — never throws
function safeDate(timestamp) {
  if (!timestamp) return null;
  try {
    const d = new Date(timestamp * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch { return null; }
}

// POST /api/webhook — Stripe webhook handler
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan || 'monthly';
        const stripeSubscriptionId = session.subscription;

        if (!userId) { console.warn('checkout.session.completed missing user_id'); break; }

        let renewalDate = null;
        if (stripeSubscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            renewalDate = safeDate(sub.current_period_end);
          } catch (e) { console.error('Failed to retrieve subscription:', e.message); }
        }

        // Fallback: calculate from today + plan duration
        if (!renewalDate) {
          const now = new Date();
          if (plan === 'yearly') now.setFullYear(now.getFullYear() + 1);
          else now.setMonth(now.getMonth() + 1);
          renewalDate = now.toISOString();
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan: plan,
            stripe_subscription_id: stripeSubscriptionId,
            renewal_date: renewalDate,
          })
          .eq('id', userId);

        if (error) console.error('DB update failed:', error.message);
        else console.log(`Subscription activated — user: ${userId}, plan: ${plan}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const stripeSubId = invoice.subscription;
        if (!stripeSubId) break;

        let renewalDate = null;
        try {
          const sub = await stripe.subscriptions.retrieve(stripeSubId);
          renewalDate = safeDate(sub.current_period_end);
        } catch (e) { console.error('Failed to retrieve subscription:', e.message); }

        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'active', renewal_date: renewalDate })
          .eq('stripe_subscription_id', stripeSubId);

        console.log(`Subscription renewed — stripe_id: ${stripeSubId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeSubId = invoice.subscription;
        if (!stripeSubId) break;

        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'lapsed' })
          .eq('stripe_subscription_id', stripeSubId);

        console.log(`Payment failed — stripe_id: ${stripeSubId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const stripeSubId = sub.id;
        const statusMap = {
          active: sub.cancel_at_period_end ? 'cancelled' : 'active',
          past_due: 'lapsed', unpaid: 'lapsed', canceled: 'inactive',
          incomplete: 'inactive', incomplete_expired: 'inactive',
          trialing: 'active', paused: 'inactive',
        };
        const newStatus = statusMap[sub.status] || 'inactive';
        const renewalDate = safeDate(sub.current_period_end);

        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: newStatus, renewal_date: renewalDate })
          .eq('stripe_subscription_id', stripeSubId);

        console.log(`Subscription updated — stripe_id: ${stripeSubId}, status: ${newStatus}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'inactive', stripe_subscription_id: null, renewal_date: null })
          .eq('stripe_subscription_id', sub.id);
        console.log(`Subscription deleted — stripe_id: ${sub.id}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
