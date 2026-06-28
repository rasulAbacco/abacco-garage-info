import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      marketingType,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        marketingType,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        marketingType: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Register User Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account disabled by admin",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const { password: _, ...userData } = user;

    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// GET EMPLOYEES
export const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        marketingType: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(200).json(employees);
  } catch (error) {
    console.error("Get Employees Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// TOGGLE USER STATUS
export const toggleEmployeeStatus = async (
  req,
  res
) => {
  try {

    const { id } = req.params;

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id,
        },

        data: {
          isActive:
            !user.isActive,
        },
      });

    res.status(200).json({
      message:
        "Status updated successfully",

      user: updatedUser,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};