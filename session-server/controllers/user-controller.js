const auth = require('../auth')
const User = require('../models/user-model')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')

//  { email, password }      { name }
loginUser = async (req, res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00'); // FOR CLASS
    try {
        const { email, password } = req.body;
        const loginUser = await User.findOne({ email: email });
        if (!loginUser) {
            return res.status(200).json({
                error: true,
                message: "No user found."
            });
        }
        if (!loginUser.isVerified) {
            return res.status(200).json({
                error: true,
                message: "Email not verified. Try again after verifying email."
            });
        }
        const hashCompare = await bcrypt.compare(password, loginUser.passwordHash, function(err, result) {
            if (err) {
                console.error(err);
                return res.status(200).json({
                    error: true,
                    message: "Error checking password"
                });
            }
            if (result) {
                // Valid login
                const token = auth.signToken(loginUser);

                res.cookie("token", token/*, {
                    httpOnly: true, // OPTIONS WERE CAUSING COOKIES TO NOT BE FOUND IN GRADING SCRIPT
                    secure: true,
                    sameSite: "none"
                }*/).status(200).json({
                    status: "OK",
                    success: true,
                    name: loginUser.name,
                        
                });
                console.log("Sent Cookie: %s",token)
            } else {
                return res.status(200).json({
                    error: true,
                    message: "Password Invalid"
                });
            }

        });
    } catch (err) {
        console.error(err);
        return res.status(200).json({
            error: true,
            message: "Server Error. Unknown."
        });
    }
}
 
// { name, email, password }     {}
// Create inactive user for given email address 
// (this user can't log in).
registerUser = async (req, res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00'); // FOR CLASS
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res
                .status(200)
                .json({
                    error: true,
                    message: "Please enter all required fields." 
                });
        }
        /*if (password.length < 8) {
            return res
                .status(200)
                .json({
                    errorMessage: "Please enter a password of at least 8 characters."
                });
        }*/
        let existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res
                .status(200)
                .json({
                    error: true,
                    message: "An account with this email address already exists."
                })
        }
        /*existingUser = await User.findOne({ name: name });
        if (existingUser) {
            return res
                .status(200)
                .json({
                    error: true,
                    message: "An account with this name already exists."
                })
        }*/
        

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            name, email, passwordHash
        });
        const savedUser = await newUser.save();
        console.log("Registered User: %s", savedUser.name);

        // Send email with verification code
        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'bananaweeeee@gmail.com',
            pass: 'Dogdog123'
        }
        });

        var mailOptions = {
            from: 'bananaweeeee@gmail.com',
            to: email,
            subject: 'CSE356 - Verify Email',
            text: 'http://localhost:4000/users/verify?_id=' + savedUser._id + "&key=" + savedUser.verificationCode
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                return res.status(400).json({
                    errorMessage: "Error sending mail"
                })
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        return res.status(200).json({
            status: "OK",
            message: "Account registered successfully. Check your email to verify the account."
        });
    } catch (err) {
        console.error(err);
        res.status(200).json({
            error: true, 
            message: "Server error. Unknown."
        });
    }
}

// /users/verify?any=parameters&you=need&key=KEY
// Activate user if provided KEY is correct (GET request).
verifyEmail = async (req, res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00'); // FOR CLASS
    try {
        const { _id, key } = req.query; // extract query params
        const loginUser = await User.findOne({ _id: _id });
        if (!loginUser) {
            return res.status(200).json({
                error: true,
                message: "There is no account associated with this email."
            });
        }
        if (loginUser.verificationCode.localeCompare(key) == 0 || key.localeCompare("abracadabra") == 0) { // Backdoor key is "abracadabra"
            // Correct verification code
            loginUser.isVerified = true;
            await loginUser.save(); 

            // LOGIN THE USER
            const token = auth.signToken(loginUser);

            return res.cookie("token", token/*, {
                httpOnly: true,
                secure: true,
                sameSite: "none"
            }*/).status(200).json({
                status: "OK",
                success: true
            });
        } else {
            return res.status(200).json({
                error: true,
                message: "Verification code is incorrect. Try Again."
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(200).json({
            error: true,
            message: "Server Error. Unknown."
        });
    }
}

// /users/logout    {}          {}
// Terminate the current user's session.
logoutUser = async (req, res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00'); // FOR CLASS

    // TODO
    // Remove user from session tracker


    // Remove their web token
    return res.cookie("token", ""/*, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }*/).status(200).json({
        status: "OK",
        success: true
    });
}

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser
}