const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TuitionSchema = new Schema({
    tuition: { type: Boolean, required: true },
    grade7: { type: Number, required: true },
    grade8: { type: Number, required: true },
    grade9: { type: Number, required: true },
    grade10: { type: Number, required: true },
    grade11: { type: Number, required: true },
    grade12: { type: Number, required: true },
});

module.exports = mongoose.model('Tuition', TuitionSchema)