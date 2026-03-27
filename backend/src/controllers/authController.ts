import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import admin from "../lib/firebaseAdmin";
import { transporter } from "../lib/mailer";

// ✅ Register Controller
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role,firebaseUid } = req.body;

    // check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      firebaseUid
    });

    // issue JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // res.status(201).json({
    //   message: "User registered successfully",
    //   token
    // });
    res.status(201).json({
  message: "User registered successfully",
  token,
  user: newUser
});
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err });
  }
};

// ✅ Login Controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body; // only email + password here

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
  return res.status(400).json({ message: "Use Firebase login for this account" });
}

const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // generate OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// save OTP in user table
user.otp = otp;
user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
await user.save();
if (!process.env.EMAIL_USER) {
  return res.status(500).json({ message: "Email service not configured" });
}
// send OTP email
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: user.email,
  subject: "Your Login OTP",
  html: `
    <h2>Your OTP Code</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>This OTP expires in 5 minutes.</p>
  `
});

// send response to frontend
res.json({
  message: "OTP sent to your email",
  userId: user.id
});
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed", error: err });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {

    const { userId, otp } = req.body;

    const user = await User.findByPk(userId);

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "Invalid OTP request" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP correct → remove it
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};



// export const firebaseLogin = async (req: Request, res: Response) => {
//   const { token } = req.body;

//   try {
//     // 1️⃣ Verify Firebase ID token
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     const { uid, email, name } = decodedToken;

//     // 2️⃣ First check by firebaseUid
//     let user = await User.findOne({ where: { firebaseUid: uid } });

//     if (!user) {
//       // 3️⃣ If firebaseUid not found, check by email
//       user = await User.findOne({ where: { email } });

//       if (!user) {
//         // User does not exist at all → create new
//         user = await User.create({
//           name: name || "Firebase User",
//           email,
//           firebaseUid: uid,
//           role: "candidate",
//         });
//       } else {
//         // User exists by email → update firebaseUid
//         user.firebaseUid = uid;
//         await user.save();
//       }
//     }

//     // 🔹 Add OTP generation here
// const otp = Math.floor(100000 + Math.random() * 900000).toString();
// user.otp = otp;
// user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
// await user.save();

// if (!process.env.EMAIL_USER) {
//   return res.status(500).json({ message: "Email service not configured" });
// }

// // send OTP email
// await transporter.sendMail({
//   from: process.env.EMAIL_USER,
//   to: user.email,
//   subject: "Your Login OTP",
//   html: `
//     <h2>Your OTP Code</h2>
//     <p>Your OTP is:</p>
//     <h1>${otp}</h1>
//     <p>This OTP expires in 5 minutes.</p>
//   `
// });

// // send response to frontend with userId for OTP verification
// return res.json({
//   message: "OTP sent to your email",
//   userId: user.id
// });
    
//     // 4️⃣ Issue JWT for your backend
//     const jwtToken = jwt.sign(
//       { id: user.id, email: user.email, role: user.role },
//       process.env.JWT_SECRET as string,
//       { expiresIn: "1h" }
//     );

//     res.json({ message: "Login successful", token: jwtToken, user });
//   } catch (err) {
//     console.error("Firebase login error:", err);
//     res.status(500).json({ message: "Firebase login failed", error: err });
//   }
// };

export const firebaseLogin = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
   const { uid, email, name } = decodedToken;

if (!email) {
  return res.status(400).json({ message: "Email not available from Firebase" });
}
    

    let user = await User.findOne({ where: { firebaseUid: uid } });

    if (!user) {
      user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          name: name || "Firebase User",
          email,
          firebaseUid: uid,
          role: "candidate",
        });
      } else {
        user.firebaseUid = uid;
        user.password = null;
        await user.save();
      }
    }

    // OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Login OTP",
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `
    });

    return res.json({
      message: "OTP sent to your email",
      userId: user.id
    });

  } catch (err) {
    console.error("Firebase login error:", err);
    res.status(500).json({ message: "Firebase login failed" });
  }
};


export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // new OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    // send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your New OTP",
      html: `
        <h2>Your New OTP Code</h2>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `
    });

    res.json({
      message: "OTP resent successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};