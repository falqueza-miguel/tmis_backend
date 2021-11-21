const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BalanceSchema = new Schema({
    schoolYearFrom : { type: String, required: true },
    schoolYearTo : { type: String, required: true },
    yearLevel : { type: String },
    semester : { type: String },

    student : { type: String, required: true }, //student _id

    paymentTerms: { type: String },
    modeOfPayment: { type: String },

    transactionDate: { type: Array },
    transactionType: { type: Array },
    debit: { type: Array },
    credit: { type: Array },

    paid: { type: Array },
    paidWhen: { type: Array },

    emailSched: [{type: String}],
    emailSent: [{type: Boolean}],
    emailDone: { type: Boolean }
}, { timestamps: true });

module.exports = mongoose.model('Balance', BalanceSchema)