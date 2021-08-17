const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CounterSchema = new Schema({
    counter: { type: Boolean, required: true },
    sequence_value: { type: Number, required: true }
});

module.exports = mongoose.model('Counter', CounterSchema)