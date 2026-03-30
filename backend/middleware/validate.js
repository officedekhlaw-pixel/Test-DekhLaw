/**
 * DekhLaw — Validation Rules
 * All form input validation using express-validator.
 */

const { body, validationResult } = require('express-validator');

// ─── Helper ───────────────────────────────────────────────────────────────────

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
}

// ─── User Registration ────────────────────────────────────────────────────────

const userRegisterRules = [
  body('full_name')
    .trim().notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),

  body('phone')
    .trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.'),

  body('email')
    .optional({ checkFalsy: true })
    .trim().isEmail().withMessage('Enter a valid email address.'),

  body('city')
    .trim().notEmpty().withMessage('City is required.'),
];

// ─── Lawyer Registration ──────────────────────────────────────────────────────

const lawyerRegisterRules = [
  body('full_name')
    .trim().notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),

  body('phone')
    .trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.'),

  body('city')
    .trim().notEmpty().withMessage('City is required.'),

  body('practice_area')
    .trim().notEmpty().withMessage('Practice area is required.'),

  body('years_experience')
    .trim().notEmpty().withMessage('Years of experience is required.'),

  body('bar_council_number')
    .trim().notEmpty().withMessage('Bar Council enrollment number is required.')
    .matches(/^[A-Z]+\/\d+\/\d{4}$/i).withMessage('Enrollment number must be in format: State/Number/Year (e.g., D/1234/2023).'),

  body('court_of_practice')
    .trim().notEmpty().withMessage('Court of practice is required.'),
];

// ─── SOS Form ─────────────────────────────────────────────────────────────────

const sosRules = [
  body('name')
    .trim().notEmpty().withMessage('Your name is required.'),

  body('phone')
    .trim().notEmpty().withMessage('Mobile number is required.')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.'),

  body('city')
    .trim().notEmpty().withMessage('City is required.'),

  body('legalIssue')
    .trim().notEmpty().withMessage('Nature of legal emergency is required.')
    .isIn([
      'Detained / Arrested',
      'Urgent Legal Notice',
      'At a Court Proceeding',
      'Unlawful Eviction',
      'Other Legal Emergency'
    ]).withMessage('Invalid legal issue type.'),
];

// ─── Contact Form ─────────────────────────────────────────────────────────────

const contactRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required.'),

  body('email')
    .trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email.'),

  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.'),

  body('message')
    .trim().notEmpty().withMessage('Message is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters.'),
];

// ─── Admin Login ──────────────────────────────────────────────────────────────

const adminLoginRules = [
  body('email').trim().notEmpty().isEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password required.'),
];

module.exports = {
  validate,
  userRegisterRules,
  lawyerRegisterRules,
  sosRules,
  contactRules,
  adminLoginRules,
};
