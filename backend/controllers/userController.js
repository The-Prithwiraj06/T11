import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs";
import createToken from "../utils/createTokens.js";

export const createUser = asyncHandler(async (req, res, next) => {

  const { username, email, password } = req.body;

  if (!username || !email || !password) 
  {
     throw new Error("Please fill all the inputs");
  }

  console.log(req.body)

  const userExists = await User.findOne({ email });

  console.log(userExists)
  if (userExists) return res.status(400).send("User already exists!");

  
  const hashedPassword = await bcrypt.hash(password,10);
  
  const newUser = await User.create({ username, email, password: hashedPassword });

  try {
    createToken(res, newUser._id);
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    res.status(400);
    throw new Error("invalid user data");
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  console.log(existingUser)

  if (existingUser) {
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    console.log(isPasswordValid)

    if (isPasswordValid) {
      createToken(res, existingUser._id);
      res.status(201).json({
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
      });
    }
    return;
  }
});

export const logoutCurrentUser = asyncHandler(async (req, res, next) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    message: "Logged out successfully",
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found.");
  }
});

export const updateCurrentUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
  
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
  
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        user.password = hashedPassword;
      }
  
      const updatedUser = await user.save();
  
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  });
  
  export const deleteUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
  
    if (user) {
      if (user.isAdmin) {
        res.status(400);
        throw new Error("Cannot delete admin user");
      }
  
      await User.deleteOne({ _id: user._id });
      res.json({ message: "User removed" });
    } else {
      res.status(404);
      throw new Error("User not found.");
    }
  });
  
  export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
  
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  });
  
  export const updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
  
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.isAdmin = Boolean(req.body.isAdmin);
  
      const updatedUser = await user.save();
  
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  });
  
