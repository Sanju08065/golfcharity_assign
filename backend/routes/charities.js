const express = require('express');
const Stripe = require('stripe');
const { body, param, query } = require('express-validator');
const { supabaseAdmin } = require('../utils/supabase');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const validateRequest = require('../middleware/validateRequest');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// GET /api/charities — List all charities with search
router.get('/', async (req, res) => {
  try {
    const { q, featured } = req.query;

    let queryBuilder = supabaseAdmin
      .from('charities')
      .select('*')
      .order('created_at', { ascending: false });

    if (q) {
      queryBuilder = queryBuilder.ilike('name', `%${q}%`);
    }

    if (featured === 'true') {
      queryBuilder = queryBuilder.eq('is_featured', true);
    }

    const { data, error } = await queryBuilder;

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data,
      count: data.length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHARITIES_FETCH_FAILED'
    });
  }
});

// GET /api/charities/:id — Single charity
router.get('/:id', [
  param('id').isUUID().withMessage('Valid charity ID required'),
  validateRequest
], async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('charities')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Charity not found',
        code: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHARITY_FETCH_FAILED'
    });
  }
});

// POST /api/admin/charities — Add charity (admin only)
router.post('/admin', verifyToken, verifyAdmin, [
  body('name').notEmpty().withMessage('Charity name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  validateRequest
], async (req, res) => {
  try {
    const { name, description, image_url, events, is_featured } = req.body;

    const { data, error } = await supabaseAdmin
      .from('charities')
      .insert({
        name,
        description,
        image_url: image_url || null,
        events: events || [],
        is_featured: is_featured || false
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({
      success: true,
      data,
      message: 'Charity added successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHARITY_CREATE_FAILED'
    });
  }
});

// PUT /api/admin/charities/:id — Edit charity (admin only)
router.put('/admin/:id', verifyToken, verifyAdmin, [
  param('id').isUUID().withMessage('Valid charity ID required'),
  validateRequest
], async (req, res) => {
  try {
    const updates = {};
    const fields = ['name', 'description', 'image_url', 'events', 'is_featured'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const { data, error } = await supabaseAdmin
      .from('charities')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data,
      message: 'Charity updated successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHARITY_UPDATE_FAILED'
    });
  }
});

// DELETE /api/admin/charities/:id — Delete charity (admin only)
router.delete('/admin/:id', verifyToken, verifyAdmin, [
  param('id').isUUID().withMessage('Valid charity ID required'),
  validateRequest
], async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('charities')
      .delete()
      .eq('id', req.params.id);

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      message: 'Charity deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHARITY_DELETE_FAILED'
    });
  }
});

// PUT /api/user/charity — Update user's selected charity and percentage
router.put('/user', verifyToken, [
  body('charity_id').optional().isUUID().withMessage('Valid charity ID required'),
  body('charity_percentage').optional().isInt({ min: 10, max: 100 }).withMessage('Percentage must be 10-100'),
  validateRequest
], async (req, res) => {
  try {
    const updates = {};
    // Sanitize charity_id — must be valid UUID or null, never empty string
    if (req.body.charity_id !== undefined) {
      const cid = req.body.charity_id;
      updates.charity_id = (cid && typeof cid === 'string' && cid.trim() !== '') ? cid.trim() : null;
    }
    if (req.body.charity_percentage !== undefined) updates.charity_percentage = req.body.charity_percentage;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*, charities(name, image_url)')
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data,
      message: 'Charity preference updated'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CHARITY_UPDATE_FAILED'
    });
  }
});

// POST /api/charities/donate — Independent donation via Stripe
router.post('/donate', verifyToken, [
  body('charity_id').isUUID().withMessage('Valid charity ID required'),
  body('amount').isFloat({ min: 1 }).withMessage('Minimum donation is £1'),
  validateRequest
], async (req, res) => {
  try {
    const { charity_id, amount } = req.body;

    const { data: charity } = await supabaseAdmin
      .from('charities')
      .select('name')
      .eq('id', charity_id)
      .single();

    if (!charity) {
      return res.status(404).json({ success: false, error: 'Charity not found', code: 'NOT_FOUND' });
    }

    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
    const email = authUserData?.user?.email || '';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(amount * 100), // pence
          product_data: { name: `Donation to ${charity.name}` },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/charity?donated=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/charity`,
      metadata: { user_id: req.user.id, charity_id, type: 'donation' },
    });

    return res.status(200).json({
      success: true,
      data: { url: session.url },
      message: 'Donation checkout created'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'DONATION_FAILED'
    });
  }
});

module.exports = router;
