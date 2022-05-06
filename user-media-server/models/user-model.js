const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        passwordHash: { type: String, required: true },
        isVerified: { type: Boolean, default: false, required: true},
        verificationCode: { type: String, default: Math.random().toString(36).substring(2), required: true },
        docs: { type: [Object], default: [] }
    },
    { timestamps: true },
)

module.exports = mongoose.model('User', UserSchema)
