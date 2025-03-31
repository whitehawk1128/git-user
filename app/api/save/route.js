import mysql from "mysql2/promise";
import { NextResponse } from "next/server";

export async function POST(req) {
  const userData = await req.json();
  const { id, login, name, avatarUrl, email, websiteUrl, createdAt, repositories } = userData;
  console.log(userData);

  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "hacker",
      database: "saved_users", // Change this to your database name
    });

    const formattedCreatedAt = createdAt.replace("Z", "");

    // Insert user into the database
    await connection.execute(
      `INSERT INTO users (id, login, name, avatarUrl, email, websiteUrl, createdAt, repositories) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,                       // User's ID
        login,                    // User's login
        name,                     // User's name
        avatarUrl || null,        // User's avatar URL (nullable)
        email || null,            // User's email (nullable)
        websiteUrl || null,       // User's website URL (nullable)
        formattedCreatedAt || null,        // User's account creation date (nullable)
        repositories || null      // Number of repositories (nullable)
      ]
    );
    
    await connection.end();
    return NextResponse.json({ message: "User saved successfully" });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}