// Importing modules
const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const csvToJson = require('csvtojson');
const nodemailer = require('nodemailer');

// Setting up rate limiter : maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = new RateLimit({
    windowMs : 1*60*1000, //1 minute
    max : 1
});

// app uses
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());
app.use(fileUpload());
app.use(limiter);

app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'youremailid@gmail.com',
        pass: 'yourpassword'
    }
});

const subject = "Type your subject";
const body = "Type your body";

// Helper functions
async function getData(filename) {
    const recipients = await csvToJson({
        trim: true
    }).fromFile(filename);

    // Code executes after recipients are fully loaded.
    for (i in recipients) {
        await mail(i.email, subject, body).catch(error => {
            console.log("Error while sending mail to: ", i.email);
        });
    }
};

async function mail(to, subject, body) {
    var mailOptions = {
        from: 'yourmailid@gmail.com',
        to: to,
        subject: subject,
        text: body
    }
    await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return Promise.reject(false);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    return Promise.resolve(true);

}

app.post('/upload', (req, res) => {
    async function main() {
        let sampleFile;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        sampleFile = req.files.sampleFile;
        uploadPath = __dirname + '/' + sampleFile.name;

        // Use the mv() method to place the file somewhere on your server
        await sampleFile.mv(uploadPath, function (err) {
            if (err)
                return res.status(500).send(err);


            res.status(200).json({
                "success": true
            });
        });
        await getData(sampleFile.name)
    }
    main();
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});