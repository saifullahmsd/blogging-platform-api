/**
 * User Model
 * Defines user schema with authentication fields, security controls (login attempts, lockout),
 * refresh token management, and password hashing.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/validateEnv');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ],

    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'author', 'admin'],
        default: 'user'
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    avatar: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Security: Brute-force protection
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },

    // Security: Token management for multi-device logout
    refreshTokens: [{
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        }
    }],

    // Audit timestamps
    lastLogin: {
        type: Date
    },
    passwordChangedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.loginAttempts;
            delete ret.lockUntil;
            return ret;
        }
    }
});

// Query optimization indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

/**
 * Pre-save: Hash password and update passwordChangedAt for existing users.
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);

        // Subtract 1s to ensure JWT issued before password change is invalidated
        if (this.isModified('password') && !this.isNew) {
            this.passwordChangedAt = Date.now() - 1000;
        }

        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Compares candidate password with stored hash.
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks if account is currently locked.
 * @returns {boolean} True if locked
 */
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increments failed login attempts. Locks account after MAX_LOGIN_ATTEMPTS.
 */
userSchema.methods.incLoginAttempts = async function () {
    // Reset if previous lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    if (this.loginAttempts + 1 >= env.MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
        const lockTime = parseLockTime(env.LOCK_TIME);
        updates.$set = { lockUntil: Date.now() + lockTime };
    }

    return this.updateOne(updates);
};

/**
 * Resets login attempts on successful authentication.
 */
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: new Date() },
        $unset: { lockUntil: 1 }
    });
};

/**
 * Adds refresh token for session management. Limits to 5 active sessions.
 * @param {string} token - Refresh token value
 * @param {Date} expiresAt - Token expiration timestamp
 */
userSchema.methods.addRefreshToken = async function (token, expiresAt) {
    this.refreshTokens.push({ token, expiresAt });

    // Limit concurrent sessions
    if (this.refreshTokens.length > 5) {
        this.refreshTokens = this.refreshTokens.slice(-5);
    }

    await this.save();
};

/**
 * Removes specific refresh token on logout.
 * @param {string} token - Token to invalidate
 */
userSchema.methods.removeRefreshToken = async function (token) {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
    await this.save();
};

/**
 * Parses time string (e.g., '2h', '30m') to milliseconds.
 * @param {string} timeString - Duration string with unit suffix
 * @returns {number} Duration in milliseconds
 */
function parseLockTime(timeString) {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };

    return value * (multipliers[unit] || multipliers.h);
}

const User = mongoose.model('User', userSchema);

module.exports = User;