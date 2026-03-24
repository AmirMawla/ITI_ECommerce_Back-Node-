const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: [3],
            maxlength: [30]
        },
        email: {
            type: String,
            required: true,
            unique: true ,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
        },
        password: {
            type: String,
            required: true,
            minlength: [8],
            maxlength: [200] ,
            select: false,
            // match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
        },
        birthdate: {
            type: Date,
            validate: {
              validator: (v) => !v || v < new Date(),
              message: "Birthdate must be in the past",
            },
          },
          role: {
            type: String,
            enum: {
              values: ["customer", "seller", "admin"],
              message: "Role must be customer, seller, or admin",
            },
            default: "customer",
          },
          address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            country: { type: String, trim: true },
            zipCode: { type: String, trim: true },
          },
          phone: {
            type: String,
            trim: true,
            match: [/^\+?[\d\s\-().]{7,20}$/, "Please provide a valid phone number"],
          },
        passwordResetOTP: {
            type: String,
            default: null
        },
        passwordResetExpires: {
            type: Date,
            default: null
        },
        otpVerified: {
            type: Boolean,
            default: false
        },
        profilePicture: {
            url: {
                type: String,
                default: null
            },
            fileId: {
                type: String,
                default: null
            }
        } ,
    isActive: { type: Boolean, default: true },
    isRestricted: { type: Boolean, default: false },
    sellerProfile: {
        storeName: { type: String, trim: true },
        bio: { type: String, trim: true, maxlength: 500 },
        earnings: { type: Number, default: 0, min: 0 },
        isApproved: { type: Boolean, default: false },
      },
    googleId: { type: String, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

  },
  { timestamps: true }
)

userSchema.methods.isOTPExpired = function () {
  if (!this.passwordResetExpires) return true;
  return Date.now() > this.passwordResetExpires;
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ isActive: 1, isRestricted: 1 });
 
userSchema.virtual("fullAddress").get(function () {
  if (!this.address) return null;
  const { street, city, state, country, zipCode } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(", ");
});
 
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
 
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
 
userSchema.methods.softDelete = function () {
  this.isActive = false;
  return this.save();
};
 
userSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isRestricted: false });
};


const User = mongoose.model('User', userSchema);

module.exports = User;