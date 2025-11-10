const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    employeeId: { type: String, trim: true, lowercase: true, default: null },
    name: { type: String, trim: true, default: null },
    email: { type: String, required: true, trim: true, lowercase: true },
    department: { type: String, trim: true, default: null },
    position: { type: String, default: null },
    salary: { type: Number, default: null },
    joinDate: { type: Date, default: null },
    company: { type: String, trim: true, default: null },
    image: { type: String, default: null },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    role: { type: String, enum: ["superadmin","admin","employee"], default: "employee" },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
    resetOtp: { type: String, select: false, default: null },
    resetOtpExpire: { type: Date, select: false, default: null },
  },
  { timestamps: true }
);

/* =====================
   Pre-save and pre-update hooks (same as version 1)
===================== */
userSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.username) {
      let base = this.name ? this.name.toLowerCase().replace(/\s+/g, "") :
                 this.email ? this.email.split("@")[0].toLowerCase() : "user";
      this.username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    next();
  } catch (err) { next(err); }
});

async function hashPasswordHook(next) {
  const update = this.getUpdate();
  if (update?.password) update.password = await bcrypt.hash(update.password, 10);
  next();
}
userSchema.pre("findOneAndUpdate", hashPasswordHook);
userSchema.pre("updateOne", hashPasswordHook);

userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.resetOtp;
  delete obj.resetOtpExpire;
  return obj;
};

/* =====================
   Schema-level Indexes
===================== */
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index(
  { employeeId: 1 },
  { unique: true, partialFilterExpression: { employeeId: { $exists: true, $ne: null } } }
);
userSchema.index({ email: 1 }); // non-unique

module.exports = mongoose.model("User", userSchema);
