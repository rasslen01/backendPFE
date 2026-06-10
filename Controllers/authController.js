// ═══════════════════════════════════════════════════════
// Controllers/authController.js
// Auth + Email verification + Reset password
// ═══════════════════════════════════════════════════════

const userModel   = require('../Model/userModel');
const centreModel = require('../Model/centreModel');
const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const crypto      = require('crypto');
const nodemailer  = require('nodemailer');
const { createLog } = require('./logController');

const JWT_SECRET  = process.env.JWT_SECRET || 'mySecretKey';
const CLIENT_URL  = process.env.CLIENT_URL  || 'http://localhost:3000';

// ─── Transporter nodemailer ────────────────────────────
// Utilise les variables d'environnement MAIL_USER et MAIL_PASS
// Compatible Gmail, Outlook, etc.
function createTransporter() {
    return nodemailer.createTransport({
        service: process.env.MAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,  // mot de passe d'application Gmail
        },
    });
}

// ─── Template email : vérification ────────────────────
function verifyEmailTemplate(name, link) {
    return {
        subject: 'Formini — Confirmez votre adresse email',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px;text-align:center">
            <h1 style="color:white;margin:0;font-size:28px">🎓 Formini</h1>
            <p style="color:#e0f2fe;margin:8px 0 0">Plateforme de formation en Tunisie</p>
          </div>
          <div style="padding:32px">
            <h2 style="color:#1e293b">Bonjour ${name} !</h2>
            <p style="color:#475569;line-height:1.7">
              Merci de vous être inscrit sur Formini. Pour activer votre compte et commencer à explorer
              les meilleures formations en Tunisie, confirmez votre adresse email en cliquant sur le bouton ci-dessous.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${link}" style="background:#0ea5e9;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                ✅ Confirmer mon email
              </a>
            </div>
            <p style="color:#94a3b8;font-size:13px">
              Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="color:#94a3b8;font-size:12px;text-align:center">© 2025 Formini — Tunisie</p>
          </div>
        </div>`
    };
}

// ─── Template email : reset password ──────────────────
function resetPasswordTemplate(name, link) {
    return {
        subject: 'Formini — Réinitialisation de votre mot de passe',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center">
            <h1 style="color:white;margin:0;font-size:28px">🔐 Formini</h1>
            <p style="color:#fef3c7;margin:8px 0 0">Réinitialisation de mot de passe</p>
          </div>
          <div style="padding:32px">
            <h2 style="color:#1e293b">Bonjour ${name} !</h2>
            <p style="color:#475569;line-height:1.7">
              Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${link}" style="background:#f59e0b;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                🔑 Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color:#94a3b8;font-size:13px">
              Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe ne sera pas modifié.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="color:#94a3b8;font-size:12px;text-align:center">© 2025 Formini — Tunisie</p>
          </div>
        </div>`
    };
}

// ─── Helper : envoyer un email ─────────────────────────
async function sendMail(to, subject, html) {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"Formini" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
    });
}

// ══════════════════════════════════════════════════════
// REGISTER — crée le compte + envoie email de vérification
// ══════════════════════════════════════════════════════
exports.register = async (req, res) => {
    try {
        console.log('REGISTER BODY:', req.body);

        const { name, email, password, role, speciality } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword  = await bcrypt.hash(password, 10);
        const normalizedRole  = (role || 'STUDENT').toUpperCase();
        const verifyToken     = crypto.randomBytes(32).toString('hex');

        const newUser = new userModel({
            name,
            email,
            password:         hashedPassword,
            role:             normalizedRole,
            speciality,
            isEmailVerified:  false,
            emailVerifyToken: verifyToken,
        });

        await newUser.save();

        // ── Gamification XP ─────────────────────────
        try {
            const { processAction } = require('./badgeController');
            await processAction(newUser._id, 'signup');
        } catch (e) { console.error('XP signup error:', e.message); }

        // ── Créer Centre si rôle CENTRE ──────────────
        if (normalizedRole === 'CENTRE') {
            const existingCentre = await centreModel.findOne({ email: email.toLowerCase() });
            if (!existingCentre) {
                await centreModel.create({ name, email });
            }
        }

        // ── Envoyer email de vérification ────────────
        try {
            const verifyLink = `${CLIENT_URL}/auth/verify-email?token=${verifyToken}`;
            const tpl        = verifyEmailTemplate(name, verifyLink);
            await sendMail(email, tpl.subject, tpl.html);
            console.log('✅ Email de vérification envoyé à', email);
        } catch (mailErr) {
            console.error('⚠️  Email non envoyé:', mailErr.message);
            // On ne bloque pas l'inscription si le mail échoue
        }

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        await createLog({
            action:   'REGISTER',
            category: 'AUTH',
            level:    'INFO',
            status:   'SUCCESS',
            userId:   newUser._id,
            userName: newUser.name,
            userRole: newUser.role,
            details:  `Nouveau compte créé : ${email}`,
        });

        res.status(201).json({
            message:          'Compte créé ! Vérifiez votre email pour activer votre compte.',
            emailSent:        true,
            needsVerification: true,
            token,
            user: newUser,
        });

    } catch (err) {
        console.error('REGISTER ERROR:', err);
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
// VERIFY EMAIL — confirme le token reçu par email
// ══════════════════════════════════════════════════════
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token manquant' });
        }

        const user = await userModel.findOne({ emailVerifyToken: token });

        if (!user) {
            return res.status(400).json({ error: 'Lien invalide ou expiré' });
        }

        user.isEmailVerified  = true;
        user.emailVerifyToken = null;
        await user.save();

        res.status(200).json({ message: 'Email vérifié avec succès ! Vous pouvez vous connecter.' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
// RESEND VERIFY EMAIL — renvoie l'email de vérification
// ══════════════════════════════════════════════════════
exports.resendVerifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user)             return res.status(404).json({ error: 'Compte introuvable' });
        if (user.isEmailVerified) return res.status(400).json({ error: 'Email déjà vérifié' });

        const verifyToken     = crypto.randomBytes(32).toString('hex');
        user.emailVerifyToken = verifyToken;
        await user.save();

        const verifyLink = `${CLIENT_URL}/auth/verify-email?token=${verifyToken}`;
        const tpl        = verifyEmailTemplate(user.name, verifyLink);
        await sendMail(email, tpl.subject, tpl.html);

        res.status(200).json({ message: 'Email de vérification renvoyé !' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
// LOGIN — vérifie aussi si l'email est confirmé
// ══════════════════════════════════════════════════════
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await userModel.findOne({ email });

        if (!user)
            return res.status(404).json({ error: 'Account not found' });

        if (user.role !== role)
            return res.status(403).json({ error: 'Access denied for this role' });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ error: 'Invalid email or password' });

        // ── Vérification email obligatoire ──────────
        if (!user.isEmailVerified) {
            return res.status(403).json({
                error:             'Email non vérifié',
                needsVerification: true,
                email:             user.email,
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        await createLog({
            action:   'LOGIN',
            category: 'AUTH',
            level:    'INFO',
            status:   'SUCCESS',
            userId:   user._id,
            userName: user.name,
            userRole: user.role,
            details:  `Connexion réussie : ${email}`,
        });

        res.status(200).json({ token, user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
// FORGOT PASSWORD — envoie un lien de reset par email
// ══════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            // Réponse générique pour ne pas révéler si l'email existe
            return res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
        }

        const resetToken   = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

        user.resetPasswordToken   = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        const resetLink = `${CLIENT_URL}/auth/reset-password?token=${resetToken}`;
        const tpl       = resetPasswordTemplate(user.name, resetLink);
        await sendMail(email, tpl.subject, tpl.html);

        console.log('✅ Email reset envoyé à', email);
        await createLog({
            action: 'FORGOT_PASSWORD', category: 'AUTH', level: 'WARNING',
            status: 'SUCCESS', userName: user.name,
            details: `Demande reset mot de passe : ${email}`,
        });
        res.status(200).json({ message: 'Lien de réinitialisation envoyé sur votre email.' });

    } catch (err) {
        console.error('FORGOT PASSWORD ERROR:', err.message);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email.' });
    }
};

// ══════════════════════════════════════════════════════
// RESET PASSWORD — change le mot de passe avec le token
// ══════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token et mot de passe requis' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
        }

        const user = await userModel.findOne({
            resetPasswordToken:   token,
            resetPasswordExpires: { $gt: new Date() }, // pas expiré
        });

        if (!user) {
            return res.status(400).json({ error: 'Lien invalide ou expiré. Refaites une demande.' });
        }

        user.password             = await bcrypt.hash(password, 10);
        user.resetPasswordToken   = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: 'Mot de passe modifié avec succès ! Vous pouvez vous connecter.' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
