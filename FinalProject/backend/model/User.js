const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    // username must be unique
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: String,
    role: {
        type: String,
        default: 'user'
    }
});

// Create a model using the userSchema
const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;
