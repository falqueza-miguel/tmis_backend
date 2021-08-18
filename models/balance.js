const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BalanceSchema = new Schema({
    schoolYearFrom : { type: String, required: true },
    schoolYearTo : { type: String, required: true },
    semester : { type: String },

    student : { type: String, required: true },

    paymentTerms: { type: String },
    modeOfPayment: { type: String },

    transactionDate: { type: Array },
    transactionType: { type: Array },
    debit: { type: Array },
    credit: { type: Array }
});

module.exports = mongoose.model('Balance', BalanceSchema)